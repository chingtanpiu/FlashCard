
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Download, 
  Upload, 
  Search,
  XCircle,
  Settings2,
  Shuffle,
  Target,
  Check,
  BarChart3
} from 'lucide-react';
import { Flashcard, BatchInputRow, Familiarity } from './types';
import FlashcardItem from './components/FlashcardItem';
import BatchCreateModal from './components/BatchCreateModal';
import ConflictResolverModal from './components/ConflictResolverModal';
import EditCardModal from './components/EditCardModal';
import RandomReviewModal from './components/RandomReviewModal';
import StatisticsModal from './components/StatisticsModal';

const App: React.FC = () => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isRandomReviewOpen, setIsRandomReviewOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [tagLogic, setTagLogic] = useState<'AND' | 'OR'>('OR');
  const [pendingConflicts, setPendingConflicts] = useState<{ existing: Flashcard; incoming: Flashcard }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFamiliarities, setSelectedFamiliarities] = useState<Familiarity[]>(['未知', '陌生', '可能会忘', '熟悉']);

  // 初始化加载
  useEffect(() => {
    const saved = localStorage.getItem('flashcards_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const migrating = parsed.map((c: any) => ({
          ...c,
          familiarity: (['熟悉', '可能会忘', '陌生', '未知'].includes(c.familiarity)) ? c.familiarity : '未知'
        }));
        setCards(migrating);
      } catch (e) {
        console.error("无法解析保存的数据", e);
      }
    }
  }, []);

  // 持久化存储
  useEffect(() => {
    localStorage.setItem('flashcards_data', JSON.stringify(cards));
  }, [cards]);

  // 提取所有标签
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    cards.forEach(card => card.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [cards]);

  // 过滤逻辑
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      const matchesSearch = card.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            card.answer.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesTags = true;
      if (selectedTags.length > 0) {
        if (tagLogic === 'AND') {
          matchesTags = selectedTags.every(tag => card.tags.includes(tag));
        } else {
          matchesTags = selectedTags.some(tag => card.tags.includes(tag));
        }
      }

      const matchesFamiliarity = selectedFamiliarities.includes(card.familiarity);
      
      return matchesSearch && matchesTags && matchesFamiliarity;
    });
  }, [cards, searchTerm, selectedTags, selectedFamiliarities, tagLogic]);

  const handleUpdateFamiliarity = (id: string, familiarity: Familiarity) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, familiarity } : c));
  };

  const handleDeleteCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateCard = (updatedCard: Flashcard) => {
    const isDuplicate = cards.some(c => 
      c.id !== updatedCard.id && 
      c.question.trim().toLowerCase() === updatedCard.question.trim().toLowerCase()
    );

    if (isDuplicate) {
      alert('修改失败：题库中已存在相同的问题。');
      return;
    }

    setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
    setEditingCard(null);
  };

  const processIncomingCards = (incoming: Flashcard[]) => {
    const conflicts: { existing: Flashcard; incoming: Flashcard }[] = [];
    const safeToAdd: Flashcard[] = [];
    const batchProcessedQuestions = new Map<string, Flashcard>();

    incoming.forEach(newCard => {
      const qKey = newCard.question.trim().toLowerCase();
      const inDB = cards.find(c => c.question.trim().toLowerCase() === qKey);
      
      if (inDB) {
        conflicts.push({ existing: inDB, incoming: newCard });
      } else {
        const inBatch = batchProcessedQuestions.get(qKey);
        if (inBatch) {
          conflicts.push({ existing: inBatch, incoming: newCard });
        } else {
          safeToAdd.push(newCard);
          batchProcessedQuestions.set(qKey, newCard);
        }
      }
    });

    if (safeToAdd.length > 0) {
      setCards(prev => [...prev, ...safeToAdd]);
    }

    if (conflicts.length > 0) {
      setPendingConflicts(conflicts);
    } else if (safeToAdd.length > 0) {
      alert(`成功添加 ${safeToAdd.length} 张闪卡`);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allMappedCards: Flashcard[] = [];
    let errorCount = 0;

    const filePromises = Array.from(files).map((file: File) => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const json = JSON.parse(event.target?.result as string);
            const dataArray = Array.isArray(json) ? json : [json];
            
            const mapped = dataArray.map((item: any) => ({
              id: String(item.题目id || item.id || `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`),
              question: String(item.问题 || item.question || ''),
              answer: String(item.答案 || item.answer || ''),
              tags: Array.isArray(item.tags) ? item.tags : (item.标签 ? String(item.标签).split(/[,，]/).map(t => t.trim()).filter(t => t !== '') : []),
              familiarity: (['熟悉', '可能会忘', '陌生', '未知'].includes(item.熟悉度) ? item.熟悉度 : '未知') as Familiarity
            }));
            allMappedCards.push(...mapped);
          } catch (err) {
            console.error(`解析文件 ${file.name} 出错:`, err);
            errorCount++;
          }
          resolve();
        };
        reader.onerror = () => {
          errorCount++;
          resolve();
        };
        reader.readAsText(file);
      });
    });

    await Promise.all(filePromises);

    if (errorCount > 0) {
      alert(`有 ${errorCount} 个文件读取或解析失败。`);
    }

    if (allMappedCards.length > 0) {
      processIncomingCards(allMappedCards);
    }
    
    e.target.value = ''; 
  };

  const handleExport = () => {
    if (cards.length === 0) return;
    const exportData = cards.map(c => ({
      "题目id": c.id,
      "问题": c.question,
      "答案": c.answer,
      "标签": c.tags.join(', '),
      "熟悉度": c.familiarity
    }));

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `闪卡导出_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBatchCreate = (newRows: BatchInputRow[]) => {
    const newCards: Flashcard[] = newRows.map(row => ({
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      question: row.question,
      answer: row.answer,
      tags: row.tags.split(/[,，]/).map(t => t.trim()).filter(t => t !== ''),
      familiarity: '未知'
    }));
    processIncomingCards(newCards);
    setIsBatchModalOpen(false);
  };

  const resolveConflicts = (resolutions: Flashcard[]) => {
    setCards(prev => {
      let nextCards = [...prev];
      resolutions.forEach(resolved => {
        const index = nextCards.findIndex(c => c.question.trim().toLowerCase() === resolved.question.trim().toLowerCase());
        if (index !== -1) {
          nextCards[index] = resolved;
        } else {
          nextCards.push(resolved);
        }
      });
      return nextCards;
    });
    setPendingConflicts([]);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleFamiliarityFilter = (f: Familiarity) => {
    setSelectedFamiliarities(prev => 
      prev.includes(f) ? (prev.length > 1 ? prev.filter(item => item !== f) : prev) : [...prev, f]
    );
  };

  const familiarityList: Familiarity[] = ['未知', '陌生', '可能会忘', '熟悉'];

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-end mb-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsRandomReviewOpen(true)}
                disabled={filteredCards.length === 0}
                className={`p-2.5 rounded-full shadow-lg transition-all active:scale-90 flex items-center gap-2 px-4 ${
                  filteredCards.length === 0 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'
                }`}
              >
                <Shuffle className="w-5 h-5" />
                <span className="text-sm font-bold hidden sm:inline">随机抽题</span>
              </button>
              
              <div className="w-px h-6 bg-gray-200 mx-1" />

              <button 
                onClick={() => setIsStatsOpen(true)}
                disabled={cards.length === 0}
                className={`p-2.5 bg-white border border-gray-200 text-indigo-600 rounded-full shadow-sm active:scale-90 transition-all hover:bg-gray-50 ${cards.length === 0 ? 'opacity-30' : ''}`}
                title="统计"
              >
                <BarChart3 className="w-6 h-6" />
              </button>

              <button 
                onClick={() => setIsBatchModalOpen(true)}
                className="p-2.5 bg-white border border-gray-200 text-indigo-600 rounded-full shadow-sm active:scale-90 transition-all hover:bg-gray-50"
              >
                <Plus className="w-6 h-6" />
              </button>
              <label 
                className="p-2.5 bg-white border border-gray-200 text-indigo-600 rounded-full shadow-sm cursor-pointer hover:bg-gray-50 active:scale-90 transition-all"
              >
                <Download className="w-6 h-6" />
                <input type="file" accept=".json" onChange={handleImport} className="hidden" multiple />
              </label>
              <button 
                onClick={handleExport}
                disabled={cards.length === 0}
                className={`p-2.5 bg-white border border-gray-200 text-indigo-600 rounded-full shadow-sm transition-all ${
                  cards.length === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-50 active:scale-90'
                }`}
              >
                <Upload className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="搜索问题或答案..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {familiarityList.map(f => {
                const isActive = selectedFamiliarities.includes(f);
                return (
                  <button 
                    key={f}
                    onClick={() => toggleFamiliarityFilter(f)}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-black border transition-all flex items-center gap-1.5 ${
                      isActive 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105' 
                      : 'bg-white text-gray-400 border-gray-200 opacity-60'
                    }`}
                  >
                    {isActive && <Check className="w-3 h-3" />}
                    {f}
                  </button>
                );
              })}

              <div className="h-6 w-px bg-gray-200 flex-shrink-0 mx-1" />

              <button 
                onClick={() => setTagLogic(tagLogic === 'AND' ? 'OR' : 'AND')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black border transition-all flex items-center gap-1.5 ${
                  tagLogic === 'AND' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}
              >
                <Settings2 className="w-3 h-3" />
                标签: {tagLogic === 'AND' ? '且' : '或'}
              </button>

              <div className="h-6 w-px bg-gray-200 flex-shrink-0 mx-1" />

              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    selectedTags.includes(tag) 
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm' 
                    : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button onClick={() => setSelectedTags([])} className="flex-shrink-0 px-3 py-1 text-xs text-red-500 font-bold">清除标签</button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredCards.map(card => (
              <FlashcardItem 
                key={card.id} 
                card={card} 
                onUpdateFamiliarity={handleUpdateFamiliarity}
                onDelete={handleDeleteCard}
                onEdit={() => setEditingCard(card)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 text-gray-400">
            <XCircle className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="text-gray-500 font-medium">没找到匹配的卡片</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-8 py-3 rounded-full shadow-xl border border-gray-100 flex items-center gap-8 z-40">
        <div className="text-center">
          <div className="text-[10px] text-gray-400 uppercase font-black">总数</div>
          <div className="text-xl font-black text-indigo-600 leading-none">{cards.length}</div>
        </div>
        <div className="w-px h-6 bg-gray-200" />
        <div className="text-center">
          <div className="text-[10px] text-gray-400 uppercase font-black">当前展示</div>
          <div className="text-xl font-black text-indigo-600 leading-none">{filteredCards.length}</div>
        </div>
      </div>

      <BatchCreateModal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} onSubmit={handleBatchCreate} />
      <ConflictResolverModal conflicts={pendingConflicts} onResolve={resolveConflicts} onCancel={() => setPendingConflicts([])} />
      {editingCard && <EditCardModal card={editingCard} onClose={() => setEditingCard(null)} onSave={handleUpdateCard} />}
      {isRandomReviewOpen && (
        <RandomReviewModal 
          cards={filteredCards} 
          onClose={() => setIsRandomReviewOpen(false)} 
          onUpdateFamiliarity={handleUpdateFamiliarity} 
          onDelete={handleDeleteCard} 
          onEdit={(card) => { setIsRandomReviewOpen(false); setEditingCard(card); }} 
        />
      )}
      <StatisticsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} cards={cards} />
    </div>
  );
};

export default App;

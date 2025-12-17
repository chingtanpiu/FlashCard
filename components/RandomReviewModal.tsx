
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Shuffle, ArrowRight, CheckCircle2, AlertCircle, HelpCircle, Trophy, Home, RotateCcw } from 'lucide-react';
import { Flashcard, Familiarity } from '../types';
import FlashcardItem from './FlashcardItem';

interface RandomReviewModalProps {
  cards: Flashcard[];
  onClose: () => void;
  onUpdateFamiliarity: (id: string, familiarity: Familiarity) => void;
  onDelete: (id: string) => void;
  onEdit: (card: Flashcard) => void;
}

const RandomReviewModal: React.FC<RandomReviewModalProps> = ({ 
  cards, 
  onClose, 
  onUpdateFamiliarity,
  onDelete, 
  onEdit 
}) => {
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [isFinished, setIsFinished] = useState(false);

  // 计算进度
  const progressCount = seenIds.size;
  const totalCount = cards.length;
  const progressPercentage = totalCount > 0 ? (progressCount / totalCount) * 100 : 0;

  // 加权随机抽题逻辑
  const pickRandomCard = useCallback(() => {
    if (cards.length === 0) return;

    // 如果所有题目都已经看过一遍，则进入结束状态
    if (seenIds.size >= totalCount && currentCardId !== null) {
      setIsFinished(true);
      return;
    }

    // 权重配置：未知和陌生的卡片拥有更高的被抽中频率
    const weights: Record<Familiarity, number> = {
      '未知': 8, // 新卡片最优先展示
      '陌生': 5,
      '可能会忘': 3,
      '熟悉': 1
    };

    // 优先从还没看过的题目中抽取，以确保能走完进度条
    const unseenCards = cards.filter(c => !seenIds.has(c.id));
    const pool = unseenCards.length > 0 ? unseenCards : cards;

    const weightedCards = pool.map(c => ({
      ...c,
      weight: weights[c.familiarity] || 1
    }));

    const totalWeight = weightedCards.reduce((acc, c) => acc + c.weight, 0);
    let randomNum = Math.random() * totalWeight;

    let selectedId = pool[0].id;
    for (const card of weightedCards) {
      if (randomNum < card.weight) {
        selectedId = card.id;
        break;
      }
      randomNum -= card.weight;
    }

    // 如果还有未看的题目，且随机到了刚看过的题目，重新抽（除非只剩这一张）
    if (pool.length > 1 && selectedId === currentCardId) {
      return pickRandomCard();
    }

    setCurrentCardId(selectedId);
    setAnimationKey(prev => prev + 1);
    
    // 更新已查看集合
    setSeenIds(prev => {
      const next = new Set(prev);
      next.add(selectedId);
      return next;
    });
  }, [cards, currentCardId, seenIds, totalCount]);

  const currentCard = useMemo(() => {
    return cards.find(c => c.id === currentCardId) || null;
  }, [cards, currentCardId]);

  useEffect(() => {
    if (!currentCardId && cards.length > 0) {
      pickRandomCard();
    }
  }, [cards, currentCardId, pickRandomCard]);

  useEffect(() => {
    if (currentCardId && !cards.find(c => c.id === currentCardId)) {
      if (cards.length > 0) pickRandomCard();
      else onClose();
    }
  }, [cards, currentCardId, pickRandomCard, onClose]);

  const handleFamiliarityFeedback = (feedback: Familiarity) => {
    if (!currentCardId) return;
    onUpdateFamiliarity(currentCardId, feedback);
    setTimeout(pickRandomCard, 200);
  };

  const handleRestart = () => {
    setSeenIds(new Set());
    setIsFinished(false);
    setCurrentCardId(null);
    // 强制触发一次抽取
    setTimeout(() => {
      pickRandomCard();
    }, 10);
  };

  if (isFinished) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-indigo-900/90 backdrop-blur-xl" onClick={onClose} />
        <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 text-center shadow-2xl animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">复习完成！</h2>
          <p className="text-gray-500 mb-8 font-medium">
            你已经回顾了本次筛选出的全部 <span className="text-indigo-600 font-black">{totalCount}</span> 张闪卡。
          </p>
          
          <div className="space-y-3">
            <button 
              onClick={handleRestart}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100"
            >
              <RotateCcw className="w-5 h-5" />
              继续答题
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 bg-gray-50 text-gray-600 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-gray-100 active:scale-95 transition-all"
            >
              <Home className="w-5 h-5" />
              返回主页
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-indigo-900/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-lg flex flex-col gap-6 items-center">
        {/* Header */}
        <div className="w-full flex justify-between items-center px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-xl shadow-lg">
              <Shuffle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-black text-lg">复习进行中</h2>
              <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">
                当前筛选题数: {totalCount}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Section */}
        <div className="w-full px-2 space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">复习进度</span>
            <span className="text-white text-xs font-black">
              {progressCount} / {totalCount} 
              <span className="text-indigo-300 ml-1 opacity-60">({Math.round(progressPercentage)}%)</span>
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div 
          key={animationKey}
          className="w-full animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500"
        >
          <FlashcardItem 
            card={currentCard}
            onUpdateFamiliarity={onUpdateFamiliarity}
            onDelete={onDelete}
            onEdit={() => onEdit(currentCard)}
          />
        </div>

        {/* Controls */}
        <div className="w-full flex flex-col items-center gap-4">
          <div className="grid grid-cols-3 gap-3 w-full">
            <button 
              onClick={() => handleFamiliarityFeedback('熟悉')}
              className="flex flex-col items-center gap-2 p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl transition-all active:scale-95 group"
            >
              <CheckCircle2 className="w-6 h-6 text-emerald-400 group-hover:scale-110" />
              <span className="text-emerald-400 text-xs font-black uppercase">熟悉</span>
            </button>
            <button 
              onClick={() => handleFamiliarityFeedback('可能会忘')}
              className="flex flex-col items-center gap-2 p-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-2xl transition-all active:scale-95 group"
            >
              <HelpCircle className="w-6 h-6 text-amber-400 group-hover:scale-110" />
              <span className="text-amber-400 text-xs font-black uppercase text-center">可能会忘</span>
            </button>
            <button 
              onClick={() => handleFamiliarityFeedback('陌生')}
              className="flex flex-col items-center gap-2 p-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-2xl transition-all active:scale-95 group"
            >
              <AlertCircle className="w-6 h-6 text-rose-400 group-hover:scale-110" />
              <span className="text-rose-400 text-xs font-black uppercase text-center">陌生</span>
            </button>
          </div>

          <button 
            onClick={pickRandomCard}
            className="mt-2 group px-8 py-4 bg-white text-indigo-600 rounded-3xl font-black text-lg shadow-2xl flex items-center gap-4 hover:scale-105 active:scale-95 transition-all"
          >
            跳过并换一题
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RandomReviewModal;


import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Check, Edit2 } from 'lucide-react';
import { Flashcard } from '../types';

interface ConflictResolverModalProps {
  conflicts: { existing: Flashcard; incoming: Flashcard }[];
  onResolve: (resolutions: Flashcard[]) => void;
  onCancel: () => void;
}

const ConflictResolverModal: React.FC<ConflictResolverModalProps> = ({ conflicts, onResolve, onCancel }) => {
  const [resolutions, setResolutions] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customAnswer, setCustomAnswer] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (conflicts.length > 0 && currentIndex < conflicts.length) {
      setCustomAnswer(conflicts[currentIndex].existing.answer);
      setIsEditing(false);
    }
  }, [currentIndex, conflicts]);

  if (conflicts.length === 0) return null;

  const currentConflict = conflicts[currentIndex];

  const handleResolution = (answer: string) => {
    const resolvedCard: Flashcard = {
      ...currentConflict.existing,
      answer: answer
    };
    
    const newResolutions = [...resolutions, resolvedCard];
    
    if (currentIndex + 1 < conflicts.length) {
      setResolutions(newResolutions);
      setCurrentIndex(currentIndex + 1);
    } else {
      onResolve(newResolutions);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onCancel} />
      <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b flex items-center justify-between bg-amber-50">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="text-lg font-black uppercase tracking-tight">问题冲突 ({currentIndex + 1}/{conflicts.length})</h2>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-amber-100 rounded-full text-amber-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
          <div className="space-y-2">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">检测到重复问题</div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xl font-bold text-gray-800">
              {currentConflict.existing.question}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Option 1: Existing */}
            <button 
              onClick={() => handleResolution(currentConflict.existing.answer)}
              className="group relative p-5 bg-white border-2 border-gray-100 rounded-2xl text-left hover:border-indigo-600 transition-all hover:shadow-lg active:scale-[0.98]"
            >
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-indigo-600">现有答案</div>
              <div className="text-gray-700 font-medium">{currentConflict.existing.answer}</div>
              <Check className="absolute top-4 right-4 w-4 h-4 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Option 2: Incoming */}
            <button 
              onClick={() => handleResolution(currentConflict.incoming.answer)}
              className="group relative p-5 bg-white border-2 border-gray-100 rounded-2xl text-left hover:border-indigo-600 transition-all hover:shadow-lg active:scale-[0.98]"
            >
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-indigo-600">新导入答案</div>
              <div className="text-gray-700 font-medium">{currentConflict.incoming.answer}</div>
              <Check className="absolute top-4 right-4 w-4 h-4 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          {/* Option 3: Edit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">自定义编辑答案</div>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline"
                >
                  <Edit2 className="w-3 h-3" /> 点击编辑
                </button>
              )}
            </div>
            
            <div className={`transition-all ${isEditing ? 'opacity-100 scale-100' : 'opacity-50 pointer-events-none'}`}>
              <textarea 
                value={customAnswer}
                onChange={(e) => setCustomAnswer(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
                rows={3}
                placeholder="在此输入新的合并答案..."
              />
              {isEditing && (
                <button 
                  onClick={() => handleResolution(customAnswer)}
                  className="mt-3 w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                >
                  采用此编辑版本
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-8 py-4 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-tighter text-center">
          请选择一个答案以继续。冲突处理后将自动同步至题库。
        </div>
      </div>
    </div>
  );
};

export default ConflictResolverModal;

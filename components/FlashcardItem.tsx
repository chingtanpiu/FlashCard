
import React, { useState, useEffect } from 'react';
import { Trash2, ChevronRight, RotateCcw, AlertCircle, Edit3, Target } from 'lucide-react';
import { Flashcard, Familiarity } from '../types';

interface FlashcardItemProps {
  card: Flashcard;
  onUpdateFamiliarity: (id: string, familiarity: Familiarity) => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
}

const FlashcardItem: React.FC<FlashcardItemProps> = ({ card, onUpdateFamiliarity, onDelete, onEdit }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let timer: number;
    if (confirmDelete) {
      timer = window.setTimeout(() => setConfirmDelete(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [confirmDelete]);

  const handleToggleFlip = () => {
    setIsFlipped(!isFlipped);
    setConfirmDelete(false);
  };

  const handleCycleFamiliarity = (e: React.MouseEvent) => {
    e.stopPropagation();
    const states: Familiarity[] = ['未知', '陌生', '可能会忘', '熟悉'];
    const currentIndex = states.indexOf(card.familiarity);
    const nextIndex = (currentIndex + 1) % states.length;
    onUpdateFamiliarity(card.id, states[nextIndex]);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(card.id);
    } else {
      setConfirmDelete(true);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const familiarityConfig = {
    '熟悉': { color: 'bg-emerald-50 text-emerald-700 border-emerald-100', iconColor: 'text-emerald-500' },
    '可能会忘': { color: 'bg-amber-50 text-amber-700 border-amber-100', iconColor: 'text-amber-500' },
    '陌生': { color: 'bg-rose-50 text-rose-700 border-rose-100', iconColor: 'text-rose-500' },
    '未知': { color: 'bg-gray-100 text-gray-500 border-gray-200', iconColor: 'text-gray-400' }
  };

  const currentStatus = familiarityConfig[card.familiarity] || familiarityConfig['未知'];

  return (
    <div 
      className="relative h-72 w-full perspective-1000 cursor-pointer select-none touch-manipulation"
      onClick={handleToggleFlip}
    >
      <div className="relative w-full h-full transform-style-3d duration-500 transition-transform" 
           style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
        
        {/* 正面 */}
        <div className="absolute inset-0 backface-hidden bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-1 flex-wrap max-h-16 overflow-hidden no-scrollbar">
                {card.tags.length > 0 ? card.tags.map(tag => (
                  <span key={tag} className="text-[9px] px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full font-black uppercase">
                    #{tag}
                  </span>
                )) : null}
              </div>
              <button 
                onClick={handleCycleFamiliarity}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black transition-all active:scale-95 ${currentStatus.color}`}
              >
                <Target className={`w-3 h-3 ${currentStatus.iconColor}`} />
                {card.familiarity}
              </button>
            </div>
            <h3 className="text-xl font-bold text-gray-800 line-clamp-5 leading-tight break-words">
              {card.question}
            </h3>
          </div>
          
          <div className="flex justify-between items-center border-t border-gray-50 pt-4">
            <span className="text-[10px] font-black text-gray-300 flex items-center gap-1 uppercase tracking-widest">
              点击翻转 <ChevronRight className="w-3 h-3" />
            </span>
            <div className="flex gap-1.5">
              <button onClick={handleEdit} className="p-3 rounded-2xl text-indigo-500 bg-indigo-50 hover:bg-indigo-100 transition-all active:scale-90">
                <Edit3 className="w-5 h-5" />
              </button>
              <button onClick={handleDelete} className={`p-3 rounded-2xl transition-all active:scale-90 flex items-center gap-1 ${confirmDelete ? 'bg-red-500 text-white' : 'text-red-500 bg-red-50 hover:bg-red-100'}`}>
                {confirmDelete ? <AlertCircle className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* 背面 */}
        <div className="absolute inset-0 backface-hidden bg-indigo-600 rounded-3xl p-6 shadow-xl flex flex-col justify-between" style={{ transform: 'rotateY(180deg)' }}>
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-50">答案</div>
            <div className="w-full overflow-y-auto max-h-40 no-scrollbar">
              <p className="text-white text-2xl font-black leading-tight px-2 break-words">
                {card.answer}
              </p>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-indigo-500/50">
             <span className="text-[10px] font-black text-indigo-300/80 flex items-center gap-1 uppercase tracking-widest">
                <RotateCcw className="w-3 h-3" /> 点击返回
             </span>
             <div className="flex gap-1.5">
              <button onClick={handleCycleFamiliarity} className="p-3 rounded-2xl bg-white/10 text-white font-black text-[10px] active:scale-90 transition-all">
                {card.familiarity}
              </button>
              <button onClick={handleEdit} className="p-3 rounded-2xl text-white bg-white/10 hover:bg-white/20 transition-all active:scale-90">
                <Edit3 className="w-5 h-5" />
              </button>
              <button onClick={handleDelete} className={`p-3 rounded-2xl transition-all active:scale-90 flex items-center gap-1 ${confirmDelete ? 'bg-white text-red-600' : 'bg-white/10 text-white hover:bg-red-500'}`}>
                {confirmDelete ? <AlertCircle className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
      `}</style>
    </div>
  );
};

export default FlashcardItem;


import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Flashcard } from '../types';

interface EditCardModalProps {
  card: Flashcard;
  onClose: () => void;
  onSave: (updatedCard: Flashcard) => void;
}

const EditCardModal: React.FC<EditCardModalProps> = ({ card, onClose, onSave }) => {
  const [question, setQuestion] = useState(card.question);
  const [answer, setAnswer] = useState(card.answer);
  const [tags, setTags] = useState(card.tags.join(', '));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      alert('问题和答案不能为空。');
      return;
    }

    const updatedCard: Flashcard = {
      ...card,
      question: question.trim(),
      answer: answer.trim(),
      tags: tags.split(/[,，]/).map(t => t.trim()).filter(t => t !== '')
    };

    onSave(updatedCard);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="px-6 py-5 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">编辑闪卡</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">问题</label>
            <textarea 
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-gray-900 outline-none min-h-[100px]"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="输入问题内容..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">答案</label>
            <textarea 
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-gray-900 outline-none min-h-[100px]"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="输入答案内容..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">标签 (逗号分隔)</label>
            <input 
              type="text"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-gray-900 outline-none"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="例如: 英语, 单词, 必背"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 active:scale-95 transition-all"
            >
              取消
            </button>
            <button 
              type="submit"
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <Save className="w-5 h-5" />
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCardModal;

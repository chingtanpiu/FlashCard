
import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, HelpCircle } from 'lucide-react';
import { BatchInputRow } from '../types';

interface BatchCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rows: BatchInputRow[]) => void;
}

const BatchCreateModal: React.FC<BatchCreateModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [rows, setRows] = useState<BatchInputRow[]>([{ question: '', answer: '', tags: '' }]);

  // 计算有效行数（问题和答案均不为空）
  const validRowsCount = useMemo(() => {
    return rows.filter(r => r.question.trim() !== '' && r.answer.trim() !== '').length;
  }, [rows]);

  if (!isOpen) return null;

  const addRow = () => {
    setRows([...rows, { question: '', answer: '', tags: '' }]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    } else {
      // 如果只有一行，则清空它而不是删除
      setRows([{ question: '', answer: '', tags: '' }]);
    }
  };

  const updateRow = (index: number, field: keyof BatchInputRow, value: string) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = rows.filter(r => r.question.trim() !== '' && r.answer.trim() !== '');
    if (validRows.length === 0) {
      alert('请至少填写一张完整的闪卡（包含问题和答案）');
      return;
    }
    onSubmit(validRows);
    setRows([{ question: '', answer: '', tags: '' }]); // Reset
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">批量创建闪卡</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-indigo-50 p-4 rounded-xl flex gap-3 text-indigo-700 text-sm">
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            <p>在这里快速输入多组问题和答案。标签请使用英文逗号分隔，例如："法律, 考试, 必背"。</p>
          </div>

          <div className="space-y-4">
            {rows.map((row, index) => (
              <div key={index} className="p-4 border rounded-2xl relative bg-gray-50 group">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">问题</label>
                    <textarea 
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 placeholder-gray-400"
                      rows={2}
                      value={row.question}
                      onChange={(e) => updateRow(index, 'question', e.target.value)}
                      placeholder="输入问题..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">答案</label>
                    <textarea 
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 placeholder-gray-400"
                      rows={2}
                      value={row.answer}
                      onChange={(e) => updateRow(index, 'answer', e.target.value)}
                      placeholder="输入答案..."
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">标签 (逗号分隔)</label>
                    <input 
                      type="text"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400"
                      value={row.tags}
                      onChange={(e) => updateRow(index, 'tags', e.target.value)}
                      placeholder="e.g. 英语, 单词"
                    />
                  </div>
                  {(rows.length > 1 || row.question || row.answer) && (
                    <button 
                      type="button"
                      onClick={() => removeRow(index)}
                      className="p-2 text-red-400 hover:text-red-500 mt-5"
                      title="删除此行"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button 
            type="button" 
            onClick={addRow}
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            继续添加
          </button>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            取消
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={validRowsCount === 0}
            className={`flex-1 py-3 rounded-2xl font-bold shadow-lg transition-all active:scale-[0.98] ${
              validRowsCount === 0 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                : 'bg-indigo-600 text-white shadow-indigo-200'
            }`}
          >
            确认创建 {validRowsCount > 0 ? `(${validRowsCount})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchCreateModal;

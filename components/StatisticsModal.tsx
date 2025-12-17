
import React, { useMemo } from 'react';
import { X, PieChart, Tag, Target } from 'lucide-react';
import { Flashcard, Familiarity } from '../types';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Flashcard[];
}

const StatisticsModal: React.FC<StatisticsModalProps> = ({ isOpen, onClose, cards }) => {
  if (!isOpen) return null;

  // 熟悉度统计
  const familiarityStats = useMemo(() => {
    const counts: Record<Familiarity, number> = {
      '未知': 0,
      '陌生': 0,
      '可能会忘': 0,
      '熟悉': 0
    };
    cards.forEach(c => {
      counts[c.familiarity]++;
    });
    return Object.entries(counts).map(([label, count]) => ({
      label: label as Familiarity,
      count,
      percent: cards.length > 0 ? (count / cards.length) * 100 : 0
    }));
  }, [cards]);

  // 标签统计
  const tagStats = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalTagOccurrences = 0;
    cards.forEach(c => {
      c.tags.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
        totalTagOccurrences++;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8) // 只取前 8 个
      .map(([label, count]) => ({
        label,
        count,
        percent: totalTagOccurrences > 0 ? (count / totalTagOccurrences) * 100 : 0
      }));
  }, [cards]);

  // SVG 饼图绘制工具 - 已修复为真正的圆形
  const PieChartSVG = ({ data, colors }: { data: { label: string, percent: number }[], colors: string[] }) => {
    let accumulatedPercent = 0;
    return (
      <svg viewBox="0 0 32 32" className="w-48 h-48 transform -rotate-90 rounded-full overflow-visible">
        {data.map((item, idx) => {
          if (item.percent <= 0) return null;
          const startPercent = accumulatedPercent;
          accumulatedPercent += item.percent;
          
          return (
            <circle
              key={idx}
              r="8"
              cx="16"
              cy="16"
              fill="transparent"
              stroke={colors[idx % colors.length]}
              strokeWidth="16"
              strokeDasharray={`${item.percent} 100`}
              strokeDashoffset={-startPercent}
              pathLength="100"
              className="transition-all duration-1000 ease-out"
            />
          );
        })}
      </svg>
    );
  };

  const familiarityColors = ['#9ca3af', '#f43f5e', '#f59e0b', '#10b981']; // 未知, 陌生, 可能会忘, 熟悉
  const tagColors = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-300">
        
        <div className="px-8 py-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <PieChart className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">库数据洞察</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-12 no-scrollbar">
          
          {/* 熟悉度统计 */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              <h3 className="font-black text-gray-700 uppercase text-sm tracking-widest">熟悉度分布</h3>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="relative flex-shrink-0">
                <PieChartSVG 
                  data={familiarityStats.map(s => ({ label: s.label, percent: s.percent }))} 
                  colors={familiarityColors} 
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="bg-white rounded-full w-20 h-20 shadow-xl flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-gray-800 leading-none">{cards.length}</span>
                      <span className="text-[8px] font-black text-gray-400 uppercase">总卡片</span>
                   </div>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                {familiarityStats.map((stat, idx) => (
                  <div key={stat.label} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: familiarityColors[idx] }} />
                      <span className="text-xs font-bold text-gray-500">{stat.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-gray-800">{stat.count}</span>
                      <span className="text-xs font-medium text-gray-400">{Math.round(stat.percent)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 标签统计 */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-500" />
              <h3 className="font-black text-gray-700 uppercase text-sm tracking-widest">热门标签比例</h3>
            </div>

            {tagStats.length > 0 ? (
              <div className="flex flex-col md:flex-row-reverse items-center gap-10">
                <div className="relative flex-shrink-0">
                  <PieChartSVG 
                    data={tagStats.map(s => ({ label: s.label, percent: s.percent }))} 
                    colors={tagColors} 
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white rounded-full w-20 h-20 shadow-xl flex flex-col items-center justify-center">
                       <span className="text-2xl font-black text-gray-800 leading-none">{tagStats.length}</span>
                       <span className="text-[8px] font-black text-gray-400 uppercase">核心标签</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-3 w-full">
                  {tagStats.map((stat, idx) => (
                    <div key={stat.label} className="group relative">
                      <div className="flex justify-between items-center mb-1 px-1">
                        <span className="text-xs font-black text-gray-600 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tagColors[idx] }} />
                          #{stat.label}
                        </span>
                        <span className="text-xs font-bold text-gray-400">{stat.count} 次</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${(stat.count / Math.max(...tagStats.map(s => s.count))) * 100}%`,
                            backgroundColor: tagColors[idx]
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 bg-gray-50 rounded-3xl text-center text-gray-400 font-medium border-2 border-dashed border-gray-100">
                还没有标签数据可供统计
              </div>
            )}
          </section>
        </div>

        <div className="px-8 py-6 bg-indigo-600 text-white flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase opacity-60">数据已实时同步</span>
              <span className="text-sm font-bold">坚持复习，将更多“陌生”转化为“熟悉”！</span>
           </div>
           <button 
             onClick={onClose}
             className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-black text-xs uppercase transition-all active:scale-95"
           >
             知道了
           </button>
        </div>
      </div>
    </div>
  );
};

export default StatisticsModal;

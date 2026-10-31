import React, { useState } from 'react';
import { Award, Crown, Sparkles, ChevronRight } from 'lucide-react';
import { QuestionItem, QuestionStatus } from '../types';

interface MonsterMapProps {
  questions: QuestionItem[];
  onSelectQuestion: (question: QuestionItem) => void;
}

export const MonsterMap: React.FC<MonsterMapProps> = ({ questions, onSelectQuestion }) => {
  const [filterStage, setFilterStage] = useState<'all' | QuestionStatus>('all');

  const groups: Record<QuestionStatus, QuestionItem[]> = {
    inbox: questions.filter((q) => q.status === 'inbox'),
    day1_ready: questions.filter((q) => q.status === 'day1_ready'),
    day2_boss: questions.filter((q) => q.status === 'day2_boss'),
    weekend_boss: questions.filter((q) => q.status === 'weekend_boss'),
    mastered: questions.filter((q) => q.status === 'mastered'),
  };

  const filteredList =
    filterStage === 'all' ? questions : questions.filter((q) => q.status === filterStage);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 4つの部屋（ライトナー仕分け状況サマリー） */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* ① Day1 / 未討伐 */}
        <button
          onClick={() => setFilterStage(filterStage === 'day1_ready' ? 'all' : 'day1_ready')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterStage === 'day1_ready'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-xl font-black font-mono">{groups.day1_ready.length}</span>
          </div>
          <div className="text-xs font-bold text-slate-800">① 明日やる</div>
          <div className="text-[10px] text-slate-500">Day1 インストール済</div>
        </button>

        {/* ② Day2 翌日ボス戦 */}
        <button
          onClick={() => setFilterStage(filterStage === 'day2_boss' ? 'all' : 'day2_boss')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterStage === 'day2_boss'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-lg">⚔️</span>
            <span className="text-xl font-black font-mono">{groups.day2_boss.length}</span>
          </div>
          <div className="text-xs font-bold text-slate-800">② 翌日ボス戦</div>
          <div className="text-[10px] text-slate-500">銀メダル挑戦</div>
        </button>

        {/* ③ 週末ボス戦（銀メダル） */}
        <button
          onClick={() => setFilterStage(filterStage === 'weekend_boss' ? 'all' : 'weekend_boss')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterStage === 'weekend_boss'
              ? 'bg-slate-50 border-slate-400 ring-2 ring-slate-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <Award className="w-5 h-5 text-slate-600" />
            <span className="text-xl font-black font-mono">{groups.weekend_boss.length}</span>
          </div>
          <div className="text-xs font-bold text-slate-800">③ 週末ボス戦</div>
          <div className="text-[10px] text-slate-500">銀メダル仮討伐中</div>
        </button>

        {/* ④ 殿堂入り（金キラキラ） */}
        <button
          onClick={() => setFilterStage(filterStage === 'mastered' ? 'all' : 'mastered')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterStage === 'mastered'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <span className="text-xl font-black font-mono">{groups.mastered.length}</span>
          </div>
          <div className="text-xs font-bold text-slate-800">④ 殿堂入り</div>
          <div className="text-[10px] text-slate-500">金キラキラ完全制覇！</div>
        </button>
      </div>

      {/* 問題一覧 */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-slate-800">モンスター一覧</span>
            <span className="text-xs text-slate-400 font-mono">({filteredList.length} 匹)</span>
          </div>
          {filterStage !== 'all' && (
            <button
              onClick={() => setFilterStage('all')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              フィルター解除
            </button>
          )}
        </div>

        {filteredList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            該当するモンスターはいません
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectQuestion(item)}
                className="p-4 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl p-1.5 bg-slate-100 rounded-xl">
                    {item.monster_icon || '👾'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800">{item.monster_name}</span>
                      {item.status === 'weekend_boss' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold badge-silver">
                          銀
                        </span>
                      )}
                      {item.status === 'mastered' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold badge-gold">
                          金
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{item.problem_plain_text}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-slate-400">
                  <span className="text-[11px] font-mono">{item.next_review_date || '完了'}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

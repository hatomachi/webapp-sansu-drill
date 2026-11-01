import React, { useState } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { QuestionItem, StageConfig } from '../types';
import { normalizeStatus } from '../services/storage';
import { getGemInfo } from '../utils/gemHelper';

interface MonsterMapProps {
  questions: QuestionItem[];
  stageConfig?: StageConfig;
  onSelectQuestion: (question: QuestionItem) => void;
}

export const MonsterMap: React.FC<MonsterMapProps> = ({
  questions,
  stageConfig = { stage1Label: '毎日', stage2Label: '水・土', stage3Label: '2週後' },
  onSelectQuestion,
}) => {
  const [filterStage, setFilterStage] = useState<'all' | 'stage1' | 'stage2' | 'stage3' | 'mastered'>('all');

  // ステータスを正規化してグルーピング
  const groups: Record<'stage1' | 'stage2' | 'stage3' | 'mastered', QuestionItem[]> = {
    stage1: questions.filter((q) => {
      const s = normalizeStatus(q.status);
      return s === 'stage1' || s === 'inbox';
    }),
    stage2: questions.filter((q) => normalizeStatus(q.status) === 'stage2'),
    stage3: questions.filter((q) => normalizeStatus(q.status) === 'stage3'),
    mastered: questions.filter((q) => normalizeStatus(q.status) === 'mastered'),
  };

  const filteredList =
    filterStage === 'all'
      ? questions
      : questions.filter((q) => {
          const s = normalizeStatus(q.status);
          if (filterStage === 'stage1') return s === 'stage1' || s === 'inbox';
          return s === filterStage;
        });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 4つの宝石ボックス（ライトナー仕分けサマリー） */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* ① ステージ1 */}
        <button
          onClick={() => setFilterStage(filterStage === 'stage1' ? 'all' : 'stage1')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterStage === 'stage1'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <span className="text-xl font-black font-mono">{groups.stage1.length}</span>
          </div>
          <div className="text-xs font-bold text-slate-800">① {stageConfig.stage1Label || '毎日'}</div>
          <div className="text-[10px] text-slate-500">初回・再挑戦</div>
        </button>

        {/* ② ステージ2: オパール */}
        <button
          onClick={() => setFilterStage(filterStage === 'stage2' ? 'all' : 'stage2')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterStage === 'stage2'
              ? 'bg-stone-100 border-stone-400 ring-2 ring-stone-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl">⚪️</span>
            <span className="text-xl font-black font-mono text-stone-700">{groups.stage2.length}</span>
          </div>
          <div className="text-xs font-bold text-slate-800">② オパール</div>
          <div className="text-[10px] text-slate-500">{stageConfig.stage2Label || '水・土'} (1回クリア)</div>
        </button>

        {/* ③ ステージ3: サファイア */}
        <button
          onClick={() => setFilterStage(filterStage === 'stage3' ? 'all' : 'stage3')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterStage === 'stage3'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl">🔷</span>
            <span className="text-xl font-black font-mono text-blue-700">{groups.stage3.length}</span>
          </div>
          <div className="text-xs font-bold text-slate-800">③ サファイア</div>
          <div className="text-[10px] text-slate-500">{stageConfig.stage3Label || '2週後'} (2回クリア)</div>
        </button>

        {/* ④ 殿堂入り: ダイヤモンド */}
        <button
          onClick={() => setFilterStage(filterStage === 'mastered' ? 'all' : 'mastered')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterStage === 'mastered'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl">💎</span>
            <span className="text-xl font-black font-mono text-amber-700">{groups.mastered.length}</span>
          </div>
          <div className="text-xs font-bold text-slate-800">④ ダイヤモンド</div>
          <div className="text-[10px] text-slate-500">完全制覇・殿堂入り！</div>
        </button>
      </div>

      {/* 宝石コレクション問題一覧 */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-slate-800">宝石コレクション一覧</span>
            <span className="text-xs text-slate-400 font-mono">({filteredList.length} 問)</span>
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
            該当する問題はありません
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((item) => {
              const itemStatus = normalizeStatus(item.status);
              const gem = getGemInfo(itemStatus);
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectQuestion(item)}
                  className="p-4 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl p-2 bg-slate-100 rounded-xl flex items-center justify-center">
                      {item.monster_icon || gem.icon}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-800">
                          {item.monster_name || item.category}
                        </span>
                        {/* 宝石バッジ */}
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${gem.badgeClass}`}>
                          <span>{gem.icon}</span>
                          <span>{gem.name}</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{item.problem_plain_text}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-400">
                    <span className="text-[11px] font-mono">
                      {item.next_review_date ? `${item.next_review_date} 復習` : '制覇完了'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

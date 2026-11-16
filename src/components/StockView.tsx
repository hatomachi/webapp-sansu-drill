import React, { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { QuestionItem, StageConfig } from '../types';
import { normalizeStatus } from '../services/storage';
import {
  getGemInfo,
  getQuestionTitle,
  getStageBadgeText,
} from '../utils/gemHelper';

interface StockViewProps {
  questions: QuestionItem[];
  selectedIds: string[];
  printedTodayIds: string[];
  stageConfig: StageConfig;
  onToggleSelect: (questionId: string) => void;
  onOpenDetail: (question: QuestionItem) => void;
}

type FilterKey = 'all' | 'stage1' | 'stage2' | 'stage3' | 'mastered';

export const StockView: React.FC<StockViewProps> = ({
  questions,
  selectedIds,
  printedTodayIds,
  stageConfig,
  onToggleSelect,
  onOpenDetail,
}) => {
  const [filterStage, setFilterStage] = useState<FilterKey>('all');

  const groups: Record<Exclude<FilterKey, 'all'>, QuestionItem[]> = {
    stage1: questions.filter((q) => {
      const s = normalizeStatus(q.status);
      return s === 'stage1' || s === 'inbox';
    }),
    stage2: questions.filter((q) => normalizeStatus(q.status) === 'stage2'),
    stage3: questions.filter((q) => normalizeStatus(q.status) === 'stage3'),
    mastered: questions.filter((q) => normalizeStatus(q.status) === 'mastered'),
  };

  const filteredList =
    filterStage === 'all' ? questions : groups[filterStage];

  const filterCards: Array<{
    key: Exclude<FilterKey, 'all'>;
    label: string;
    subLabel: string;
    count: number;
    activeClass: string;
  }> = [
    {
      key: 'stage1',
      label: '1回目',
      subLabel: stageConfig.stage1Label || '毎日',
      count: groups.stage1.length,
      activeClass: 'bg-amber-50 border-amber-400 ring-2 ring-amber-100',
    },
    {
      key: 'stage2',
      label: '2回目',
      subLabel: stageConfig.stage2Label || '水・土',
      count: groups.stage2.length,
      activeClass: 'bg-sky-50 border-sky-400 ring-2 ring-sky-100',
    },
    {
      key: 'stage3',
      label: '3回目',
      subLabel: stageConfig.stage3Label || '2週後',
      count: groups.stage3.length,
      activeClass: 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-100',
    },
    {
      key: 'mastered',
      label: '完了',
      subLabel: '定着',
      count: groups.mastered.length,
      activeClass: 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-100',
    },
  ];

  return (
    <div className="space-y-3">
      {/* 4段階サマリーバー */}
      <div className="grid grid-cols-4 gap-1.5">
        {filterCards.map((card) => {
          const isActive = filterStage === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setFilterStage(isActive ? 'all' : card.key)}
              className={`p-2 rounded-xl border text-center transition-all ${
                isActive
                  ? card.activeClass
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-base font-black font-mono text-slate-900 leading-tight">
                {card.count}
              </div>
              <div className="text-xs font-bold text-slate-800 truncate">
                {card.label}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {card.subLabel}
              </div>
            </button>
          );
        })}
      </div>

      {/* 問題ストック一覧 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-800">問題ストック</span>
            <span className="text-xs text-slate-400 font-mono">
              ({filteredList.length}問)
            </span>
          </div>
          {filterStage !== 'all' && (
            <button
              type="button"
              onClick={() => setFilterStage('all')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              すべて表示
            </button>
          )}
        </div>

        {filteredList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            該当する問題はありません
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((item) => {
              const status = normalizeStatus(item.status);
              const gem = getGemInfo(status);
              const stageText = getStageBadgeText(status, stageConfig);
              const isSelected = selectedIds.includes(item.id);
              const printedToday = printedTodayIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50/70 transition-colors"
                >
                  <div
                    onClick={() => onOpenDetail(item)}
                    className="min-w-0 flex-1 cursor-pointer space-y-1"
                  >
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {getQuestionTitle(item)}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] ${gem.badgeClass}`}>
                        {stageText}
                      </span>
                      <span className="text-xs text-slate-500">
                        {item.next_review_date
                          ? `次回 ${item.next_review_date}`
                          : status === 'mastered'
                          ? '定着済み'
                          : ''}
                      </span>
                      {printedToday && (
                        <span className="text-[11px] font-semibold text-emerald-700">
                          ・本日印刷済
                        </span>
                      )}
                    </div>
                  </div>

                  {status !== 'inbox' && (
                    <button
                      type="button"
                      onClick={() => onToggleSelect(item.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold shrink-0 border flex items-center gap-1 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>選択中</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>印刷</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

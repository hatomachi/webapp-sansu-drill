import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  MessageSquarePlus,
  Eye,
  Shield,
} from 'lucide-react';
import { QuestionItem, StageConfig } from '../types';
import { normalizeStatus } from '../services/storage';
import {
  getCurrentVariant,
  getGemInfo,
  getLocalTodayStr,
  getQuestionTitle,
  getSolutionDisplay,
  getStageBadgeText,
  isDueToday,
} from '../utils/gemHelper';

interface GradingViewProps {
  questions: QuestionItem[];
  lastPrintedIds: string[];
  stageConfig: StageConfig;
  onAnswer: (questionId: string, result: 'correct' | 'wrong') => void;
  onOpenDetail: (question: QuestionItem) => void;
  onOpenFeedback: (question: QuestionItem) => void;
}

export const GradingView: React.FC<GradingViewProps> = ({
  questions,
  lastPrintedIds,
  stageConfig,
  onAnswer,
  onOpenDetail,
  onOpenFeedback,
}) => {
  const [scope, setScope] = useState<'printed' | 'all'>(() =>
    lastPrintedIds.length > 0 ? 'printed' : 'all'
  );
  const [gradedResults, setGradedResults] = useState<
    Record<string, 'correct' | 'wrong'>
  >({});

  const todayStr = getLocalTodayStr();

  const printedQuestions = lastPrintedIds
    .map((id) => questions.find((q) => q.id === id))
    .filter((q): q is QuestionItem => Boolean(q));

  const dueOrActiveQuestions = questions.filter((q) => {
    const s = normalizeStatus(q.status);
    if (s === 'inbox' || s === 'mastered') return false;
    return isDueToday(q, todayStr) || Boolean(gradedResults[q.id]);
  });

  const hasPrintedBatch = printedQuestions.length > 0;
  const activeScope = hasPrintedBatch ? scope : 'all';
  const targetList =
    activeScope === 'printed' ? printedQuestions : dueOrActiveQuestions;

  const handleGrade = (questionId: string, result: 'correct' | 'wrong') => {
    setGradedResults((prev) => ({ ...prev, [questionId]: result }));
    onAnswer(questionId, result);
  };

  return (
    <div className="space-y-3">
      {/* ヘッダーカード */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900">
              {activeScope === 'printed'
                ? '印刷したプリントの丸つけ'
                : '今日の復習問題を丸つけ'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              紙のプリントを見ながら ○ / × を記録
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 shrink-0">
            {targetList.length}問
          </span>
        </div>

        {hasPrintedBatch && (
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setScope('printed')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeScope === 'printed'
                  ? 'bg-white text-emerald-700 font-bold shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              直近の印刷 ({printedQuestions.length}問)
            </button>
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeScope === 'all'
                  ? 'bg-white text-blue-700 font-bold shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              今日の復習すべて ({dueOrActiveQuestions.length}問)
            </button>
          </div>
        )}
      </div>

      {/* 採点カード一覧 */}
      {targetList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          丸つけ対象の問題はありません
        </div>
      ) : (
        <div className="space-y-3">
          {targetList.map((q, idx) => {
            const variant = getCurrentVariant(q);
            const gem = getGemInfo(q.status);
            const stageText = getStageBadgeText(q.status, stageConfig);
            const recorded = gradedResults[q.id];

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm space-y-2.5"
              >
                {/* カード上部 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {getQuestionTitle(q)}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${gem.badgeClass}`}>
                          {stageText}
                        </span>
                        {q.next_review_date && (
                          <span className="text-xs text-slate-500">
                            次回: {q.next_review_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenDetail(q)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 shrink-0 transition-colors"
                    title="問題全文を確認"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* 問題要約（1〜2行） */}
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {variant.problem_plain_text}
                </p>

                {/* 親向け正解カンペ（常時表示・単一ブロック） */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5">
                  <div className="text-xs font-bold text-emerald-800">
                    正解: {getSolutionDisplay(variant)}
                  </div>
                  {variant.parent_hint && (
                    <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start gap-1.5 leading-relaxed">
                      <Shield className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <span>{variant.parent_hint}</span>
                    </div>
                  )}
                </div>

                {/* 判定ボタン */}
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleGrade(q.id, 'wrong')}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>もう1回</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGrade(q.id, 'correct')}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>できた！</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenFeedback(q)}
                    className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 shrink-0 transition-colors"
                    title="AIへツッコミ"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                  </button>
                </div>

                {/* セッション内の記録結果 */}
                {recorded && (
                  <div
                    className={`text-xs font-semibold text-center py-1.5 rounded-lg ${
                      recorded === 'correct'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {recorded === 'correct'
                      ? `記録済み: ○（次のステップ: ${stageText}${
                          q.next_review_date ? ` / ${q.next_review_date}` : ''
                        }）`
                      : `記録済み: ×（明日もう1回リベンジ）`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

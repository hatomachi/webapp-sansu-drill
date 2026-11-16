import React, { useState, useEffect } from 'react';
import {
  X,
  Image as ImageIcon,
  MessageSquarePlus,
  Trash2,
  Printer,
  Check,
  Shield,
} from 'lucide-react';
import { QuestionItem, StageConfig } from '../types';
import {
  getCurrentVariantIndex,
  getGemInfo,
  getQuestionTitle,
  getSolutionDisplay,
  getStageBadgeText,
} from '../utils/gemHelper';

interface QuestionDetailSheetProps {
  question: QuestionItem | null;
  stageConfig: StageConfig;
  isSelectedForPrint: boolean;
  onTogglePrint: (questionId: string) => void;
  onClose: () => void;
  onOpenFeedback: (question: QuestionItem) => void;
  onOpenOriginalImage: (question: QuestionItem) => void;
  onDelete: (questionId: string) => void;
}

export const QuestionDetailSheet: React.FC<QuestionDetailSheetProps> = ({
  question,
  stageConfig,
  isSelectedForPrint,
  onTogglePrint,
  onClose,
  onOpenFeedback,
  onOpenOriginalImage,
  onDelete,
}) => {
  const [activeVariantIdx, setActiveVariantIdx] = useState(0);

  useEffect(() => {
    if (question) {
      setActiveVariantIdx(getCurrentVariantIndex(question));
    }
  }, [question]);

  if (!question) return null;

  const variants = question.variants && question.variants.length > 0 ? question.variants : [];
  const currentVariantIdx = getCurrentVariantIndex(question);
  const safeVariantIdx = Math.min(activeVariantIdx, Math.max(0, variants.length - 1));
  const displayVariant = variants[safeVariantIdx] || {
    problem_text: question.problem_text || 'もんだいを よみこみちゅう...',
    problem_plain_text: question.problem_plain_text || '',
    formula: question.formula || '',
    answer: question.answer || '',
    explanation: question.explanation || '',
    parent_hint: question.parent_hint || '',
  };

  const gemInfo = getGemInfo(question.status);
  const stageText = getStageBadgeText(question.status, stageConfig);
  const title = getQuestionTitle(question);

  const handleDelete = () => {
    if (window.confirm(`「${title}」を削除しますか？\n※削除すると元に戻せません。`)) {
      onDelete(question.id);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[1px] flex items-end sm:items-center justify-center p-0 sm:p-4 no-print"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50 shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate">{title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-xs ${gemInfo.badgeClass}`}>
                {stageText}
              </span>
              {question.next_review_date && (
                <span className="text-xs text-slate-500">
                  次回: {question.next_review_date}
                </span>
              )}
              {question.needs_regeneration && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  再生成待ち
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 transition-colors shrink-0"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* 3問バリアント切替（類題を事前確認できる） */}
          {variants.length > 1 && (
            <div className="flex gap-1.5">
              {variants.map((_, idx) => {
                const isActive = idx === safeVariantIdx;
                const isCurrentStage = idx === currentVariantIdx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveVariantIdx(idx)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    第{idx + 1}問{isCurrentStage ? ' (今回)' : ''}
                  </button>
                );
              })}
            </div>
          )}

          {/* 問題文・図表プレビュー */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div
              className="text-base leading-relaxed text-slate-900 font-medium select-text"
              dangerouslySetInnerHTML={{ __html: displayVariant.problem_text }}
            />
          </div>

          {/* 親向け解答・解説・ヒント */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
            <div className="text-xs font-bold text-emerald-900">
              正解: {getSolutionDisplay(displayVariant)}
            </div>

            {displayVariant.explanation && (
              <p className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900">解説: </span>
                {displayVariant.explanation}
              </p>
            )}

            {displayVariant.parent_hint && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-950 leading-relaxed">
                <div className="font-bold flex items-center gap-1 text-amber-800 mb-0.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>親の声かけヒント</span>
                </div>
                <p>{displayVariant.parent_hint}</p>
              </div>
            )}
          </div>

          {/* 印刷選択トグル ＋ 管理アクション */}
          <button
            type="button"
            onClick={() => onTogglePrint(question.id)}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors ${
              isSelectedForPrint
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {isSelectedForPrint ? (
              <>
                <Check className="w-4 h-4" />
                <span>今日のプリントに選択中（タップで外す）</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>今日のプリントに追加する</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-3 gap-2">
            {(question.raw_image_path || question.raw_image_base64) ? (
              <button
                type="button"
                onClick={() => onOpenOriginalImage(question)}
                className="py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>元写真</span>
              </button>
            ) : (
              <div className="py-2.5 px-2 rounded-xl bg-slate-50 text-slate-400 text-xs font-medium flex items-center justify-center">
                写真なし
              </div>
            )}

            <button
              type="button"
              onClick={() => onOpenFeedback(question)}
              className="py-2.5 px-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>AIツッコミ</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="py-2.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>削除</span>
            </button>
          </div>
        </div>

        <div className="pb-safe bg-white shrink-0" />
      </div>
    </div>
  );
};

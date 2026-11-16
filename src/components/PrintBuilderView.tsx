import React, { useState } from 'react';
import {
  Camera,
  Eye,
  FileDown,
  Loader2,
  Printer,
  Settings2,
  Sparkles,
  Layers,
  Clock,
} from 'lucide-react';
import { QuestionItem, StageConfig } from '../types';
import { normalizeStatus } from '../services/storage';
import {
  getCurrentVariant,
  getCurrentVariantIndex,
  getGemInfo,
  getLocalTodayStr,
  getQuestionTitle,
  getStageBadgeText,
  isDueToday,
} from '../utils/gemHelper';
import { QUESTIONS_PER_PAGE } from './PrintSheets';
import { PdfStatusMessage } from './PdfExportLayer';

interface PrintBuilderViewProps {
  questions: QuestionItem[];
  selectedIds: string[];
  printedTodayIds: string[];
  stageConfig: StageConfig;
  isSyncing: boolean;
  onSync: () => void;
  onToggleSelect: (questionId: string) => void;
  onSelectRecommended: () => void;
  onClearSelection: () => void;
  onOpenDetail: (question: QuestionItem) => void;
  onGoToStock: () => void;
  onOpenCapture: () => void;
  pdfStatusMessage: PdfStatusMessage | null;
  onDismissStatusMessage: () => void;
  hasPreparedPdf: boolean;
  onRedownloadPdf: () => void;
  onOpenShareOptions?: () => void;
}

export const PrintBuilderView: React.FC<PrintBuilderViewProps> = ({
  questions,
  selectedIds,
  printedTodayIds,
  stageConfig,
  isSyncing,
  onSync,
  onToggleSelect,
  onSelectRecommended,
  onClearSelection,
  onOpenDetail,
  onGoToStock,
  onOpenCapture,
  pdfStatusMessage,
  onDismissStatusMessage,
  hasPreparedPdf,
  onRedownloadPdf,
  onOpenShareOptions,
}) => {
  const todayStr = getLocalTodayStr();

  const pendingQuestions = questions.filter(
    (q) => normalizeStatus(q.status) === 'inbox' || q.needs_regeneration
  );

  // 印刷対象リスト: 未完了問題（期日到来優先）＋ ストックから選択中の殿堂入り問題
  const printableQuestions = questions.filter((q) => {
    const s = normalizeStatus(q.status);
    if (s === 'inbox') return false;
    if (s === 'mastered') return selectedIds.includes(q.id);
    return true;
  });

  const dueQuestions = printableQuestions.filter((q) => isDueToday(q, todayStr));
  const otherQuestions = printableQuestions.filter((q) => !isDueToday(q, todayStr));
  const orderedQuestions = [...dueQuestions, ...otherQuestions];

  return (
    <div className="space-y-3">
      {/* PDFステータス通知 */}
      {pdfStatusMessage && (
        <div
          className={`px-3.5 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
            pdfStatusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <span>{pdfStatusMessage.text}</span>
          <div className="flex items-center gap-2.5 shrink-0">
            {hasPreparedPdf && onOpenShareOptions && (
              <button
                type="button"
                onClick={onOpenShareOptions}
                className="underline font-bold"
              >
                他の方法で開く
              </button>
            )}
            {hasPreparedPdf && (
              <button
                type="button"
                onClick={onRedownloadPdf}
                className="underline font-bold"
              >
                保存
              </button>
            )}
            <button
              type="button"
              onClick={onDismissStatusMessage}
              className="opacity-70 hover:opacity-100 px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* AI生成・再生成中バナー */}
      {pendingQuestions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold text-amber-900 truncate">
              AIが類題を作成中（{pendingQuestions.length}問）
            </span>
          </div>
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className="text-xs font-bold text-amber-800 underline shrink-0 disabled:opacity-50"
          >
            {isSyncing ? '更新中...' : '更新'}
          </button>
        </div>
      )}

      {/* 今日のプリント編成ヘッダーカード */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900">
              きょうのさんすうプリント
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              本日の復習対象 {dueQuestions.length}問 ・ 1枚推奨 2〜3問
            </p>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 shrink-0">
            {selectedIds.length}問 選択
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
          <button
            type="button"
            onClick={onSelectRecommended}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold shrink-0 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>おすすめ3問</span>
          </button>

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={onClearSelection}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold shrink-0 transition-colors"
            >
              選択クリア
            </button>
          )}

          <button
            type="button"
            onClick={onGoToStock}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold shrink-0 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>+ ストックから追加</span>
          </button>
        </div>
      </div>

      {/* 問題リスト */}
      {orderedQuestions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-4 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">
              {questions.length === 0
                ? 'まだ問題が登録されていません'
                : '本日の復習問題はありません'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              間違えた問題を撮影して追加するか、ストック一覧から過去の問題を選んでプリントできます。
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={onOpenCapture}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Camera className="w-4 h-4" />
              <span>間違えた問題を撮影</span>
            </button>
            {questions.length > 0 && (
              <button
                type="button"
                onClick={onGoToStock}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Layers className="w-4 h-4" />
                <span>ストックから選ぶ</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {orderedQuestions.map((q) => {
            const selIdx = selectedIds.indexOf(q.id);
            const isSelected = selIdx !== -1;
            const variant = getCurrentVariant(q);
            const variantIdx = getCurrentVariantIndex(q);
            const gem = getGemInfo(q.status);
            const stageText = getStageBadgeText(q.status, stageConfig);
            const due = isDueToday(q, todayStr);
            const printedToday = printedTodayIds.includes(q.id);

            return (
              <div
                key={q.id}
                className={`bg-white rounded-2xl border p-3 flex items-start gap-2.5 shadow-sm transition-all ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* 選択番号チェックボックス */}
                <button
                  type="button"
                  onClick={() => onToggleSelect(q.id)}
                  className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-400 border border-slate-300 hover:bg-slate-200'
                  }`}
                  aria-label={isSelected ? '選択解除' : 'プリントに選択'}
                >
                  {isSelected ? selIdx + 1 : ''}
                </button>

                {/* 問題情報 */}
                <div
                  onClick={() => onToggleSelect(q.id)}
                  className="flex-1 min-w-0 cursor-pointer space-y-1"
                >
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {getQuestionTitle(q)}
                  </div>

                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${gem.badgeClass}`}>
                      {stageText}
                    </span>

                    {q.variants && q.variants.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        第{variantIdx + 1}問
                      </span>
                    )}

                    {due ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        今日やる
                      </span>
                    ) : q.next_review_date ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
                        次回 {q.next_review_date}
                      </span>
                    ) : null}

                    {printedToday && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        本日印刷済
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-1">
                    {variant.problem_plain_text}
                  </p>
                </div>

                {/* 事前確認ボタン */}
                <button
                  type="button"
                  onClick={() => onOpenDetail(q)}
                  className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold shrink-0 flex items-center gap-1 transition-colors"
                  title="問題文・答え・元写真を確認"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>確認</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface PrintActionBarProps {
  selectedCount: number;
  showGridDots: boolean;
  includeAnswerSheet: boolean;
  isGeneratingPdf: boolean;
  onToggleGridDots: (checked: boolean) => void;
  onToggleAnswerSheet: (checked: boolean) => void;
  onOpenPreview: () => void;
  onExportPdf: () => void;
  onPrintDirect: () => void;
}

export const PrintActionBar: React.FC<PrintActionBarProps> = ({
  selectedCount,
  showGridDots,
  includeAnswerSheet,
  isGeneratingPdf,
  onToggleGridDots,
  onToggleAnswerSheet,
  onOpenPreview,
  onExportPdf,
  onPrintDirect,
}) => {
  const [showOptions, setShowOptions] = useState(false);

  const problemPageCount =
    selectedCount === 0 ? 0 : Math.ceil(selectedCount / QUESTIONS_PER_PAGE);
  const totalPages =
    problemPageCount + (includeAnswerSheet && selectedCount > 0 ? problemPageCount : 0);

  return (
    <div className="relative bg-white border-t border-slate-200 px-3.5 py-2.5 shadow-[0_-4px_12px_rgba(15,23,42,0.06)]">
      {/* プリントオプションポップオーバー */}
      {showOptions && (
        <div className="absolute bottom-full left-3.5 right-3.5 mb-2 max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-4 shadow-xl z-40 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-800">
              プリント設定（自動保存）
            </span>
            <button
              type="button"
              onClick={() => setShowOptions(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              閉じる
            </button>
          </div>

          <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
            <span>計算スペースをドット方眼にする</span>
            <input
              type="checkbox"
              checked={showGridDots}
              onChange={(e) => onToggleGridDots(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
            <span>親用の解答シート（2ページ目）を含める</span>
            <input
              type="checkbox"
              checked={includeAnswerSheet}
              onChange={(e) => onToggleAnswerSheet(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">PCから直接印刷する場合:</span>
            <button
              type="button"
              onClick={() => {
                setShowOptions(false);
                onPrintDirect();
              }}
              disabled={selectedCount === 0}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline disabled:opacity-40"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>直接印刷する</span>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className={`px-2.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors border ${
              showOptions
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-transparent'
            }`}
            title="プリント設定"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{totalPages > 0 ? `A4 ${totalPages}枚` : '設定'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenPreview}
            disabled={selectedCount === 0}
            className="px-2.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 text-xs font-semibold transition-colors"
          >
            紙面確認
          </button>
        </div>

        <button
          type="button"
          onClick={onExportPdf}
          disabled={selectedCount === 0 || isGeneratingPdf}
          className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-1.5"
        >
          {isGeneratingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          <span>A4 PDF作成 ({selectedCount}問)</span>
        </button>

        {/* PC大画面のみ直接印刷ボタンも並記 */}
        <button
          type="button"
          onClick={onPrintDirect}
          disabled={selectedCount === 0 || isGeneratingPdf}
          className="hidden sm:flex items-center gap-1 px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 text-xs font-bold shrink-0 transition-colors"
          title="PCから直接印刷"
        >
          <Printer className="w-4 h-4" />
          <span>印刷</span>
        </button>
      </div>
    </div>
  );
};

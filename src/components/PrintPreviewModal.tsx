import React, { useRef, useState, useEffect } from 'react';
import { X, FileDown, Printer, Loader2 } from 'lucide-react';
import { QuestionItem, StageConfig } from '../types';
import {
  A4_PAGE_WIDTH_PX,
  QUESTIONS_PER_PAGE,
  chunkQuestions,
  ScaledPrintPage,
  ProblemSheetPage,
  AnswerSheetPage,
} from './PrintSheets';
import { getJapaneseTodayStr } from './PdfExportLayer';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedQuestions: QuestionItem[];
  stageConfig: StageConfig;
  showGridDots: boolean;
  includeAnswerSheet: boolean;
  headerTitle?: string;
  isGeneratingPdf: boolean;
  hasPreparedPdf?: boolean;
  onExportPdf: () => void;
  onPrintDirect: () => void;
  onOpenShareOptions?: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  selectedQuestions,
  stageConfig,
  showGridDots,
  includeAnswerSheet,
  headerTitle,
  isGeneratingPdf,
  hasPreparedPdf = false,
  onExportPdf,
  onPrintDirect,
  onOpenShareOptions,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const style = window.getComputedStyle(container);
      const padX =
        (parseFloat(style.paddingLeft) || 0) +
        (parseFloat(style.paddingRight) || 0);
      const availableWidth = container.clientWidth - padX;
      if (availableWidth > 0) {
        const nextScale = Math.min(1, Math.max(0.3, availableWidth / A4_PAGE_WIDTH_PX));
        setPreviewScale(nextScale);
      }
    };

    updateScale();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [isOpen]);

  if (!isOpen) return null;

  const todayStr = getJapaneseTodayStr();
  const questionPages = chunkQuestions(selectedQuestions, QUESTIONS_PER_PAGE);
  const answerPages =
    includeAnswerSheet && selectedQuestions.length > 0
      ? chunkQuestions(selectedQuestions, QUESTIONS_PER_PAGE)
      : [];
  const totalSheetCount =
    selectedQuestions.length === 0 ? 0 : questionPages.length + answerPages.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex flex-col no-print pt-safe">
      {/* スリムな上部バー */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            A4 紙面プレビュー
          </h2>
          <p className="text-xs text-slate-500">
            {selectedQuestions.length}問 ・ 全{totalSheetCount}ページ
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {hasPreparedPdf && onOpenShareOptions && (
            <button
              type="button"
              onClick={onOpenShareOptions}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              保存・他の方法で開く
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* プレビュー領域（画面の大半を紙面確認に確保） */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-slate-200 p-3 sm:p-6 flex flex-col items-center gap-4"
      >
        {questionPages.map((pageQuestions, pIdx) => (
          <ScaledPrintPage key={`prev-q-${pIdx}`} scale={previewScale}>
            <ProblemSheetPage
              questions={pageQuestions}
              pageIndex={pIdx}
              totalPages={questionPages.length}
              totalQuestionCount={selectedQuestions.length}
              startNumber={pIdx * QUESTIONS_PER_PAGE + 1}
              todayStr={todayStr}
              showGridDots={showGridDots}
              headerTitle={headerTitle}
            />
          </ScaledPrintPage>
        ))}

        {answerPages.map((pageQuestions, pIdx) => (
          <ScaledPrintPage key={`prev-a-${pIdx}`} scale={previewScale}>
            <AnswerSheetPage
              questions={pageQuestions}
              pageIndex={pIdx}
              totalPages={answerPages.length}
              startNumber={pIdx * QUESTIONS_PER_PAGE + 1}
              todayStr={todayStr}
              stageConfig={stageConfig}
            />
          </ScaledPrintPage>
        ))}
      </div>

      {/* 下部アクションバー */}
      <div className="bg-white border-t border-slate-200 px-4 py-3 pb-safe shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onPrintDirect}
            disabled={selectedQuestions.length === 0 || isGeneratingPdf}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>直接印刷</span>
          </button>

          <button
            type="button"
            onClick={onExportPdf}
            disabled={selectedQuestions.length === 0 || isGeneratingPdf}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            <span>A4 PDF作成（Canon PRINT）</span>
          </button>
        </div>
      </div>
    </div>
  );
};

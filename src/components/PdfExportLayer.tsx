import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Share2, FileDown } from 'lucide-react';
import { QuestionItem, StageConfig } from '../types';
import {
  A4_PAGE_WIDTH_PX,
  A4_PAGE_HEIGHT_PX,
  QUESTIONS_PER_PAGE,
  chunkQuestions,
  ProblemSheetPage,
  AnswerSheetPage,
} from './PrintSheets';

export function getLocalDateFileStamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export function getJapaneseTodayStr(): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(new Date());
}

export interface PdfStatusMessage {
  type: 'info' | 'error';
  text: string;
}

interface UseA4PdfExportOptions {
  selectedQuestions: QuestionItem[];
  showGridDots: boolean;
  includeAnswerSheet: boolean;
  onPrintedBatch: (printedIds: string[]) => void;
}

export function useA4PdfExport({
  selectedQuestions,
  showGridDots,
  includeAnswerSheet,
  onPrintedBatch,
}: UseA4PdfExportOptions) {
  const pdfCaptureRef = useRef<HTMLDivElement | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [preparedPdfFile, setPreparedPdfFile] = useState<File | null>(null);
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [pdfStatusMessage, setPdfStatusMessage] =
    useState<PdfStatusMessage | null>(null);

  const selectedKey = selectedQuestions.map((q) => q.id).join(',');

  // 選択内容や印刷オプションが変わったらキャッシュ破棄
  useEffect(() => {
    setPreparedPdfFile(null);
    setShowSharePrompt(false);
    setPdfStatusMessage(null);
  }, [selectedKey, showGridDots, includeAnswerSheet]);

  const handlePrintDirect = () => {
    if (selectedQuestions.length === 0) {
      setPdfStatusMessage({
        type: 'error',
        text: '印刷する問題を1問以上選んでください。',
      });
      return;
    }
    onPrintedBatch(selectedQuestions.map((q) => q.id));
    window.print();
  };

  const handleExportPdf = async () => {
    if (selectedQuestions.length === 0) {
      setPdfStatusMessage({
        type: 'error',
        text: 'PDFにする問題を1問以上選んでください。',
      });
      return;
    }
    if (isGeneratingPdf) return;

    setPdfStatusMessage(null);

    try {
      const { generateA4PdfFile, deliverPdfFile } = await import(
        '../utils/pdfGenerator'
      );

      let targetFile = preparedPdfFile;

      if (!targetFile) {
        setIsGeneratingPdf(true);

        await new Promise<void>((resolve) => {
          setTimeout(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => resolve());
            });
          }, 30);
        });

        const container = pdfCaptureRef.current;
        const pageEls = container
          ? Array.from(
              container.querySelectorAll<HTMLElement>('[data-pdf-page="true"]')
            )
          : [];

        const filename = `sansu-drill-${getLocalDateFileStamp()}.pdf`;
        targetFile = await generateA4PdfFile(pageEls, filename);
        setPreparedPdfFile(targetFile);
        setIsGeneratingPdf(false);
      }

      onPrintedBatch(selectedQuestions.map((q) => q.id));

      const result = await deliverPdfFile(targetFile);
      if (result === 'shared') {
        setPdfStatusMessage({
          type: 'info',
          text: '共有メニューから Canon PRINT 等へ送れます（「丸つけ」タブにセット済み）',
        });
      } else if (result === 'downloaded') {
        setPdfStatusMessage({
          type: 'info',
          text: 'A4 PDFを保存しました（「丸つけ」タブにセット済み）',
        });
      } else if (result === 'activation-expired') {
        setShowSharePrompt(true);
      }
    } catch (err) {
      console.error('PDF generation failed:', err);
      setIsGeneratingPdf(false);
      setPdfStatusMessage({
        type: 'error',
        text: 'PDFの作成に失敗しました。ページを再読み込みしてもう一度お試しください。',
      });
    }
  };

  const handleTriggerSharePrepared = async () => {
    if (!preparedPdfFile) return;
    try {
      const { sharePdfFile, downloadPdfFile } = await import(
        '../utils/pdfGenerator'
      );
      const res = await sharePdfFile(preparedPdfFile);
      if (res === 'shared') {
        setShowSharePrompt(false);
        setPdfStatusMessage({
          type: 'info',
          text: '共有メニューから Canon PRINT 等へ送れます（「丸つけ」タブにセット済み）',
        });
      } else if (res === 'unsupported') {
        downloadPdfFile(preparedPdfFile);
        setShowSharePrompt(false);
        setPdfStatusMessage({
          type: 'info',
          text: 'A4 PDFを保存しました',
        });
      } else if (res === 'cancelled') {
        setShowSharePrompt(false);
      }
    } catch (err) {
      console.error('Share failed:', err);
      const { downloadPdfFile } = await import('../utils/pdfGenerator');
      downloadPdfFile(preparedPdfFile);
      setShowSharePrompt(false);
    }
  };

  const handleDownloadPrepared = async () => {
    if (!preparedPdfFile) return;
    const { downloadPdfFile } = await import('../utils/pdfGenerator');
    downloadPdfFile(preparedPdfFile);
    setShowSharePrompt(false);
    setPdfStatusMessage({
      type: 'info',
      text: 'A4 PDFを端末に保存しました',
    });
  };

  return {
    pdfCaptureRef,
    isGeneratingPdf,
    preparedPdfFile,
    showSharePrompt,
    setShowSharePrompt,
    pdfStatusMessage,
    setPdfStatusMessage,
    handlePrintDirect,
    handleExportPdf,
    handleTriggerSharePrepared,
    handleDownloadPrepared,
  };
}

interface PdfExportLayerProps {
  selectedQuestions: QuestionItem[];
  stageConfig: StageConfig;
  showGridDots: boolean;
  includeAnswerSheet: boolean;
  headerTitle?: string;
  pdfCaptureRef: React.RefObject<HTMLDivElement>;
  isGeneratingPdf: boolean;
  preparedPdfFile: File | null;
  showSharePrompt: boolean;
  onCloseSharePrompt: () => void;
  onTriggerShare: () => void;
  onDownload: () => void;
  onGoToGrade?: () => void;
}

export const PdfExportLayer: React.FC<PdfExportLayerProps> = ({
  selectedQuestions,
  stageConfig,
  showGridDots,
  includeAnswerSheet,
  headerTitle,
  pdfCaptureRef,
  isGeneratingPdf,
  preparedPdfFile,
  showSharePrompt,
  onCloseSharePrompt,
  onTriggerShare,
  onDownload,
  onGoToGrade,
}) => {
  const todayStr = getJapaneseTodayStr();
  const questionPages = chunkQuestions(selectedQuestions, QUESTIONS_PER_PAGE);
  const answerPages =
    includeAnswerSheet && selectedQuestions.length > 0
      ? chunkQuestions(selectedQuestions, QUESTIONS_PER_PAGE)
      : [];

  return (
    <>
      {/* PC直接印刷（window.print()）専用の隠し印刷エリア */}
      <div className="hidden print:block print-area">
        {questionPages.map((pageQuestions, pIdx) => (
          <ProblemSheetPage
            key={`direct-q-${pIdx}`}
            questions={pageQuestions}
            pageIndex={pIdx}
            totalPages={questionPages.length}
            totalQuestionCount={selectedQuestions.length}
            startNumber={pIdx * QUESTIONS_PER_PAGE + 1}
            todayStr={todayStr}
            showGridDots={showGridDots}
            headerTitle={headerTitle}
          />
        ))}
        {answerPages.map((pageQuestions, pIdx) => (
          <AnswerSheetPage
            key={`direct-a-${pIdx}`}
            questions={pageQuestions}
            pageIndex={pIdx}
            totalPages={answerPages.length}
            startNumber={pIdx * QUESTIONS_PER_PAGE + 1}
            todayStr={todayStr}
            stageConfig={stageConfig}
          />
        ))}
      </div>

      {/* PDF生成中のみマウントする等倍（794x1123）キャプチャ用コンテナ */}
      {isGeneratingPdf && (
        <>
          <div
            ref={pdfCaptureRef}
            style={{
              width: `${A4_PAGE_WIDTH_PX}px`,
              height: `${A4_PAGE_HEIGHT_PX}px`,
            }}
            className="fixed top-0 left-0 z-[55] pointer-events-none bg-white overflow-hidden no-print"
            aria-hidden="true"
          >
            {questionPages.map((pageQuestions, pIdx) => (
              <div
                key={`pdf-q-${pIdx}`}
                data-pdf-page="true"
                className="absolute top-0 left-0"
                style={{ zIndex: pIdx + 1 }}
              >
                <ProblemSheetPage
                  questions={pageQuestions}
                  pageIndex={pIdx}
                  totalPages={questionPages.length}
                  totalQuestionCount={selectedQuestions.length}
                  startNumber={pIdx * QUESTIONS_PER_PAGE + 1}
                  todayStr={todayStr}
                  showGridDots={showGridDots}
                  headerTitle={headerTitle}
                  isForPdf={true}
                />
              </div>
            ))}
            {answerPages.map((pageQuestions, pIdx) => (
              <div
                key={`pdf-a-${pIdx}`}
                data-pdf-page="true"
                className="absolute top-0 left-0"
                style={{ zIndex: questionPages.length + pIdx + 1 }}
              >
                <AnswerSheetPage
                  questions={pageQuestions}
                  pageIndex={pIdx}
                  totalPages={answerPages.length}
                  startNumber={pIdx * QUESTIONS_PER_PAGE + 1}
                  todayStr={todayStr}
                  stageConfig={stageConfig}
                  isForPdf={true}
                />
              </div>
            ))}
          </div>

          <div className="fixed inset-0 z-[60] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-6 no-print">
            <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl space-y-3">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                A4 PDFを作成しています...
              </h3>
              <p className="text-xs text-slate-500">
                A4用紙サイズで整えています（数秒かかります）
              </p>
            </div>
          </div>
        </>
      )}

      {/* iOS Safari等で非同期後の共有シート自動起動が制限された場合のワンタップ確認パネル */}
      {showSharePrompt && preparedPdfFile && (
        <div className="fixed inset-0 z-[65] bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 no-print">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 pb-safe">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                📄
              </div>
              <h3 className="text-base font-bold text-slate-800 pt-1">
                A4 PDFの準備ができました
              </h3>
              <p className="text-xs text-slate-500">
                共有メニューから「Canon PRINT」を選んで印刷してください。
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={onTriggerShare}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-200 active:scale-95 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Canon PRINT へ送る / 共有</span>
              </button>

              {onGoToGrade && (
                <button
                  type="button"
                  onClick={() => {
                    onCloseSharePrompt();
                    onGoToGrade();
                  }}
                  className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
                >
                  あとで丸つけする（「丸つけ」タブへ）
                </button>
              )}

              <button
                type="button"
                onClick={onDownload}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileDown className="w-4 h-4" />
                <span>端末にファイルを保存</span>
              </button>

              <button
                type="button"
                onClick={onCloseSharePrompt}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

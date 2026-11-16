import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Printer,
  X,
  FileText,
  CheckCircle2,
  XCircle,
  FileDown,
  Share2,
  Loader2,
} from 'lucide-react';
import { QuestionItem, StageConfig } from '../types';
import { normalizeStatus } from '../services/storage';
import { getCurrentVariant, getGemInfo } from '../utils/gemHelper';
import {
  A4_PAGE_WIDTH_PX,
  A4_PAGE_HEIGHT_PX,
  QUESTIONS_PER_PAGE,
  chunkQuestions,
  ScaledPrintPage,
  ProblemSheetPage,
  AnswerSheetPage,
} from './PrintSheets';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuestionItem[];
  stageConfig: StageConfig;
  onAnswer: (questionId: string, result: 'correct' | 'wrong') => void;
}

function getLocalDateFileStamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  questions,
  stageConfig,
  onAnswer,
}) => {
  // 滞留中の問題（mastered 以外）
  const activeQuestions = useMemo(
    () => questions.filter((q) => normalizeStatus(q.status) !== 'mastered'),
    [questions]
  );

  // 選択された問題ID（初期値は滞留問題の先頭最大3問）
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    return activeQuestions.slice(0, 3).map((q) => q.id);
  });

  // 解答シートを印刷・PDFに含めるかどうか
  const [includeAnswerSheet, setIncludeAnswerSheet] = useState<boolean>(true);

  // 計算スペースのドット方眼
  const [showGridDots, setShowGridDots] = useState<boolean>(true);

  // モード: 'preview' (プレビュー＆印刷) | 'grading' (一括丸つけ)
  const [mode, setMode] = useState<'preview' | 'grading'>('preview');

  // プレビュー縮小率（スマホ幅でもA4比率を崩さず全体確認できるようにする）
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState<number>(1);

  // PDF出力関連ステート
  const pdfCaptureRef = useRef<HTMLDivElement | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [preparedPdfFile, setPreparedPdfFile] = useState<File | null>(null);
  const [showSharePrompt, setShowSharePrompt] = useState<boolean>(false);
  const [pdfStatusMessage, setPdfStatusMessage] = useState<{
    type: 'info' | 'error';
    text: string;
  } | null>(null);

  // モーダル再オープン時・問題リスト変化時の整合性維持
  useEffect(() => {
    if (!isOpen) {
      setIsGeneratingPdf(false);
      setPreparedPdfFile(null);
      setShowSharePrompt(false);
      setPdfStatusMessage(null);
      return;
    }

    setSelectedIds((prev) => {
      const validIds = prev.filter((id) => questions.some((q) => q.id === id));
      if (validIds.length === prev.length && validIds.length > 0) return prev;
      if (validIds.length > 0) return validIds;
      const recommended = activeQuestions.slice(0, 3).map((q) => q.id);
      if (
        recommended.length === prev.length &&
        recommended.every((id, idx) => id === prev[idx])
      ) {
        return prev;
      }
      return recommended;
    });
  }, [isOpen, questions, activeQuestions]);

  // 選択内容やオプションが変わったら生成済みPDFキャッシュを破棄
  useEffect(() => {
    setPreparedPdfFile(null);
    setShowSharePrompt(false);
    setPdfStatusMessage(null);
  }, [selectedIds, includeAnswerSheet, showGridDots]);

  // プレビューエリア横幅に応じたスケーリング追従
  useEffect(() => {
    if (!isOpen || mode !== 'preview') return;
    const container = previewContainerRef.current;
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
  }, [isOpen, mode]);

  if (!isOpen) return null;

  // 選択中の問題リスト
  const selectedQuestions = questions.filter((q) => selectedIds.includes(q.id));
  const questionPages = chunkQuestions(selectedQuestions, QUESTIONS_PER_PAGE);
  const answerPages =
    includeAnswerSheet && selectedQuestions.length > 0
      ? chunkQuestions(selectedQuestions, QUESTIONS_PER_PAGE)
      : [];

  // 問題の選択トグル
  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length === 3) {
        alert('A4 1枚に綺麗に収めるには3問までがおすすめです（4問以上は2枚目に自動で分かれます）。');
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  // おすすめ3問リセット
  const handleResetRecommend = () => {
    setSelectedIds(activeQuestions.slice(0, 3).map((q) => q.id));
  };

  // PC向け直接印刷実行
  const handlePrint = () => {
    if (selectedQuestions.length === 0) {
      alert('印刷する問題を1問以上選んでください。');
      return;
    }
    window.print();
  };

  // スマホ向けA4 PDF生成＆共有/ダウンロード実行
  const handleExportPdf = async () => {
    if (selectedQuestions.length === 0) {
      alert('PDFにする問題を1問以上選んでください。');
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

        // 非表示等倍キャプチャDOMのマウント完了を待つ
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => resolve());
            });
          }, 30);
        });

        const container = pdfCaptureRef.current;
        const pageEls = container
          ? Array.from(container.querySelectorAll<HTMLElement>('[data-pdf-page="true"]'))
          : [];

        const filename = `sansu-drill-${getLocalDateFileStamp()}.pdf`;
        targetFile = await generateA4PdfFile(pageEls, filename);
        setPreparedPdfFile(targetFile);
        setIsGeneratingPdf(false);
      }

      const result = await deliverPdfFile(targetFile);
      if (result === 'shared') {
        setPdfStatusMessage({
          type: 'info',
          text: '共有メニューから Canon PRINT 等へ送れます',
        });
      } else if (result === 'downloaded') {
        setPdfStatusMessage({
          type: 'info',
          text: 'A4 PDFをダウンロードしました（Canon PRINT等で開いて印刷できます）',
        });
      } else if (result === 'activation-expired') {
        // iOS Safari等で非同期後の共有起動が制限されたため、ワンタップ起動パネルを表示
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

  // 生成済みPDFの共有シート再起動（ユーザージェスチャー同期呼び出し）
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
          text: '共有メニューから Canon PRINT 等へ送れます',
        });
      } else if (res === 'unsupported') {
        downloadPdfFile(preparedPdfFile);
        setShowSharePrompt(false);
        setPdfStatusMessage({
          type: 'info',
          text: 'A4 PDFをダウンロードしました',
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
      text: 'A4 PDFをダウンロードしました（ファイルアプリ等からCanon PRINTで開けます）',
    });
  };

  // 今日の日付フォーマット（例: 2026年11月15日）
  const todayStr = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-0 md:p-6 print:p-0 print:bg-white print:static print:overflow-visible print:block print:h-auto print:w-full">
      <div className="bg-slate-100 w-full max-w-5xl rounded-none md:rounded-3xl shadow-2xl flex flex-col max-h-none md:max-h-[92vh] overflow-hidden border border-slate-300 print:border-none print:shadow-none print:max-h-none print:overflow-visible print:bg-white print:w-full print:block">
        {/* 画面専用ヘッダー（印刷時は非表示） */}
        <div className="no-print bg-white px-4 md:px-5 py-3.5 md:py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-slate-800 flex flex-wrap items-center gap-2">
                <span>A4さんすうプリント作成</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedQuestions.length} 問選択中（1枚推奨: 2〜3問）
                </span>
              </h2>
              <p className="text-[11px] md:text-xs text-slate-500">
                スマホは「A4 PDF」から Canon PRINT へ送信／PCは「印刷する」で即プリント！
              </p>
            </div>
          </div>

          {/* モード切替タブ */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                mode === 'preview'
                  ? 'bg-white text-blue-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>印刷プレビュー</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('grading')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                mode === 'grading'
                  ? 'bg-white text-emerald-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>このプリントを丸つけ</span>
            </button>
          </div>

          {/* アクションボタン群（PDF保存/共有 ＋ PC直接印刷） */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={selectedQuestions.length === 0 || isGeneratingPdf}
              className="flex items-center space-x-1.5 px-3.5 md:px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs md:text-sm font-bold shadow-md shadow-blue-200 transition-all active:scale-95"
              title="スマホ印刷用にA4 PDFを作成して共有・保存（Canon PRINT対応）"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>A4 PDF (保存/共有)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={selectedQuestions.length === 0 || isGeneratingPdf}
              className="flex items-center space-x-1.5 px-3 md:px-4 py-2.5 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 border border-slate-300 rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all active:scale-95"
              title="PC等からプリンターへ直接印刷"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">印刷する (A4)</span>
              <span className="sm:hidden">直接印刷</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="閉じる"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* ステータス通知バー（PDF作成結果） */}
        {pdfStatusMessage && (
          <div
            className={`no-print px-5 py-2 text-xs font-medium flex items-center justify-between border-b shrink-0 ${
              pdfStatusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <span>{pdfStatusMessage.text}</span>
            <div className="flex items-center gap-3">
              {preparedPdfFile && (
                <button
                  type="button"
                  onClick={handleDownloadPrepared}
                  className="underline font-bold hover:opacity-80"
                >
                  再ダウンロード
                </button>
              )}
              <button
                type="button"
                onClick={() => setPdfStatusMessage(null)}
                className="text-current opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* 画面専用コントロールバー（印刷時は非表示） */}
        {mode === 'preview' && (
          <div className="no-print bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            {/* 問題セレクター（バッジ） */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
              <span className="font-bold text-slate-600 shrink-0">問題を選ぶ:</span>
              {activeQuestions.length === 0 ? (
                <span className="text-slate-400">滞留中の問題はありません</span>
              ) : (
                activeQuestions.map((q, idx) => {
                  const isSelected = selectedIds.includes(q.id);
                  const gem = getGemInfo(q.status);
                  return (
                    <button
                      type="button"
                      key={q.id}
                      onClick={() => handleToggleSelect(q.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-sm'
                          : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{gem.icon}</span>
                      <span>
                        問{idx + 1}: {q.monster_name || q.category}
                      </span>
                    </button>
                  );
                })
              )}
              {activeQuestions.length > 3 && (
                <button
                  type="button"
                  onClick={handleResetRecommend}
                  className="text-blue-600 hover:underline shrink-0 text-xs font-semibold ml-1"
                >
                  今日のおすすめ3問
                </button>
              )}
            </div>

            {/* オプションチェックボックス */}
            <div className="flex flex-wrap items-center gap-4 text-slate-700">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGridDots}
                  onChange={(e) => setShowGridDots(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>けいさん方眼マスを表示</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAnswerSheet}
                  onChange={(e) => setIncludeAnswerSheet(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>解答・解説シート（2ページ目）も含める</span>
              </label>
            </div>
          </div>
        )}

        {/* メインスクロールエリア */}
        <div
          ref={previewContainerRef}
          className="flex-1 overflow-y-auto p-3 md:p-8 flex justify-center print:p-0 print:overflow-visible print:bg-white print:block print-area"
        >
          {mode === 'grading' ? (
            /* 丸つけモード */
            <div className="no-print w-full max-w-2xl bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h3 className="text-base font-bold text-slate-800">
                  📋 プリントの丸つけ（アプリへ結果を反映）
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  解き終わった紙のプリントを見ながら、各問の「できた！(○)」または「もう1回(×)」をタップしてください。
                </p>
              </div>

              {selectedQuestions.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  問題が選択されていません。
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedQuestions.map((q, idx) => {
                    const variant = getCurrentVariant(q);
                    const gem = getGemInfo(q.status);
                    return (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                              {gem.icon} {q.monster_name || q.category}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                              {gem.name}
                            </span>
                          </div>
                        </div>

                        {/* 解答と式 */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                          <div className="flex gap-4 flex-wrap">
                            <span className="font-bold text-blue-600">
                              しき: {variant.formula}
                            </span>
                            <span className="font-bold text-emerald-600">
                              こたえ: {variant.answer}
                            </span>
                          </div>
                          {variant.parent_hint && (
                            <p className="text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded">
                              💡 ヒント: {variant.parent_hint}
                            </p>
                          )}
                        </div>

                        {/* 丸つけ判定ボタン */}
                        <div className="flex gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => onAnswer(q.id, 'wrong')}
                            className="flex-1 py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>もう1回 (×)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onAnswer(q.id, 'correct')}
                            className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>できた！ (○)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* 印刷プレビューモード（スマホではA4比率のまま画面幅に縮小表示） */
            <div className="space-y-6 w-full flex flex-col items-center print:block print:space-y-0">
              {questionPages.map((pageQuestions, pIdx) => (
                <ScaledPrintPage key={`q-page-${pIdx}`} scale={previewScale}>
                  <ProblemSheetPage
                    questions={pageQuestions}
                    pageIndex={pIdx}
                    totalPages={questionPages.length}
                    totalQuestionCount={selectedQuestions.length}
                    startNumber={pIdx * QUESTIONS_PER_PAGE + 1}
                    todayStr={todayStr}
                    showGridDots={showGridDots}
                  />
                </ScaledPrintPage>
              ))}

              {answerPages.map((pageQuestions, pIdx) => (
                <ScaledPrintPage key={`a-page-${pIdx}`} scale={previewScale}>
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
          )}
        </div>
      </div>

      {/* PDF生成中のみマウントする等倍（794x1123）キャプチャ用コンテナ（画面オーバーレイ裏側で確実に描画） */}
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
                ふりがなや筆算レイアウトをA4用紙サイズで整えています（数秒かかります）
              </p>
            </div>
          </div>
        </>
      )}

      {/* iOS Safari等で非同期後の共有シート自動起動が制限された場合のワンタップ確認パネル */}
      {showSharePrompt && preparedPdfFile && (
        <div className="fixed inset-0 z-[65] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                📄
              </div>
              <h3 className="text-base font-bold text-slate-800 pt-1">
                A4 PDFの準備ができました！
              </h3>
              <p className="text-xs text-slate-500">
                下のボタンを押すと共有メニューが開きます。「Canon PRINT」を選んで印刷してください。
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleTriggerSharePrepared}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-200 active:scale-95 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Canon PRINT へ送る / 共有</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPrepared}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileDown className="w-4 h-4" />
                <span>端末にファイルを保存</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSharePrompt(false)}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { BottomNav, AppTab } from './components/BottomNav';
import { PrintBuilderView, PrintActionBar } from './components/PrintBuilderView';
import { GradingView } from './components/GradingView';
import { StockView } from './components/StockView';
import { QuestionDetailSheet } from './components/QuestionDetailSheet';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { PdfExportLayer, useA4PdfExport } from './components/PdfExportLayer';
import { CaptureModal } from './components/CaptureModal';
import { FeedbackModal } from './components/FeedbackModal';
import { OriginalImageModal } from './components/OriginalImageModal';
import { SettingsModal } from './components/SettingsModal';
import { StorageService, normalizeStatus } from './services/storage';
import {
  PrintPreferences,
  PrintSessionState,
  QuestionItem,
  UserSettings,
} from './types';
import { getRecommendedPrintIds } from './utils/gemHelper';

export const App: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionItem[]>(() =>
    StorageService.getLocalQuestions()
  );
  const [settings, setSettings] = useState<UserSettings>(() =>
    StorageService.getSettings()
  );
  const [activeTab, setActiveTab] = useState<AppTab>('build');
  const [isSyncing, setIsSyncing] = useState(false);

  const [printPrefs, setPrintPrefs] = useState<PrintPreferences>(() =>
    StorageService.getPrintPreferences()
  );
  const [printSession, setPrintSession] = useState<PrintSessionState>(() => {
    const initialQuestions = StorageService.getLocalQuestions();
    const saved = StorageService.getPrintSession();
    const validSelected = saved.selectedIds.filter((id) =>
      initialQuestions.some((q) => q.id === id && normalizeStatus(q.status) !== 'inbox')
    );
    return {
      ...saved,
      selectedIds:
        validSelected.length > 0
          ? validSelected
          : getRecommendedPrintIds(initialQuestions, 3),
    };
  });

  const userClearedRef = useRef(false);

  // モーダル・シート管理
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [detailQuestion, setDetailQuestion] = useState<QuestionItem | null>(null);
  const [feedbackQuestion, setFeedbackQuestion] = useState<QuestionItem | null>(null);
  const [originalImageQuestion, setOriginalImageQuestion] =
    useState<QuestionItem | null>(null);

  // 初回起動時にGitHub同期
  useEffect(() => {
    handleSync();
  }, []);

  const syncPrintSessionWithQuestions = (
    nextQuestions: QuestionItem[],
    allowAutoRecommend: boolean
  ) => {
    setPrintSession((prev) => {
      const validSelected = prev.selectedIds.filter((id) =>
        nextQuestions.some((q) => q.id === id && normalizeStatus(q.status) !== 'inbox')
      );
      const validPrinted = prev.lastPrintedIds.filter((id) =>
        nextQuestions.some((q) => q.id === id)
      );
      const nextSelected =
        validSelected.length > 0 || !allowAutoRecommend || userClearedRef.current
          ? validSelected
          : getRecommendedPrintIds(nextQuestions, 3);

      const updated: PrintSessionState = {
        ...prev,
        selectedIds: nextSelected,
        lastPrintedIds: validPrinted,
      };
      StorageService.savePrintSession(updated);
      return updated;
    });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await StorageService.syncWithGitHub();
      if (res.data) {
        setQuestions(res.data);
        syncPrintSessionWithQuestions(res.data, true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  // 印刷対象問題の選択トグル
  const handleToggleSelect = (questionId: string) => {
    userClearedRef.current = false;
    setPrintSession((prev) => {
      const exists = prev.selectedIds.includes(questionId);
      const nextSelected = exists
        ? prev.selectedIds.filter((id) => id !== questionId)
        : [...prev.selectedIds, questionId];
      const updated = { ...prev, selectedIds: nextSelected };
      StorageService.savePrintSession(updated);
      return updated;
    });
  };

  const handleSelectRecommended = () => {
    userClearedRef.current = false;
    const recommended = getRecommendedPrintIds(questions, 3);
    setPrintSession((prev) => {
      const updated = { ...prev, selectedIds: recommended };
      StorageService.savePrintSession(updated);
      return updated;
    });
  };

  const handleClearSelection = () => {
    userClearedRef.current = true;
    setPrintSession((prev) => {
      const updated = { ...prev, selectedIds: [] };
      StorageService.savePrintSession(updated);
      return updated;
    });
  };

  const handleUpdatePrintPrefs = (patch: Partial<PrintPreferences>) => {
    setPrintPrefs((prev) => {
      const next = { ...prev, ...patch };
      StorageService.savePrintPreferences(next);
      return next;
    });
  };

  const handleRecordPrintedBatch = (printedIds: string[]) => {
    const updated = StorageService.recordPrintedBatch(printedIds);
    setPrintSession((prev) => ({
      ...prev,
      lastPrintedIds: updated.lastPrintedIds,
      printedTodayIds: updated.printedTodayIds,
      printedDate: updated.printedDate,
      lastPrintedAt: updated.lastPrintedAt,
    }));
  };

  // 親の○×判定
  const handleAnswer = async (questionId: string, result: 'correct' | 'wrong') => {
    const target = questions.find((q) => q.id === questionId);
    if (!target) return;

    const updated = StorageService.handleAnswerResult(target, result);
    const newQuestions = questions.map((q) => (q.id === questionId ? updated : q));
    setQuestions(newQuestions);

    await StorageService.commitQuestionsToGitHub(
      newQuestions,
      `feat(review): mark question ${questionId} as ${result} (status: ${updated.status})`
    );

    if (detailQuestion && detailQuestion.id === questionId) {
      setDetailQuestion(updated);
    }
  };

  // 問題削除
  const handleDeleteQuestion = async (questionId: string) => {
    const updated = await StorageService.deleteQuestion(questionId);
    setQuestions(updated);
    syncPrintSessionWithQuestions(updated, false);
    if (detailQuestion && detailQuestion.id === questionId) {
      setDetailQuestion(null);
    }
  };

  // 親ツッコミの送信
  const handleFeedbackSubmit = async (
    questionId: string,
    comment: string,
    tags: string[]
  ) => {
    const target = questions.find((q) => q.id === questionId);
    if (!target) return;

    const updated = StorageService.addFeedback(target, comment, tags);
    const newQuestions = questions.map((q) => (q.id === questionId ? updated : q));
    setQuestions(newQuestions);

    await StorageService.commitQuestionsToGitHub(
      newQuestions,
      `feedback(parent): request regeneration for ${questionId} - ${tags.join(',')}`
    );

    if (detailQuestion && detailQuestion.id === questionId) {
      setDetailQuestion(updated);
    }
  };

  // 新規問題追加
  const handleQuestionAdded = (newQuestion: QuestionItem) => {
    const updated = [newQuestion, ...questions];
    setQuestions(updated);
    setActiveTab('build');
  };

  // 設定保存時
  const handleSettingsSaved = () => {
    setSettings(StorageService.getSettings());
    const localQuestions = StorageService.getLocalQuestions();
    setQuestions(localQuestions);
    syncPrintSessionWithQuestions(localQuestions, true);
  };

  // 選択中の問題（選択番号順を維持）
  const selectedQuestions = printSession.selectedIds
    .map((id) => questions.find((q) => q.id === id))
    .filter((q): q is QuestionItem => Boolean(q));

  const pdfExport = useA4PdfExport({
    selectedQuestions,
    showGridDots: printPrefs.showGridDots,
    includeAnswerSheet: printPrefs.includeAnswerSheet,
    onPrintedBatch: handleRecordPrintedBatch,
  });

  const gradeBadgeCount = printSession.lastPrintedIds.filter((id) =>
    questions.some((q) => q.id === id)
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans print:block print:min-h-0 print:bg-white">
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSync={handleSync}
        isSyncing={isSyncing}
      />

      {/* メインコンテンツ */}
      <main
        className={`flex-1 max-w-2xl w-full mx-auto px-3.5 py-3.5 no-print ${
          activeTab === 'build' ? 'pb-40' : 'pb-24'
        }`}
      >
        {activeTab === 'build' && (
          <PrintBuilderView
            questions={questions}
            selectedIds={printSession.selectedIds}
            printedTodayIds={printSession.printedTodayIds}
            stageConfig={settings.stageConfig}
            isSyncing={isSyncing}
            onSync={handleSync}
            onToggleSelect={handleToggleSelect}
            onSelectRecommended={handleSelectRecommended}
            onClearSelection={handleClearSelection}
            onOpenDetail={(q) => setDetailQuestion(q)}
            onGoToStock={() => setActiveTab('stock')}
            onOpenCapture={() => setIsCaptureOpen(true)}
            pdfStatusMessage={pdfExport.pdfStatusMessage}
            onDismissStatusMessage={() => pdfExport.setPdfStatusMessage(null)}
            hasPreparedPdf={Boolean(pdfExport.preparedPdfFile)}
            onRedownloadPdf={pdfExport.handleDownloadPrepared}
            onOpenShareOptions={() => pdfExport.setShowSharePrompt(true)}
          />
        )}

        {activeTab === 'grade' && (
          <GradingView
            questions={questions}
            lastPrintedIds={printSession.lastPrintedIds}
            stageConfig={settings.stageConfig}
            onAnswer={handleAnswer}
            onOpenDetail={(q) => setDetailQuestion(q)}
            onOpenFeedback={(q) => setFeedbackQuestion(q)}
          />
        )}

        {activeTab === 'stock' && (
          <StockView
            questions={questions}
            selectedIds={printSession.selectedIds}
            printedTodayIds={printSession.printedTodayIds}
            stageConfig={settings.stageConfig}
            onToggleSelect={handleToggleSelect}
            onOpenDetail={(q) => setDetailQuestion(q)}
          />
        )}
      </main>

      {/* 下部固定バー（印刷バー ＋ タブナビ） */}
      <div className="fixed bottom-0 inset-x-0 z-30 no-print">
        {activeTab === 'build' && (
          <PrintActionBar
            selectedCount={selectedQuestions.length}
            showGridDots={printPrefs.showGridDots}
            includeAnswerSheet={printPrefs.includeAnswerSheet}
            isGeneratingPdf={pdfExport.isGeneratingPdf}
            onToggleGridDots={(checked) =>
              handleUpdatePrintPrefs({ showGridDots: checked })
            }
            onToggleAnswerSheet={(checked) =>
              handleUpdatePrintPrefs({ includeAnswerSheet: checked })
            }
            onOpenPreview={() => setIsPreviewOpen(true)}
            onExportPdf={pdfExport.handleExportPdf}
            onPrintDirect={pdfExport.handlePrintDirect}
          />
        )}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenCapture={() => setIsCaptureOpen(true)}
          gradeBadgeCount={gradeBadgeCount}
        />
      </div>

      {/* PDF生成・共有・PC直接印刷レイヤー */}
      <PdfExportLayer
        selectedQuestions={selectedQuestions}
        stageConfig={settings.stageConfig}
        showGridDots={printPrefs.showGridDots}
        includeAnswerSheet={printPrefs.includeAnswerSheet}
        headerTitle={settings.printHeaderTitle}
        pdfCaptureRef={pdfExport.pdfCaptureRef}
        isGeneratingPdf={pdfExport.isGeneratingPdf}
        preparedPdfFile={pdfExport.preparedPdfFile}
        showSharePrompt={pdfExport.showSharePrompt}
        onCloseSharePrompt={() => pdfExport.setShowSharePrompt(false)}
        onTriggerShare={pdfExport.handleTriggerSharePrepared}
        onDownload={pdfExport.handleDownloadPrepared}
        onOpenInBrowser={pdfExport.handleOpenInBrowser}
        onGoToGrade={() => setActiveTab('grade')}
      />

      {/* A4紙面プレビューモーダル */}
      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        selectedQuestions={selectedQuestions}
        stageConfig={settings.stageConfig}
        showGridDots={printPrefs.showGridDots}
        includeAnswerSheet={printPrefs.includeAnswerSheet}
        headerTitle={settings.printHeaderTitle}
        isGeneratingPdf={pdfExport.isGeneratingPdf}
        hasPreparedPdf={Boolean(pdfExport.preparedPdfFile)}
        onExportPdf={pdfExport.handleExportPdf}
        onPrintDirect={pdfExport.handlePrintDirect}
        onOpenShareOptions={() => pdfExport.setShowSharePrompt(true)}
      />

      {/* 問題詳細ボトムシート */}
      <QuestionDetailSheet
        question={detailQuestion}
        stageConfig={settings.stageConfig}
        isSelectedForPrint={
          detailQuestion ? printSession.selectedIds.includes(detailQuestion.id) : false
        }
        onTogglePrint={handleToggleSelect}
        onClose={() => setDetailQuestion(null)}
        onOpenFeedback={(q) => setFeedbackQuestion(q)}
        onOpenOriginalImage={(q) => setOriginalImageQuestion(q)}
        onDelete={handleDeleteQuestion}
      />

      {/* その他モーダル */}
      <CaptureModal
        isOpen={isCaptureOpen}
        onClose={() => setIsCaptureOpen(false)}
        onQuestionAdded={handleQuestionAdded}
      />

      <FeedbackModal
        question={feedbackQuestion}
        onClose={() => setFeedbackQuestion(null)}
        onSubmit={handleFeedbackSubmit}
      />

      <OriginalImageModal
        question={originalImageQuestion}
        onClose={() => setOriginalImageQuestion(null)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={handleSettingsSaved}
      />
    </div>
  );
};

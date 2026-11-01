import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BossDeck } from './components/BossDeck';
import { MonsterMap } from './components/MonsterMap';
import { CaptureModal } from './components/CaptureModal';
import { FeedbackModal } from './components/FeedbackModal';
import { OriginalImageModal } from './components/OriginalImageModal';
import { SettingsModal } from './components/SettingsModal';
import { QuestionCard } from './components/QuestionCard';
import { StorageService } from './services/storage';
import { QuestionItem, UserSettings } from './types';

export const App: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionItem[]>(() => StorageService.getLocalQuestions());
  const [settings, setSettings] = useState<UserSettings>(() => StorageService.getSettings());
  const [isParentMode, setIsParentMode] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<'quest' | 'map'>('quest');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // モーダル管理
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [feedbackQuestion, setFeedbackQuestion] = useState<QuestionItem | null>(null);
  const [originalImageQuestion, setOriginalImageQuestion] = useState<QuestionItem | null>(null);
  const [detailQuestion, setDetailQuestion] = useState<QuestionItem | null>(null);

  // 初回起動時にGitHub同期を試行
  useEffect(() => {
    handleSync();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await StorageService.syncWithGitHub();
      if (res.data) {
        setQuestions(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
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
    if (detailQuestion && detailQuestion.id === questionId) {
      setDetailQuestion(null);
    }
  };

  // 親ツッコミの送信
  const handleFeedbackSubmit = async (questionId: string, comment: string, tags: string[]) => {
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
    setCurrentView('quest');
  };

  // 設定保存時
  const handleSettingsSaved = () => {
    setSettings(StorageService.getSettings());
    setQuestions(StorageService.getLocalQuestions());
  };

  // 今日の対象問題数（未完了）
  const dueCount = questions.filter((q) => q.status !== 'mastered').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header
        isParentMode={isParentMode}
        onToggleParentMode={() => setIsParentMode(!isParentMode)}
        onOpenCapture={() => setIsCaptureOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSync={handleSync}
        isSyncing={isSyncing}
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          setDetailQuestion(null);
        }}
        dueCount={dueCount}
      />

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 pb-20">
        {detailQuestion ? (
          <div className="space-y-4 max-w-2xl mx-auto">
            <button
              onClick={() => setDetailQuestion(null)}
              className="text-xs text-blue-600 font-bold hover:underline mb-2 block"
            >
              ← 一覧にもどる
            </button>
            <QuestionCard
              question={detailQuestion}
              isParentMode={isParentMode}
              stageConfig={settings.stageConfig}
              onAnswer={handleAnswer}
              onOpenFeedback={(q) => setFeedbackQuestion(q)}
              onOpenOriginalImage={(q) => setOriginalImageQuestion(q)}
              onDelete={handleDeleteQuestion}
            />
          </div>
        ) : currentView === 'quest' ? (
          <BossDeck
            questions={questions}
            isParentMode={isParentMode}
            stageConfig={settings.stageConfig}
            onAnswer={handleAnswer}
            onOpenFeedback={(q) => setFeedbackQuestion(q)}
            onOpenOriginalImage={(q) => setOriginalImageQuestion(q)}
            onOpenCapture={() => setIsCaptureOpen(true)}
            onDelete={handleDeleteQuestion}
          />
        ) : (
          <MonsterMap
            questions={questions}
            stageConfig={settings.stageConfig}
            onSelectQuestion={(q) => setDetailQuestion(q)}
          />
        )}
      </main>

      {/* モーダル群 */}
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

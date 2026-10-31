import React, { useState } from 'react';
import { Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { QuestionItem } from '../types';
import { QuestionCard } from './QuestionCard';

interface BossDeckProps {
  questions: QuestionItem[];
  isParentMode: boolean;
  onAnswer: (questionId: string, result: 'correct' | 'wrong') => void;
  onOpenFeedback: (question: QuestionItem) => void;
  onOpenOriginalImage: (question: QuestionItem) => void;
  onOpenCapture: () => void;
}

export const BossDeck: React.FC<BossDeckProps> = ({
  questions,
  isParentMode,
  onAnswer,
  onOpenFeedback,
  onOpenOriginalImage,
  onOpenCapture,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 今日やるべきボス（inbox, day1_ready, day2_boss, weekend_boss）
  // 殿堂入り(mastered)以外を対象とし、最大3〜5問
  const activeQuestions = questions.filter((q) => q.status !== 'mastered');

  // インデックスの範囲チェック
  const safeIndex = Math.min(currentIndex, Math.max(0, activeQuestions.length - 1));
  const currentQuestion = activeQuestions[safeIndex];

  const handleNext = () => {
    if (safeIndex < activeQuestions.length - 1) {
      setCurrentIndex(safeIndex + 1);
    }
  };

  const handlePrev = () => {
    if (safeIndex > 0) {
      setCurrentIndex(safeIndex - 1);
    }
  };

  // 討伐完了画面
  if (activeQuestions.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 md:p-12 text-center border border-slate-200 shadow-sm max-w-xl mx-auto my-6">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-inner animate-bounce">
          🏆
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          今日のボスはぜんぶ倒したよ！
        </h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          すごい！今日のクエストはパーフェクト達成！<br />
          明日になると、また新しいモンスターが復活してくるよ。
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onOpenCapture}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            📸 新しい問題を撮影して追加する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* クエスト進行バー */}
      <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span className="text-xs font-bold text-slate-700">
            今日のボス戦: {safeIndex + 1} / {activeQuestions.length} 匹目
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handlePrev}
            disabled={safeIndex === 0}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-500">
            {safeIndex + 1}/{activeQuestions.length}
          </span>
          <button
            onClick={handleNext}
            disabled={safeIndex === activeQuestions.length - 1}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 現在の問題カード */}
      {currentQuestion && (
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          isParentMode={isParentMode}
          onAnswer={(id, res) => {
            onAnswer(id, res);
            // 正解・不正解判定後、次のカードへ自動送り
            if (safeIndex < activeQuestions.length - 1) {
              setCurrentIndex(safeIndex + 1);
            }
          }}
          onOpenFeedback={onOpenFeedback}
          onOpenOriginalImage={onOpenOriginalImage}
        />
      )}
    </div>
  );
};

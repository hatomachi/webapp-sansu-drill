import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  MessageSquarePlus,
  Shield,
  Sparkles,
  Award,
  Crown,
} from 'lucide-react';
import { QuestionItem, QuestionStatus } from '../types';

interface QuestionCardProps {
  question: QuestionItem;
  isParentMode: boolean;
  onAnswer: (questionId: string, result: 'correct' | 'wrong') => void;
  onOpenFeedback: (question: QuestionItem) => void;
  onOpenOriginalImage: (question: QuestionItem) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  isParentMode,
  onAnswer,
  onOpenFeedback,
  onOpenOriginalImage,
}) => {
  const [showAnswer, setShowAnswer] = useState(false);

  // ステータスに応じたバッジ
  const renderStatusBadge = (status: QuestionStatus) => {
    switch (status) {
      case 'day1_ready':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Day 1 初回ボス</span>
          </span>
        );
      case 'day2_boss':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold badge-silver">
            <Award className="w-3.5 h-3.5 text-slate-700" />
            <span>Day 2 翌日ボス戦（銀メダル挑戦！）</span>
          </span>
        );
      case 'weekend_boss':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold badge-gold">
            <Crown className="w-3.5 h-3.5 text-amber-900" />
            <span>週末ボス復活戦（完全マスター挑戦！）</span>
          </span>
        );
      case 'mastered':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Crown className="w-3.5 h-3.5 text-emerald-600" />
            <span>殿堂入り（完全制覇）</span>
          </span>
        );
      case 'inbox':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">
            <span>🥚 AI解析待ち</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-lg transition-all overflow-hidden flex flex-col">
      {/* カードヘッダー */}
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-3xl filter drop-shadow-sm p-1 bg-white rounded-2xl border border-slate-100">
            {question.monster_icon || '👾'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-800">
                {question.monster_name || '文章題モンスター'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">{question.category}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {renderStatusBadge(question.status)}
          {question.needs_regeneration && (
            <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-300">
              🔄 再生成要求中
            </span>
          )}
        </div>
      </div>

      {/* 問題本文（小2向け特大文字・ルビ） */}
      <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
        <div className="text-xs font-bold text-slate-400 mb-3 flex items-center justify-between">
          <span>📝 もんだい（紙のノートに しきと こたえを かこう！）</span>
          {(question.raw_image_path || question.raw_image_base64) && (
            <button
              onClick={() => onOpenOriginalImage(question)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>元の写真を見る</span>
            </button>
          )}
        </div>

        {/* 問題文レンダリング（HTML ruby タグ対応） */}
        <div
          className="text-xl md:text-2xl font-medium text-slate-800 leading-loose tracking-wide font-sans select-text"
          dangerouslySetInnerHTML={{ __html: question.problem_text }}
        />
      </div>

      {/* 親モード・解答解説アコーディオン */}
      {isParentMode && (
        <div className="border-t border-slate-100 bg-amber-50/40 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAnswer(!showAnswer)}
              className="flex items-center space-x-2 text-xs font-bold text-amber-900 hover:text-amber-950 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>親向け解答・解説・指導ヒント</span>
              {showAnswer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* ツッコミボタン */}
            <button
              type="button"
              onClick={() => onOpenFeedback(question)}
              className="flex items-center space-x-1 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl border border-amber-300 transition-colors"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>AIにツッコミを入れる</span>
            </button>
          </div>

          {showAnswer && (
            <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-2.5 text-xs text-slate-700 animate-in fade-in duration-150">
              {question.formula && (
                <div className="flex items-baseline space-x-2">
                  <span className="font-bold text-amber-900 min-w-12">【立式】:</span>
                  <span className="font-mono text-base font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                    {question.formula}
                  </span>
                </div>
              )}
              {question.answer && (
                <div className="flex items-baseline space-x-2">
                  <span className="font-bold text-amber-900 min-w-12">【答え】:</span>
                  <span className="font-bold text-base text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {question.answer}
                  </span>
                </div>
              )}
              {question.parent_hint && (
                <div className="bg-amber-100/70 p-3 rounded-xl border border-amber-200">
                  <div className="font-bold text-amber-950 mb-0.5 flex items-center space-x-1">
                    <Shield className="w-3.5 h-3.5 text-amber-700" />
                    <span>親の声かけ・つまずき指導ヒント:</span>
                  </div>
                  <p className="text-amber-900 leading-relaxed">{question.parent_hint}</p>
                </div>
              )}
              {question.explanation && (
                <div className="text-slate-600 text-[11px] leading-relaxed">
                  <span className="font-bold">解説: </span>
                  {question.explanation}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* フッター: 親の赤ペン丸つけボタン (○ できた！ / × もう1回) */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">
          親の丸つけ判定 ➡
        </span>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => onAnswer(question.id, 'wrong')}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <XCircle className="w-4 h-4" />
            <span>もう1回（×）</span>
          </button>

          <button
            type="button"
            onClick={() => onAnswer(question.id, 'correct')}
            className="flex items-center space-x-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-200 transition-all active:scale-95"
          >
            <CheckCircle className="w-4 h-4" />
            <span>できた！（○ 討伐成功）</span>
          </button>
        </div>
      </div>
    </div>
  );
};

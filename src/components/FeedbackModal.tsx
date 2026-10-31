import React, { useState } from 'react';
import { X, MessageSquarePlus, Sparkles, Check } from 'lucide-react';
import { QuestionItem } from '../types';

interface FeedbackModalProps {
  question: QuestionItem | null;
  onClose: () => void;
  onSubmit: (questionId: string, comment: string, tags: string[]) => void;
}

const QUICK_TAGS = [
  '線分図を描かせる意図',
  '問題のタイプが違う',
  '足し算ではなく逆算（引き算）',
  '答えが割り切れない・綺麗じゃない',
  '小2には言葉が難しすぎる',
  '図や具体物（りんご等）をイメージさせたい',
  '数字だけ変えた完全類題にして',
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ question, onClose, onSubmit }) => {
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!question) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() && selectedTags.length === 0) return;

    setIsSubmitting(true);
    const finalComment = comment.trim();
    onSubmit(question.id, finalComment, selectedTags);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* ヘッダー */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-amber-50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">親のツッコミ ＆ 類題再生成</h3>
              <p className="text-xs text-amber-700">AIに教育的意図・違和感をフィードバック</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              現在の問題
            </label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 line-clamp-3">
              {question.problem_plain_text}
            </div>
          </div>

          {/* クイックタグ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              よくあるツッコミ（タップで選択）
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center space-x-1 ${
                      isSelected
                        ? 'bg-amber-500 border-amber-600 text-white font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 自由記述エリア */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              親のこだわり・修正指示（自由入力）
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="例: この問題は単なる割り算ではなく『線分図を描いて全体から部分を引く』感覚を身につけさせたいです。数字も2年生が手計算できる範囲（答えは30以下）にしてください。"
              rows={4}
              className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              ※ Mac側のAIがこのツッコミを最優先プロンプトとして取り込み、再生成します。
            </p>
          </div>

          {/* 過去のツッコミ履歴 */}
          {question.feedback_history && question.feedback_history.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500">過去のフィードバック履歴:</span>
              <div className="mt-1 space-y-1 max-h-24 overflow-y-auto">
                {question.feedback_history.map((fb, idx) => (
                  <div key={idx} className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                    <div className="text-slate-400 text-[10px]">{new Date(fb.timestamp).toLocaleString('ja-JP')}</div>
                    <div>{fb.comment}</div>
                    {fb.quick_tags && fb.quick_tags.length > 0 && (
                      <div className="flex gap-1 mt-0.5">
                        {fb.quick_tags.map(t => (
                          <span key={t} className="bg-amber-100 text-amber-800 px-1 rounded text-[10px]">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 送信ボタン */}
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!comment.trim() && selectedTags.length === 0)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ツッコミ送信 ＆ 再生成要求</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Printer, X, FileText, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { QuestionItem, StageConfig } from '../types';
import { normalizeStatus } from '../services/storage';
import { getCurrentVariant, getGemInfo, getStageLabel } from '../utils/gemHelper';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuestionItem[];
  stageConfig: StageConfig;
  onAnswer: (questionId: string, result: 'correct' | 'wrong') => void;
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

  // 解答シートを2ページ目に印刷するかどうか
  const [includeAnswerSheet, setIncludeAnswerSheet] = useState<boolean>(true);

  // 計算スペースのスタイル
  const [showGridDots, setShowGridDots] = useState<boolean>(true);

  // モード: 'preview' (プレビュー＆印刷) | 'grading' (一括丸つけ)
  const [mode, setMode] = useState<'preview' | 'grading'>('preview');

  if (!isOpen) return null;

  // 選択中の問題リスト
  const selectedQuestions = questions.filter((q) => selectedIds.includes(q.id));

  // 問題の選択トグル
  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 4) {
        alert('A4 1枚に綺麗に印刷するには、最大3〜4問までがおすすめです。');
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  // 全選択 / おすすめ3問リセット
  const handleResetRecommend = () => {
    setSelectedIds(activeQuestions.slice(0, 3).map((q) => q.id));
  };

  // 印刷実行
  const handlePrint = () => {
    if (selectedIds.length === 0) {
      alert('印刷する問題を1問以上選んでください。');
      return;
    }
    window.print();
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
        <div className="no-print bg-white px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                A4さんすうプリント作成
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedIds.length} 問選択中（A4 1枚推奨: 2〜3問）
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                自宅プリンターでA4用紙に印刷して、紙と鉛筆でチャレンジ！
              </p>
            </div>
          </div>

          {/* モード切替タブ */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
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

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              disabled={selectedIds.length === 0}
              className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ 印刷する (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

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
                      key={q.id}
                      onClick={() => handleToggleSelect(q.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-sm'
                          : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{gem.icon}</span>
                      <span>問{idx + 1}: {q.monster_name || q.category}</span>
                    </button>
                  );
                })
              )}
              {activeQuestions.length > 3 && (
                <button
                  onClick={handleResetRecommend}
                  className="text-blue-600 hover:underline shrink-0 text-xs font-semibold ml-1"
                >
                  今日のおすすめ3問
                </button>
              )}
            </div>

            {/* オプションチェックボックス */}
            <div className="flex items-center space-x-4 text-slate-700">
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
                <span>解答・解説シート（2ページ目）も印刷</span>
              </label>
            </div>
          </div>
        )}

        {/* メインスクロールエリア */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center print:p-0 print:overflow-visible print:bg-white print-area">
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
                          <div className="flex gap-4">
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
                            onClick={() => onAnswer(q.id, 'wrong')}
                            className="flex-1 py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>もう1回 (×)</span>
                          </button>
                          <button
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
            /* 印刷プレビューモード（A4紙面風コンテナ） */
            <div className="space-y-8 w-full flex flex-col items-center">
              {/* === 1ページ目: 問題用紙 === */}
              <div className="bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] p-8 md:p-12 shadow-xl border border-slate-300 rounded-lg flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none print-page">
                <div>
                  {/* 用紙ヘッダー */}
                  <div className="border-b-2 border-slate-800 pb-3 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">📐</span>
                        <div>
                          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-wider">
                            さんすう チャレンジプリント
                          </h1>
                          <p className="text-[11px] text-slate-600 font-medium">
                            小2・まちがえた文章題の とっくんドリル
                          </p>
                        </div>
                      </div>

                      {/* 日付・なまえ・点数欄 */}
                      <div className="flex items-end gap-3 text-xs md:text-sm">
                        <div className="border border-slate-400 rounded px-2.5 py-1 text-center min-w-[100px]">
                          <span className="text-[10px] text-slate-500 block leading-none mb-0.5">ひづけ</span>
                          <span className="font-mono font-bold text-slate-800">{todayStr}</span>
                        </div>
                        <div className="border border-slate-400 rounded px-3 py-1 min-w-[140px]">
                          <span className="text-[10px] text-slate-500 block leading-none mb-0.5">なまえ</span>
                          <span className="inline-block w-full border-b border-dotted border-slate-400 h-4"></span>
                        </div>
                        <div className="border-2 border-slate-800 rounded px-3 py-1 text-center min-w-[70px]">
                          <span className="text-[10px] font-bold text-slate-600 block leading-none mb-0.5">てんすう</span>
                          <span className="text-base font-black text-slate-900">/ 100</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 問題一覧 */}
                  {selectedQuestions.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                      上のバーから問題を1問以上選んでください。
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedQuestions.map((q, idx) => {
                        const variant = getCurrentVariant(q);
                        const gem = getGemInfo(q.status);
                        // 問題数に応じた方眼の高さ調整（2問なら広々、3問なら適度）
                        const gridHeightClass =
                          selectedQuestions.length <= 2 ? 'h-44 md:h-52' : 'h-28 md:h-32';

                        return (
                          <div
                            key={q.id}
                            className="border-b border-slate-200 pb-5 last:border-b-0 last:pb-0"
                          >
                            {/* 問題タイトル行 */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-black text-sm flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span className="font-bold text-sm text-slate-800">
                                  {q.monster_icon || '💎'} {q.monster_name || q.category}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium border border-slate-300 px-1.5 py-0.2 rounded">
                                  {q.category}
                                </span>
                              </div>

                              {/* できたよシール/塗り絵枠 */}
                              <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-bold border border-dashed border-slate-400 rounded-full px-2.5 py-0.5">
                                <span>{gem.icon}</span>
                                <span className="text-[11px] font-normal">できた！ ➜ [　]</span>
                              </div>
                            </div>

                            {/* 問題文（ルビ対応、HTML直接描画） */}
                            <div
                              className="text-[15px] md:text-[16px] leading-relaxed text-slate-900 pl-9 mb-3 font-medium select-text"
                              dangerouslySetInnerHTML={{ __html: variant.problem_text }}
                            />

                            {/* けいさん・考えをかくところ（方眼スペース） */}
                            <div className="pl-9 space-y-2">
                              <div
                                className={`w-full border border-slate-300 rounded-lg relative p-2 ${
                                  showGridDots ? 'bg-grid-dots' : 'bg-white'
                                } ${gridHeightClass}`}
                              >
                                <span className="text-[10px] font-bold text-slate-400 select-none">
                                  【けいさん・かんがえを かくところ】
                                </span>
                              </div>

                              {/* 式・答え記入欄 */}
                              <div className="flex flex-wrap items-center justify-end gap-6 text-sm font-bold pt-1">
                                <div className="flex items-center space-x-2 min-w-[200px]">
                                  <span className="text-slate-700">しき:</span>
                                  <span className="flex-1 border-b-2 border-slate-700 min-w-[140px] inline-block h-6"></span>
                                </div>
                                <div className="flex items-center space-x-2 min-w-[140px]">
                                  <span className="text-slate-700">こたえ:</span>
                                  <span className="flex-1 border-b-2 border-slate-700 min-w-[90px] inline-block h-6 text-right pr-2"></span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 用紙フッター */}
                <div className="border-t border-slate-300 pt-3 mt-6 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>ぜんぶ解けたら、おうちの人に見せて丸つけしてもらおう！</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-400">
                    Sansu Drill PWA - {selectedQuestions.length} Questions
                  </div>
                </div>
              </div>

              {/* === 2ページ目: 保護者向け解答・指導ヒントシート（オプション） === */}
              {includeAnswerSheet && selectedQuestions.length > 0 && (
                <div className="bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] p-8 md:p-12 shadow-xl border border-slate-300 rounded-lg flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none print-page">
                  <div>
                    {/* 解答ヘッダー */}
                    <div className="border-b-2 border-emerald-600 pb-3 mb-6 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">📋</span>
                        <div>
                          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-wider">
                            さんすうプリント 解答・指導の手引き
                          </h2>
                          <p className="text-[11px] text-slate-600 font-medium">
                            保護者向け（赤ペンで丸つけして、できたところをほめてあげてください）
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {todayStr}
                      </div>
                    </div>

                    {/* 各問の正解・解説・声かけヒント */}
                    <div className="space-y-6">
                      {selectedQuestions.map((q, idx) => {
                        const variant = getCurrentVariant(q);
                        const gem = getGemInfo(q.status);
                        const stageLabel = getStageLabel(q.status, stageConfig);

                        return (
                          <div
                            key={q.id}
                            className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3"
                          >
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                              <div className="flex items-center space-x-2">
                                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span className="font-bold text-sm text-slate-800">
                                  {q.monster_icon || '💎'} {q.monster_name || q.category}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  {gem.name} ({stageLabel})
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 font-medium">
                                単元: {q.category}
                              </span>
                            </div>

                            {/* 正解の式・答え */}
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex flex-wrap gap-6 text-sm">
                              <div>
                                <span className="text-xs text-emerald-800 font-bold block">【しき】</span>
                                <span className="font-mono font-bold text-emerald-950 text-base">
                                  {variant.formula}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs text-emerald-800 font-bold block">【こたえ】</span>
                                <span className="font-bold text-emerald-950 text-base">
                                  {variant.answer}
                                </span>
                              </div>
                            </div>

                            {/* 解説 */}
                            {variant.explanation && (
                              <div className="text-xs text-slate-700">
                                <span className="font-bold text-slate-900">【解説】</span>
                                <p className="mt-0.5 leading-relaxed">{variant.explanation}</p>
                              </div>
                            )}

                            {/* 声かけヒント */}
                            {variant.parent_hint && (
                              <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                                <span className="font-bold flex items-center gap-1 text-amber-800 mb-1">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                  親の声かけ・指導のコツ
                                </span>
                                <p className="leading-relaxed">{variant.parent_hint}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 mt-6 text-center text-[11px] text-slate-400">
                    Sansu Drill Parent Guide - お子様のつまずきに寄り添う声かけを大切に
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

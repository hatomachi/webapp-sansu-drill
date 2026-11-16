import React from 'react';
import { Sparkles } from 'lucide-react';
import { QuestionItem, StageConfig } from '../types';
import { getCurrentVariant, getGemInfo, getStageLabel } from '../utils/gemHelper';

export const A4_PAGE_WIDTH_PX = 794;
export const A4_PAGE_HEIGHT_PX = 1123;
export const QUESTIONS_PER_PAGE = 3;

export function chunkQuestions(
  questions: QuestionItem[],
  size: number = QUESTIONS_PER_PAGE
): QuestionItem[][] {
  if (questions.length === 0) return [[]];
  const chunks: QuestionItem[][] = [];
  for (let i = 0; i < questions.length; i += size) {
    chunks.push(questions.slice(i, i + size));
  }
  return chunks;
}

interface ScaledPrintPageProps {
  scale: number;
  children: React.ReactNode;
}

/**
 * 画面プレビュー時のみ画面幅に合わせて縮小表示し、印刷時は等倍に戻すラッパー
 */
export const ScaledPrintPage: React.FC<ScaledPrintPageProps> = ({
  scale,
  children,
}) => (
  <div
    style={{
      width: `${Math.round(A4_PAGE_WIDTH_PX * scale)}px`,
      height: `${Math.round(A4_PAGE_HEIGHT_PX * scale)}px`,
    }}
    className="shrink-0 print-scale-wrapper"
  >
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${A4_PAGE_WIDTH_PX}px`,
      }}
      className="print-scale-inner"
    >
      {children}
    </div>
  </div>
);

interface QuestionPageProps {
  questions: QuestionItem[];
  pageIndex: number;
  totalPages: number;
  totalQuestionCount: number;
  startNumber: number;
  todayStr: string;
  showGridDots: boolean;
  isForPdf?: boolean;
}

export const ProblemSheetPage: React.FC<QuestionPageProps> = ({
  questions,
  pageIndex,
  totalPages,
  totalQuestionCount,
  startNumber,
  todayStr,
  showGridDots,
  isForPdf = false,
}) => {
  return (
    <div
      style={{
        width: `${A4_PAGE_WIDTH_PX}px`,
        height: `${A4_PAGE_HEIGHT_PX}px`,
      }}
      className={`bg-white text-slate-900 p-[36px] box-border flex flex-col justify-between overflow-hidden ${
        isForPdf
          ? ''
          : 'shadow-xl border border-slate-300 rounded-lg print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none print-page'
      }`}
    >
      {/* 上部：ヘッダー＋問題エリア */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* 用紙ヘッダー */}
        <div className="shrink-0 border-b-2 border-slate-800 pb-2.5 mb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2.5">
              <span className="text-[26px] leading-none">📐</span>
              <div>
                <h1 className="text-[20px] font-black text-slate-900 tracking-wider leading-tight">
                  さんすう チャレンジプリント
                  {totalPages > 1 && (
                    <span className="ml-2 text-[13px] font-bold text-slate-500">
                      ({pageIndex + 1}/{totalPages})
                    </span>
                  )}
                </h1>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  小2・まちがえた文章題の とっくんドリル
                </p>
              </div>
            </div>

            {/* 日付・なまえ・点数欄 */}
            <div className="flex items-end gap-2.5 text-[12px] shrink-0">
              <div className="border border-slate-400 rounded px-2.5 py-1 text-center min-w-[96px]">
                <span className="text-[10px] text-slate-500 block leading-none mb-0.5">
                  ひづけ
                </span>
                <span className="font-mono font-bold text-slate-800">{todayStr}</span>
              </div>
              <div className="border border-slate-400 rounded px-3 py-1 min-w-[136px]">
                <span className="text-[10px] text-slate-500 block leading-none mb-0.5">
                  なまえ
                </span>
                <span className="inline-block w-full border-b border-dotted border-slate-400 h-4"></span>
              </div>
              <div className="border-2 border-slate-800 rounded px-3 py-1 text-center min-w-[68px]">
                <span className="text-[10px] font-bold text-slate-600 block leading-none mb-0.5">
                  てんすう
                </span>
                <span className="text-[15px] font-black text-slate-900">/ 100</span>
              </div>
            </div>
          </div>
        </div>

        {/* 問題一覧 */}
        {questions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            上のバーから問題を1問以上選んでください。
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            {questions.map((q, idx) => {
              const variant = getCurrentVariant(q);
              const gem = getGemInfo(q.status);
              const displayNumber = startNumber + idx;

              return (
                <div
                  key={q.id}
                  className="flex-1 min-h-0 flex flex-col border-b border-slate-200 pb-3 last:border-b-0 last:pb-0"
                >
                  {/* 問題タイトル行 */}
                  <div className="shrink-0 flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-[26px] h-[26px] rounded-lg bg-slate-900 text-white font-black text-[13px] flex items-center justify-center shrink-0">
                        {displayNumber}
                      </span>
                      <span className="font-bold text-[14px] text-slate-800">
                        {q.monster_icon || '💎'} {q.monster_name || q.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium border border-slate-300 px-1.5 py-0.5 rounded">
                        {q.category}
                      </span>
                    </div>

                    {/* できたよシール/塗り絵枠 */}
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-600 font-bold border border-dashed border-slate-400 rounded-full px-2.5 py-0.5 shrink-0">
                      <span>{gem.icon}</span>
                      <span className="font-normal">できた！ ➜ [　]</span>
                    </div>
                  </div>

                  {/* 問題文（ルビ対応、HTML直接描画） */}
                  <div
                    className="shrink-0 text-[15px] leading-[1.65] text-slate-900 pl-[34px] mb-2 font-medium select-text print-problem-body"
                    dangerouslySetInnerHTML={{ __html: variant.problem_text }}
                  />

                  {/* けいさん・考えをかくところ（余白に合わせて自動伸縮） */}
                  <div className="flex-1 min-h-[44px] flex flex-col pl-[34px]">
                    <div
                      className={`flex-1 min-h-[36px] w-full border border-slate-300 rounded-lg relative p-2 ${
                        showGridDots ? 'bg-grid-dots' : 'bg-white'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-slate-400 select-none">
                        【けいさん・かんがえを かくところ】
                      </span>
                    </div>

                    {/* 式・答え記入欄 */}
                    <div className="shrink-0 flex items-center justify-end gap-6 text-[13px] font-bold pt-1.5">
                      <div className="flex items-center space-x-2 min-w-[200px]">
                        <span className="text-slate-700">しき:</span>
                        <span className="flex-1 border-b-2 border-slate-700 min-w-[150px] inline-block h-5"></span>
                      </div>
                      <div className="flex items-center space-x-2 min-w-[150px]">
                        <span className="text-slate-700">こたえ:</span>
                        <span className="flex-1 border-b-2 border-slate-700 min-w-[95px] inline-block h-5 text-right pr-2"></span>
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
      <div className="shrink-0 border-t border-slate-300 pt-2.5 mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>ぜんぶ解けたら、おうちの人に見せて丸つけしてもらおう！</span>
        </div>
        <div className="font-mono text-[10px] text-slate-400">
          Sansu Drill PWA - {totalQuestionCount} Questions
        </div>
      </div>
    </div>
  );
};

interface AnswerPageProps {
  questions: QuestionItem[];
  pageIndex: number;
  totalPages: number;
  startNumber: number;
  todayStr: string;
  stageConfig: StageConfig;
  isForPdf?: boolean;
}

export const AnswerSheetPage: React.FC<AnswerPageProps> = ({
  questions,
  pageIndex,
  totalPages,
  startNumber,
  todayStr,
  stageConfig,
  isForPdf = false,
}) => {
  return (
    <div
      style={{
        width: `${A4_PAGE_WIDTH_PX}px`,
        height: `${A4_PAGE_HEIGHT_PX}px`,
      }}
      className={`bg-white text-slate-900 p-[36px] box-border flex flex-col justify-between overflow-hidden ${
        isForPdf
          ? ''
          : 'shadow-xl border border-slate-300 rounded-lg print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none print-page'
      }`}
    >
      <div className="flex-1 min-h-0 flex flex-col">
        {/* 解答ヘッダー */}
        <div className="shrink-0 border-b-2 border-emerald-600 pb-2.5 mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="text-[24px] leading-none">📋</span>
            <div>
              <h2 className="text-[19px] font-black text-slate-900 tracking-wider leading-tight">
                さんすうプリント 解答・指導の手引き
                {totalPages > 1 && (
                  <span className="ml-2 text-[13px] font-bold text-slate-500">
                    ({pageIndex + 1}/{totalPages})
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                保護者向け（赤ペンで丸つけして、できたところをほめてあげてください）
              </p>
            </div>
          </div>
          <div className="text-[12px] text-slate-500 font-mono">{todayStr}</div>
        </div>

        {/* 各問の正解・解説・声かけヒント */}
        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
          {questions.map((q, idx) => {
            const variant = getCurrentVariant(q);
            const gem = getGemInfo(q.status);
            const stageLabel = getStageLabel(q.status, stageConfig);
            const displayNumber = startNumber + idx;

            return (
              <div
                key={q.id}
                className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-[22px] h-[22px] rounded-md bg-emerald-600 text-white font-bold text-[12px] flex items-center justify-center shrink-0">
                      {displayNumber}
                    </span>
                    <span className="font-bold text-[13px] text-slate-800">
                      {q.monster_icon || '💎'} {q.monster_name || q.category}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {gem.name} ({stageLabel})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    単元: {q.category}
                  </span>
                </div>

                {/* 正解の式・答え */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex flex-wrap gap-6 text-[13px]">
                  <div>
                    <span className="text-[10px] text-emerald-800 font-bold block">
                      【しき】
                    </span>
                    <span className="font-mono font-bold text-emerald-950 text-[14px]">
                      {variant.formula}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-800 font-bold block">
                      【こたえ】
                    </span>
                    <span className="font-bold text-emerald-950 text-[14px]">
                      {variant.answer}
                    </span>
                  </div>
                </div>

                {/* 解説 */}
                {variant.explanation && (
                  <div className="text-[11px] text-slate-700 leading-[1.5]">
                    <span className="font-bold text-slate-900">【解説】</span>
                    <span>{variant.explanation}</span>
                  </div>
                )}

                {/* 声かけヒント */}
                {variant.parent_hint && (
                  <div className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 leading-[1.5]">
                    <span className="font-bold inline-flex items-center gap-1 text-amber-800 mr-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      親の声かけ:
                    </span>
                    <span>{variant.parent_hint}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200 pt-2.5 mt-3 text-center text-[11px] text-slate-400">
        Sansu Drill Parent Guide - お子様のつまずきに寄り添う声かけを大切に
      </div>
    </div>
  );
};

import React from 'react';
import { QuestionItem, StageConfig } from '../types';
import {
  getCurrentVariant,
  getQuestionTitle,
  getSolutionDisplay,
  getStageBadgeText,
} from '../utils/gemHelper';

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
  headerTitle?: string;
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
  headerTitle,
  isForPdf = false,
}) => {
  const sheetTitle = (headerTitle || '').trim() || 'さんすう ふくしゅうプリント';

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
            <div>
              <h1 className="text-[20px] font-black text-slate-900 tracking-wider leading-tight">
                {sheetTitle}
                {totalPages > 1 && (
                  <span className="ml-2 text-[13px] font-bold text-slate-500">
                    ({pageIndex + 1}/{totalPages})
                  </span>
                )}
              </h1>
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

        {/* 問題一覧（番号＋問題文＋計算スペースのみ） */}
        {questions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            印刷する問題を1問以上選んでください。
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col gap-3.5">
            {questions.map((q, idx) => {
              const variant = getCurrentVariant(q);
              const displayNumber = startNumber + idx;

              return (
                <div
                  key={q.id}
                  className="flex-1 min-h-0 flex flex-col border-b border-slate-200 pb-3.5 last:border-b-0 last:pb-0"
                >
                  {/* 番号＋問題文 */}
                  <div className="shrink-0 flex items-start gap-2.5 mb-2.5">
                    <span className="w-[26px] h-[26px] rounded-lg bg-slate-900 text-white font-black text-[13px] flex items-center justify-center shrink-0 mt-0.5">
                      {displayNumber}
                    </span>
                    <div
                      className="flex-1 min-w-0 text-[15px] leading-[1.65] text-slate-900 font-medium select-text print-problem-body"
                      dangerouslySetInnerHTML={{ __html: variant.problem_text }}
                    />
                  </div>

                  {/* 計算・考えスペースのみ（しき・こたえ欄なし） */}
                  <div className="flex-1 min-h-[56px] flex flex-col pl-[36px]">
                    <div
                      className={`flex-1 min-h-[48px] w-full border border-slate-300 rounded-lg relative p-2 ${
                        showGridDots ? 'bg-grid-dots' : 'bg-white'
                      }`}
                    >
                      <span className="text-[10px] font-medium text-slate-400 select-none">
                        けいさん・かんがえ
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 用紙フッター */}
      <div className="shrink-0 border-t border-slate-200 pt-2 mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
        <span>毎日のさんすう復習プリント</span>
        <span className="font-mono text-[10px]">
          全{totalQuestionCount}問
        </span>
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
          <div>
            <h2 className="text-[19px] font-black text-slate-900 tracking-wider leading-tight">
              さんすうプリント 解答・指導メモ
              {totalPages > 1 && (
                <span className="ml-2 text-[13px] font-bold text-slate-500">
                  ({pageIndex + 1}/{totalPages})
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              保護者向け丸つけ・解説シート
            </p>
          </div>
          <div className="text-[12px] text-slate-500 font-mono">{todayStr}</div>
        </div>

        {/* 各問の正解・解説・声かけヒント */}
        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
          {questions.map((q, idx) => {
            const variant = getCurrentVariant(q);
            const stageText = getStageBadgeText(q.status, stageConfig);
            const displayNumber = startNumber + idx;

            return (
              <div
                key={q.id}
                className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="w-[22px] h-[22px] rounded-md bg-emerald-600 text-white font-bold text-[12px] flex items-center justify-center shrink-0">
                      {displayNumber}
                    </span>
                    <span className="font-bold text-[13px] text-slate-800 truncate">
                      {getQuestionTitle(q)}
                    </span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                    {stageText}
                  </span>
                </div>

                {/* 正解（しき/こたえ統合） */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-[13px]">
                  <span className="text-[10px] text-emerald-800 font-bold block">
                    【正解】
                  </span>
                  <span className="font-bold text-emerald-950 text-[14px]">
                    {getSolutionDisplay(variant)}
                  </span>
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
                    <span className="font-bold text-amber-800 mr-1">
                      声かけヒント:
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
        Sansu Drill 保護者用解答シート
      </div>
    </div>
  );
};

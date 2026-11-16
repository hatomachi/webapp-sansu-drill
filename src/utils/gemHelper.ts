import { QuestionStatus, StageConfig, QuestionItem, ProblemVariant } from '../types';
import { normalizeStatus } from '../services/storage';

export interface GemInfo {
  name: string;
  icon: string;
  colorName: string;
  badgeClass: string;
  cardBorder: string;
  description: string;
}

export function getLocalTodayStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getGemInfo(rawStatus: QuestionStatus): GemInfo {
  const status = normalizeStatus(rawStatus);
  switch (status) {
    case 'inbox':
      return {
        name: '解析中',
        icon: '⏳',
        colorName: 'スレート',
        badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold',
        cardBorder: 'border-amber-200 bg-amber-50/30',
        description: 'AIが類題を作成中',
      };
    case 'stage2':
      return {
        name: '2回目',
        icon: '2',
        colorName: 'スカイ',
        badgeClass: 'bg-sky-50 text-sky-800 border border-sky-200 font-semibold',
        cardBorder: 'border-sky-200 bg-sky-50/40',
        description: '1回クリア（復習中）',
      };
    case 'stage3':
      return {
        name: '3回目',
        icon: '3',
        colorName: 'インディゴ',
        badgeClass: 'bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold',
        cardBorder: 'border-indigo-200 bg-indigo-50/40',
        description: '2回クリア（仕上げ）',
      };
    case 'mastered':
      return {
        name: '完了',
        icon: '✓',
        colorName: 'エメラルド',
        badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold',
        cardBorder: 'border-emerald-200 bg-emerald-50/40',
        description: '3回クリア（定着完了）',
      };
    case 'stage1':
    default:
      return {
        name: '1回目',
        icon: '1',
        colorName: 'アンバー',
        badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold',
        cardBorder: 'border-amber-200 bg-amber-50/30',
        description: '初回・再挑戦',
      };
  }
}

export function getStageLabel(rawStatus: QuestionStatus, config: StageConfig): string {
  const status = normalizeStatus(rawStatus);
  switch (status) {
    case 'stage1':
      return config.stage1Label || '毎日';
    case 'stage2':
      return config.stage2Label || '水・土';
    case 'stage3':
      return config.stage3Label || '2週後';
    case 'mastered':
      return '定着完了';
    case 'inbox':
      return 'AI生成中';
    default:
      return '復習';
  }
}

export function getStageBadgeText(rawStatus: QuestionStatus, config: StageConfig): string {
  const status = normalizeStatus(rawStatus);
  const info = getGemInfo(status);
  if (status === 'mastered' || status === 'inbox') {
    return info.name;
  }
  return `${info.name}（${getStageLabel(status, config)}）`;
}

export function getQuestionTitle(question: QuestionItem): string {
  if (normalizeStatus(question.status) === 'inbox') {
    return question.memo ? `解析中: ${question.memo}` : '撮影済み（AI解析中）';
  }
  if (question.category && question.category !== '未解析（AI解析中）') {
    return question.category;
  }
  return question.monster_name || '算数の問題';
}

export function getSolutionDisplay(variant: ProblemVariant): string {
  const ans = (variant.answer || '').trim();
  const formula = (variant.formula || '').trim();
  if (ans && formula && formula !== ans) {
    return `${ans}（${formula}）`;
  }
  return ans || formula || '（解答未登録）';
}

export function isDueToday(question: QuestionItem, todayStr: string = getLocalTodayStr()): boolean {
  const status = normalizeStatus(question.status);
  if (status === 'mastered' || status === 'inbox') return false;
  if (status === 'stage1') return true;
  if (!question.next_review_date) return true;
  return question.next_review_date <= todayStr;
}

export function getRecommendedPrintIds(questions: QuestionItem[], maxCount = 3): string[] {
  const todayStr = getLocalTodayStr();
  const printable = questions.filter((q) => {
    const s = normalizeStatus(q.status);
    return s !== 'mastered' && s !== 'inbox';
  });

  const due = printable.filter((q) => isDueToday(q, todayStr));
  const upcoming = printable.filter((q) => !isDueToday(q, todayStr));
  return [...due, ...upcoming].slice(0, maxCount).map((q) => q.id);
}

/**
 * 現在のステージに応じた出題バリアントを取得
 * - stage1 (毎日) ➜ 問1 (variants[0])
 * - stage2 (水・土) ➜ 問2 (variants[1])
 * - stage3 (2週後) ➜ 問3 (variants[2])
 */
export function getCurrentVariant(question: QuestionItem): ProblemVariant {
  const status = normalizeStatus(question.status);
  const variants = question.variants;

  if (variants && variants.length > 0) {
    if (status === 'stage2') {
      return variants[1] || variants[0];
    }
    if (status === 'stage3' || status === 'mastered') {
      return variants[2] || variants[1] || variants[0];
    }
    return variants[0];
  }

  return {
    problem_text: question.problem_text || 'もんだいを よみこみちゅう...',
    problem_plain_text: question.problem_plain_text || 'もんだいを よみこみちゅう...',
    formula: question.formula || '',
    answer: question.answer || '',
    explanation: question.explanation || '',
    parent_hint: question.parent_hint || '',
  };
}

/**
 * 現在の出題が何問目のバリアントか（0-indexed）を取得
 */
export function getCurrentVariantIndex(question: QuestionItem): number {
  const status = normalizeStatus(question.status);
  if (status === 'stage2') return 1;
  if (status === 'stage3' || status === 'mastered') return 2;
  return 0;
}

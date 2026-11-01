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

export function getGemInfo(rawStatus: QuestionStatus): GemInfo {
  const status = normalizeStatus(rawStatus);
  switch (status) {
    case 'stage2':
      return {
        name: 'オパール',
        icon: '⚪️',
        colorName: 'オパールホワイト',
        badgeClass: 'badge-opal font-bold',
        cardBorder: 'border-slate-300 bg-slate-50/50',
        description: '1回クリア（オパール獲得）',
      };
    case 'stage3':
      return {
        name: 'サファイア',
        icon: '🔷',
        colorName: 'サファイアブルー',
        badgeClass: 'badge-sapphire font-bold',
        cardBorder: 'border-blue-300 bg-blue-50/50',
        description: '2回クリア（サファイア獲得）',
      };
    case 'mastered':
      return {
        name: 'ダイヤモンド',
        icon: '💎',
        colorName: 'ダイヤ',
        badgeClass: 'badge-diamond font-black',
        cardBorder: 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-200',
        description: '3回クリア（ダイヤモンド殿堂入り！）',
      };
    case 'stage1':
    default:
      return {
        name: 'ステップ1',
        icon: '✨',
        colorName: 'チャレンジャー',
        badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
        cardBorder: 'border-emerald-200 bg-emerald-50/30',
        description: 'はじめての挑戦',
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
      return '殿堂入り';
    case 'inbox':
      return 'AI解析中';
    default:
      return 'もんだい';
  }
}

/**
 * 現在のステージ（オパール/サファイア/ダイヤ）に応じた出題バリアントを取得
 * - stage1 (毎日) ➜ 問1 (variants[0])
 * - stage2 (水・土) ➜ 問2 (variants[1])
 * - stage3 (2週後) ➜ 問3 (variants[2])
 * - 既存の1問データの場合はフォールバック
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

  // 万が一 variants が空の場合のフォールバック
  return {
    problem_text: 'もんだいを よみこみちゅう...',
    problem_plain_text: 'もんだいを よみこみちゅう...',
    formula: '',
    answer: '',
    explanation: '',
    parent_hint: '',
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

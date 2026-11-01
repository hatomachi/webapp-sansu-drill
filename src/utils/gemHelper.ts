import { QuestionStatus, StageConfig } from '../types';
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

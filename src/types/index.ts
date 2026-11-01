export type QuestionStatus =
  | 'inbox'         // 写真撮影直後（AI類題生成待ち）
  | 'stage1'        // ステージ1: 最初（毎日）
  | 'stage2'        // ステージ2: 復習（水・土など） - オパール獲得
  | 'stage3'        // ステージ3: 総仕上げ（2週後など） - サファイア獲得
  | 'mastered'      // 殿堂入り - ダイヤモンド獲得！
  // 旧ステータス（後方互換）
  | 'day1_ready'
  | 'day2_boss'
  | 'weekend_boss';

export interface StageConfig {
  stage1Label: string; // 例: "毎日"
  stage2Label: string; // 例: "水・土"
  stage3Label: string; // 例: "2週後"
}

export interface FeedbackLog {
  timestamp: string;
  comment: string;
  quick_tags?: string[];
}

export interface QuestionItem {
  id: string;                      // 固有ID (例: q_20261101_001)
  created_at: string;              // ISO日時
  updated_at: string;              // ISO日時
  next_review_date: string;        // YYYY-MM-DD
  status: QuestionStatus;
  
  // 原問題情報
  raw_image_path?: string;         // data/raw/xxxx.jpg へのパスまたはURL
  raw_image_base64?: string;       // ローカルプレビュー用
  memo?: string;                   // 親のメモ

  // 単元・カテゴリー
  category: string;                // 例: "たし算とひき算の文章題", "水のかさ", "たし算の逆算（線分図）"
  monster_name?: string;           // 題名・モチーフ（例: "どんぐりのくらべっこ", "ふしぎなクッキー"）
  monster_icon?: string;           // アイコン・絵文字（例: "🐿️", "🍪", "💧"）

  // AI生成類題
  problem_text: string;            // ルビ・ふりがな付きHTMLまたはテキスト
  problem_plain_text: string;      // プレーンテキスト

  // 解答・解説（親向け）
  formula: string;                 // 例: "12 + 8 = 20"
  answer: string;                  // 例: "20こ"
  explanation: string;             // 親向け解説
  parent_hint: string;             // 親の指導ヒント（声かけ・線分図の描き方など）

  // 親ツッコミ・再生成
  needs_regeneration?: boolean;    // 再生成待ちフラグ
  feedback_history: FeedbackLog[]; // 親のツッコミ履歴

  // 達成・正解履歴
  consecutive_correct: number;     // 連続正解数
  history: Array<{
    date: string;
    result: 'correct' | 'wrong';
    stage: QuestionStatus;
  }>;
}

export interface UserSettings {
  githubToken: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  dataPathPrefix: string;  // 例: "30_Kids/SansuDrill"
  geminiApiKey?: string;
  isDemoMode: boolean;
  stageConfig: StageConfig;
}

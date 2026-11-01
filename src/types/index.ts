export type QuestionStatus =
  | 'inbox'         // 写真撮影直後（AI類題生成待ち）
  | 'day1_ready'    // Day1: 初回確認待ち（紙と鉛筆で一度解いてみる）
  | 'day2_boss'     // Day2: 翌日ボス戦（銀メダル仮討伐チャンス）
  | 'weekend_boss'  // 週末: ボス復活戦（金キラキラ完全制覇チャンス）
  | 'mastered';     // 殿堂入り（完全マスター）

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
  monster_name: string;            // 例: "水のかさモンスター・リッター", "あわせるドラゴン"
  monster_icon: string;            // 絵文字またはアイコン名 (例: "🐉", "💧", "🧙‍♂️")

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

  // 討伐履歴
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
}

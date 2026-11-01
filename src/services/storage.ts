import { QuestionItem, UserSettings, QuestionStatus, StageConfig } from '../types';

const STORAGE_KEY_QUESTIONS = 'sansu_drill_questions_v1';
const STORAGE_KEY_SETTINGS = 'sansu_drill_settings_v1';

export const DEFAULT_STAGE_CONFIG: StageConfig = {
  stage1Label: '毎日',
  stage2Label: '水・土',
  stage3Label: '2週後',
};

// 旧ステータスを3段階へ正規化する関数
export function normalizeStatus(status: QuestionStatus): QuestionStatus {
  if (status === 'day1_ready') return 'stage1';
  if (status === 'day2_boss') return 'stage2';
  if (status === 'weekend_boss') return 'stage3';
  return status;
}

// 直近の水曜日または土曜日（2日以上先）を算出
export function getNextWedOrSat(from: Date = new Date()): Date {
  const day = from.getDay(); // 0:日, 1:月, 2:火, 3:水, 4:木, 5:金, 6:土
  let daysToAdd = 3;
  if (day === 0) daysToAdd = 3; // 日 ➜ 水 (+3)
  else if (day === 1) daysToAdd = 2; // 月 ➜ 水 (+2)
  else if (day === 2) daysToAdd = 4; // 火 ➜ 土 (+4)
  else if (day === 3) daysToAdd = 3; // 水 ➜ 土 (+3)
  else if (day === 4) daysToAdd = 2; // 木 ➜ 土 (+2)
  else if (day === 5) daysToAdd = 5; // 金 ➜ 水 (+5)
  else if (day === 6) daysToAdd = 4; // 土 ➜ 水 (+4)
  return new Date(from.getTime() + daysToAdd * 24 * 3600 * 1000);
}

// 問題データの互換性正規化（古いPWAのキャッシュでも空白にならないよう相互補完）
export function normalizeQuestionItem(q: any): QuestionItem {
  const status = normalizeStatus(q.status);
  const variants = q.variants;

  let problem_text = q.problem_text;
  let problem_plain_text = q.problem_plain_text;
  let formula = q.formula;
  let answer = q.answer;
  let explanation = q.explanation;
  let parent_hint = q.parent_hint;

  if (variants && variants.length > 0) {
    const v0 = variants[0];
    if (!problem_text) problem_text = v0.problem_text;
    if (!problem_plain_text) problem_plain_text = v0.problem_plain_text;
    if (!formula) formula = v0.formula;
    if (!answer) answer = v0.answer;
    if (!explanation) explanation = v0.explanation;
    if (!parent_hint) parent_hint = v0.parent_hint;
  }

  return {
    ...q,
    status,
    variants: variants && variants.length > 0 ? variants : (problem_text ? [{
      problem_text,
      problem_plain_text: problem_plain_text || '',
      formula: formula || '',
      answer: answer || '',
      explanation: explanation || '',
      parent_hint: parent_hint || '',
    }] : []),
    problem_text,
    problem_plain_text,
    formula,
    answer,
    explanation,
    parent_hint,
  };
}

export const INITIAL_MOCK_QUESTIONS: QuestionItem[] = [
  {
    id: 'q_demo_001',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    next_review_date: new Date().toISOString().split('T')[0],
    status: 'stage2',
    category: 'たし算とひき算（ちがいに目をつける）',
    monster_name: 'どんぐりのくらべっこ',
    monster_icon: '🐿️',
    variants: [
      {
        problem_text: `<ruby>赤<rt>あか</rt></ruby>いどんぐりが 24<ruby>個<rt>こ</rt></ruby>、<ruby>青<rt>あお</rt></ruby>いどんぐりが 18<ruby>個<rt>こ</rt></ruby> あります。<br/><ruby>赤<rt>あか</rt></ruby>いどんぐりは、<ruby>青<rt>あお</rt></ruby>いどんぐりより <ruby>何個<rt>なんこ</rt></ruby> <ruby>多<rt>おお</rt></ruby>いですか。`,
        problem_plain_text: '赤いどんぐりが24個、青いどんぐりが18個あります。赤いどんぐりは、青いどんぐりより何個多いですか。',
        formula: '24 - 18 = 6',
        answer: '6個',
        explanation: '「どちらが何個多いか」を求めるときは、大きい数から小さい数をひくひき算になります。',
        parent_hint: '「どちらが多いかな？」「何個多いか比べるにはひき算だね」と声かけ。紙に24と18の長さの違い（線分図）をサラッと描かせてあげると直感が掴めます。',
      },
      {
        problem_text: `<ruby>黄色<rt>きいろ</rt></ruby>い シールが 32<ruby>枚<rt>まい</rt></ruby>、<ruby>緑色<rt>みどりいろ</rt></ruby>の シールが 19<ruby>枚<rt>まい</rt></ruby> あります。<br/><ruby>黄色<rt>きいろ</rt></ruby>い シールは、<ruby>緑色<rt>みどりいろ</rt></ruby>の シールより <ruby>何枚<rt>なんまい</rt></ruby> <ruby>多<rt>おお</rt></ruby>いですか。`,
        problem_plain_text: '黄色いシールが32枚、緑色のシールが19枚あります。黄色いシールは、緑色のシールより何枚多いですか。',
        formula: '32 - 19 = 13',
        answer: '13枚',
        explanation: '32から19をひくひき算（くり下がり1回）です。32 - 19 = 13枚。',
        parent_hint: 'オパール獲得おめでとう！数字が変わっても同じ考え方（差を求めるひき算）で解けるか確認してあげましょう。',
      },
      {
        problem_text: `<ruby>白<rt>しろ</rt></ruby>い おはじきが 45<ruby>個<rt>こ</rt></ruby>、<ruby>黒<rt>くろ</rt></ruby>い おはじきが 28<ruby>個<rt>こ</rt></ruby> あります。<br/><ruby>白<rt>しろ</rt></ruby>い おはじきは、<ruby>黒<rt>くろ</rt></ruby>い おはじきより <ruby>何個<rt>なんこ</rt></ruby> <ruby>多<rt>おお</rt></ruby>いですか。`,
        problem_plain_text: '白いおはじきが45個、黒いおはじきが28個あります。白いおはじきは、黒いおはじきより何個多いですか。',
        formula: '45 - 28 = 17',
        answer: '17個',
        explanation: '45から28をひくひき算です。45 - 28 = 17個。',
        parent_hint: 'いよいよダイヤへの挑戦！「ノートに筆算か線分図を書いてみよう」と声をかけて、落ち着いて計算を見守ってあげてください。',
      },
    ],
    needs_regeneration: false,
    feedback_history: [],
    consecutive_correct: 1,
    history: [
      {
        date: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0],
        result: 'correct',
        stage: 'stage1',
      },
    ],
  },
  {
    id: 'q_demo_002',
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    next_review_date: new Date().toISOString().split('T')[0],
    status: 'stage3',
    category: 'たし算の逆算（はじめの数を求める）',
    monster_name: 'ふしぎなクッキー',
    monster_icon: '🍪',
    variants: [
      {
        problem_text: `かごの <ruby>中<rt>なか</rt></ruby>に クッキーが <ruby>何枚<rt>なんまい</rt></ruby>か ありました。<br/>あとから 15<ruby>枚<rt>まい</rt></ruby> やいたら、ぜんぶで 32<ruby>枚<rt>まい</rt></ruby>に なりました。<br/>はじめに クッキーは <ruby>何枚<rt>なんまい</rt></ruby> ありましたか。`,
        problem_plain_text: 'かごの中にクッキーが何枚かありました。あとから15枚やいたら、ぜんぶで32枚になりました。はじめにクッキーは何枚ありましたか。',
        formula: '32 - 15 = 17',
        answer: '17枚',
        explanation: '「はじめの数 ＋ 15 ＝ 32」なので、はじめの数はぜんぶの32枚からあとからやいた15枚をひけば求まります。',
        parent_hint: '子どもは「やいた＝ふえた」で思わず足し算しがちです！「ぜんぶで32枚から、新しくやいた15枚をのけたら、最初のが残るよね」と指で隠してイメージさせるとスッと納得します。',
      },
      {
        problem_text: `はこに チョコレートが <ruby>何こ<rt>なんこ</rt></ruby>か ありました。<br/>あとから 18<ruby>こ<rt>こ</rt></ruby> いれたら、ぜんぶで 43<ruby>こ<rt>こ</rt></ruby>に なりました。<br/>はじめに チョコレートは <ruby>何こ<rt>なんこ</rt></ruby> ありましたか。`,
        problem_plain_text: 'はこにチョコレートが何こかありました。あとから18こいれたら、ぜんぶで43こになりました。はじめにチョコレートは何こありましたか。',
        formula: '43 - 18 = 25',
        answer: '25こ',
        explanation: 'ぜんぶの43こから、あとから入れた18こをひきます。43 - 18 = 25こ。',
        parent_hint: 'オパール獲得！「あとから入れた分を戻すと、最初のが残るね」と逆算のイメージを確認してあげてください。',
      },
      {
        problem_text: `ふくろに キャンディーが <ruby>何こ<rt>なんこ</rt></ruby>か ありました。<br/>あとから 24<ruby>こ<rt>こ</rt></ruby> いれたら、ぜんぶで 51<ruby>こ<rt>こ</rt></ruby>に なりました。<br/>はじめに キャンディーは <ruby>何こ<rt>なんこ</rt></ruby> ありましたか。`,
        problem_plain_text: 'ふくろにキャンディーが何こかありました。あとから24こいれたら、ぜんぶで51こになりました。はじめにキャンディーは何こありましたか。',
        formula: '51 - 24 = 27',
        answer: '27こ',
        explanation: '51 - 24 = 27こです。',
        parent_hint: 'ダイヤ挑戦！線分図を描いて「ぜんぶで51、ふえたのが24、はじめのは？」と図から立式させましょう。',
      },
    ],
    needs_regeneration: false,
    feedback_history: [
      {
        timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        comment: '足し算の文脈だけど逆算（引き算）を使う良問。この形式を類題で多めに出してほしい。',
        quick_tags: ['逆算（線分図）', '文章読解'],
      },
    ],
    consecutive_correct: 2,
    history: [
      {
        date: new Date(Date.now() - 72 * 3600 * 1000).toISOString().split('T')[0],
        result: 'correct',
        stage: 'stage1',
      },
      {
        date: new Date(Date.now() - 48 * 3600 * 1000).toISOString().split('T')[0],
        result: 'correct',
        stage: 'stage2',
      },
    ],
  },
  {
    id: 'q_demo_003',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    next_review_date: new Date().toISOString().split('T')[0],
    status: 'stage1',
    category: '水のかさ（LとdLの計算）',
    monster_name: '水そうのかさくらべ',
    monster_icon: '💧',
    variants: [
      {
        problem_text: `水そうに 水が 2L 4dL はいっています。<br/>そこに 3dL の 水を くわえました。<br/>水は ぜんぶで <ruby>何<rt>なん</rt></ruby>L <ruby>何<rt>なん</rt></ruby>dL に なりましたか。`,
        problem_plain_text: '水そうに水が2L 4dL入っています。そこに3dLの水をくわえました。水はぜんぶで何L何dLになりましたか。',
        formula: '4dL + 3dL = 7dL ➡ 2L 7dL',
        answer: '2L 7dL',
        explanation: 'dLどうしをたし算します。4dL ＋ 3dL ＝ 7dL。Lはそのまま2Lなので、2L 7dLになります。',
        parent_hint: 'LとdLをごちゃ混ぜに足さないように、「dLのお部屋どうしを足そうね」と声をかけてあげてください。',
      },
      {
        problem_text: `バケツに 水が 1L 5dL はいっています。<br/>そこに 4dL の 水を くわえました。<br/>水は ぜんぶで <ruby>何<rt>なん</rt></ruby>L <ruby>何<rt>なん</rt></ruby>dL に なりましたか。`,
        problem_plain_text: 'バケツに水が1L 5dL入っています。そこに4dLの水をくわえました。水はぜんぶで何L何dLになりましたか。',
        formula: '5dL + 4dL = 9dL ➡ 1L 9dL',
        answer: '1L 9dL',
        explanation: '5dL + 4dL = 9dL。Lは1Lのままなので 1L 9dL です。',
        parent_hint: 'オパール獲得！dLどうしを足す基本が身についているか確認してあげてください。',
      },
      {
        problem_text: `おなべに スープが 2L 3dL はいっています。<br/>そこに 5dL の スープを くわえました。<br/>スープは ぜんぶで <ruby>何<rt>なん</rt></ruby>L <ruby>何<rt>なん</rt></ruby>dL に なりましたか。`,
        problem_plain_text: 'おなべにスープが2L 3dL入っています。そこに5dLのスープをくわえました。スープはぜんぶで何L何dLになりましたか。',
        formula: '3dL + 5dL = 8dL ➡ 2L 8dL',
        answer: '2L 8dL',
        explanation: '3dL + 5dL = 8dL ➡ 2L 8dL。',
        parent_hint: 'ダイヤ挑戦！「単位をしっかり見て計算しようね」と声をかけてあげてください。',
      },
    ],
    needs_regeneration: false,
    feedback_history: [],
    consecutive_correct: 0,
    history: [],
  },
];

export const DEFAULT_SETTINGS: UserSettings = {
  githubToken: '',
  githubOwner: 'hatomachi',
  githubRepo: 'family-vault',
  githubBranch: 'main',
  dataPathPrefix: '30_Kids/SansuDrill',
  isDemoMode: true,
  stageConfig: DEFAULT_STAGE_CONFIG,
};

export class StorageService {
  static getSettings(): UserSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          stageConfig: {
            ...DEFAULT_STAGE_CONFIG,
            ...(parsed.stageConfig || {}),
          },
        };
      }
    } catch (e) {
      console.warn('Failed to read settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  }

  static saveSettings(settings: UserSettings): void {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }

  static getLocalQuestions(): QuestionItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_QUESTIONS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // 既存ステータスおよび問題データを正規化・救済
          return parsed.map((q) => normalizeQuestionItem(q));
        }
      }
    } catch (e) {
      console.warn('Failed to read questions from localStorage', e);
    }
    // 初期値としてモックを保存して返す
    localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(INITIAL_MOCK_QUESTIONS));
    return INITIAL_MOCK_QUESTIONS;
  }

  static saveLocalQuestions(questions: QuestionItem[]): void {
    localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(questions));
  }

  // 特定の問題を削除
  static async deleteQuestion(questionId: string): Promise<QuestionItem[]> {
    const questions = this.getLocalQuestions();
    const updated = questions.filter((q) => q.id !== questionId);
    this.saveLocalQuestions(updated);

    const settings = this.getSettings();
    if (settings.githubToken && !settings.isDemoMode) {
      await this.commitQuestionsToGitHub(updated, `feat(question): delete question ${questionId}`);
    }
    return updated;
  }

  // サンプル問題（q_demo_で始まるもの）を一括削除
  static async deleteSampleQuestions(): Promise<QuestionItem[]> {
    const questions = this.getLocalQuestions();
    const updated = questions.filter((q) => !q.id.startsWith('q_demo_'));
    this.saveLocalQuestions(updated);

    const settings = this.getSettings();
    if (settings.githubToken && !settings.isDemoMode) {
      await this.commitQuestionsToGitHub(updated, `feat(question): remove sample demo questions`);
    }
    return updated;
  }

  // すべての問題を初期化（空にする）
  static async clearAllQuestions(): Promise<QuestionItem[]> {
    this.saveLocalQuestions([]);
    const settings = this.getSettings();
    if (settings.githubToken && !settings.isDemoMode) {
      await this.commitQuestionsToGitHub([], `feat(question): clear all questions`);
    }
    return [];
  }

  // GitHub から questions.json を fetch してマージ
  static async syncWithGitHub(): Promise<{ success: boolean; message: string; data?: QuestionItem[] }> {
    const settings = this.getSettings();
    if (!settings.githubToken || settings.isDemoMode) {
      return { success: true, message: 'ローカルデモモードで動作中', data: this.getLocalQuestions() };
    }

    try {
      const questionsPath = `${settings.dataPathPrefix || '30_Kids/SansuDrill'}/questions.json`;
      const url = `https://api.github.com/repos/${settings.githubOwner}/${settings.githubRepo}/contents/${questionsPath}?ref=${settings.githubBranch}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `token ${settings.githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (res.status === 404) {
        await this.commitQuestionsToGitHub(this.getLocalQuestions(), 'chore: initialize questions.json');
        return { success: true, message: 'GitHubに初期データを作成しました', data: this.getLocalQuestions() };
      }

      if (!res.ok) {
        throw new Error(`GitHub APIエラー: ${res.status} ${res.statusText}`);
      }

      const fileData = await res.json();
      let jsonStr = '';
      if (fileData.content) {
        jsonStr = decodeURIComponent(
          escape(atob(fileData.content.replace(/\s/g, '')))
        );
      } else if (fileData.download_url) {
        // 1MB超の制限対策フォールバック
        const rawRes = await fetch(fileData.download_url, {
          headers: {
            Authorization: `token ${settings.githubToken}`,
          },
        });
        jsonStr = await rawRes.text();
      } else {
        throw new Error('GitHub APIからファイルコンテンツを取得できませんでした');
      }

      const remoteQuestions: QuestionItem[] = JSON.parse(jsonStr);
      const normalized = remoteQuestions.map((q) => normalizeQuestionItem(q));

      // ローカル保存
      this.saveLocalQuestions(normalized);
      return { success: true, message: 'GitHubと同期しました', data: normalized };
    } catch (e: any) {
      console.error('GitHub sync error:', e);
      return { success: false, message: e.message || '同期エラー', data: this.getLocalQuestions() };
    }
  }

  // questions.json を GitHub にコミット
  static async commitQuestionsToGitHub(questions: QuestionItem[], commitMessage: string): Promise<boolean> {
    const settings = this.getSettings();
    if (!settings.githubToken || settings.isDemoMode) {
      this.saveLocalQuestions(questions);
      return true;
    }

    try {
      const questionsPath = `${settings.dataPathPrefix || '30_Kids/SansuDrill'}/questions.json`;
      const url = `https://api.github.com/repos/${settings.githubOwner}/${settings.githubRepo}/contents/${questionsPath}`;
      
      let sha: string | undefined;
      const getRes = await fetch(`${url}?ref=${settings.githubBranch}`, {
        headers: {
          Authorization: `token ${settings.githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (getRes.ok) {
        const fileInfo = await getRes.json();
        sha = fileInfo.sha;
      }

      const jsonStr = JSON.stringify(questions, null, 2);
      const contentBase64 = btoa(unescape(encodeURIComponent(jsonStr)));

      const body: any = {
        message: commitMessage,
        content: contentBase64,
        branch: settings.githubBranch,
      };
      if (sha) body.sha = sha;

      const putRes = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `token ${settings.githubToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify(body),
      });

      if (!putRes.ok) {
        throw new Error(`Commit failed: ${putRes.status}`);
      }

      this.saveLocalQuestions(questions);
      return true;
    } catch (e) {
      console.error('Failed to commit questions to GitHub', e);
      this.saveLocalQuestions(questions);
      return false;
    }
  }

  // 撮影画像を GitHub (data/raw/xxxx.jpg) にアップロード
  static async uploadRawImage(
    fileName: string,
    base64Raw: string,
    memo?: string
  ): Promise<{ success: boolean; filePath: string; questionItem: QuestionItem }> {
    const settings = this.getSettings();
    const now = new Date();
    const id = `q_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${Date.now().toString().slice(-4)}`;
    const prefix = settings.dataPathPrefix || '30_Kids/SansuDrill';
    const filePath = `${prefix}/raw/${fileName}`;

    const newQuestion: QuestionItem = {
      id,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      next_review_date: now.toISOString().split('T')[0],
      status: 'inbox',
      raw_image_path: filePath,
      raw_image_base64: '', // questions.jsonの肥大化・1MB制限防止のためBase64は含めずrawファイルのみ保存
      memo: memo || '',
      category: '未解析（AI解析中）',
      monster_name: 'あたらしい問題',
      monster_icon: '✨',
      variants: [
        {
          problem_text: '親が撮影した問題をAIが解析中です...<br/>（Macの常駐スクリプトによる類題生成をお待ちください）',
          problem_plain_text: '親が撮影した問題をAIが解析中です...',
          formula: '',
          answer: '',
          explanation: 'Macスクリプトが新着画像を検知すると、小2向けの綺麗な数字で類題・解答・親向け解説を自動生成します。',
          parent_hint: '撮影完了！しばらくすると類題がカードになります。',
        },
      ],
      needs_regeneration: false,
      feedback_history: [],
      consecutive_correct: 0,
      history: [],
    };

    if (settings.githubToken && !settings.isDemoMode) {
      try {
        const url = `https://api.github.com/repos/${settings.githubOwner}/${settings.githubRepo}/contents/${filePath}`;
        await fetch(url, {
          method: 'PUT',
          headers: {
            Authorization: `token ${settings.githubToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github.v3+json',
          },
          body: JSON.stringify({
            message: `feat(capture): upload wrong problem image ${fileName}`,
            content: base64Raw,
            branch: settings.githubBranch,
          }),
        });
      } catch (e) {
        console.error('Failed to upload image to GitHub directly', e);
      }
    }

    const questions = this.getLocalQuestions();
    const updated = [newQuestion, ...questions];
    await this.commitQuestionsToGitHub(updated, `feat(question): register new captured question ${id}`);

    return {
      success: true,
      filePath,
      questionItem: newQuestion,
    };
  }

  // ○×判定によるステータス遷移（3段階宝石システム）
  // ステージ1（毎日） ➜ 正解で オパール獲得 ＆ ステージ2（水・土）へ
  // ステージ2（水・土） ➜ 正解で サファイア獲得 ＆ ステージ3（2週後）へ
  // ステージ3（2週後） ➜ 正解で ダイヤモンド獲得 ＆ 殿堂入り（mastered）！
  static handleAnswerResult(question: QuestionItem, result: 'correct' | 'wrong'): QuestionItem {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentStatus = normalizeStatus(question.status);
    let nextStatus: QuestionStatus = currentStatus;
    let nextReviewDate = todayStr;

    if (result === 'correct') {
      if (currentStatus === 'stage1' || currentStatus === 'inbox') {
        // ステージ1 クリア ➜ オパール獲得！ 次は水・土
        nextStatus = 'stage2';
        const nextDate = getNextWedOrSat(now);
        nextReviewDate = nextDate.toISOString().split('T')[0];
      } else if (currentStatus === 'stage2') {
        // ステージ2 クリア ➜ サファイア獲得！ 次は2週間後（14日後）
        nextStatus = 'stage3';
        const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 3600 * 1000);
        nextReviewDate = twoWeeksLater.toISOString().split('T')[0];
      } else if (currentStatus === 'stage3') {
        // ステージ3 クリア ➜ ダイヤモンド獲得！ 殿堂入り
        nextStatus = 'mastered';
        nextReviewDate = '';
      }
    } else {
      // 間違えた（×）場合
      if (currentStatus === 'stage2') {
        // ステージ2で苦戦 ➜ ステージ1（毎日）に戻して翌日再挑戦
        nextStatus = 'stage1';
        const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
        nextReviewDate = tomorrow.toISOString().split('T')[0];
      } else if (currentStatus === 'stage3') {
        // ステージ3で苦戦 ➜ ステージ2（水・土）に戻して直近の水・土に再挑戦
        nextStatus = 'stage2';
        const nextDate = getNextWedOrSat(now);
        nextReviewDate = nextDate.toISOString().split('T')[0];
      } else {
        // ステージ1で苦戦 ➜ ステージ1維持、翌日再挑戦
        nextStatus = 'stage1';
        const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
        nextReviewDate = tomorrow.toISOString().split('T')[0];
      }
    }

    const updated: QuestionItem = {
      ...question,
      status: nextStatus,
      next_review_date: nextReviewDate,
      updated_at: now.toISOString(),
      consecutive_correct: result === 'correct' ? question.consecutive_correct + 1 : 0,
      history: [
        ...question.history,
        {
          date: todayStr,
          result,
          stage: currentStatus,
        },
      ],
    };

    return updated;
  }

  // 親ツッコミの送信
  static addFeedback(question: QuestionItem, comment: string, quickTags?: string[]): QuestionItem {
    const log: { timestamp: string; comment: string; quick_tags?: string[] } = {
      timestamp: new Date().toISOString(),
      comment,
      quick_tags: quickTags,
    };

    return {
      ...question,
      needs_regeneration: true, // 再生成要求フラグON
      updated_at: new Date().toISOString(),
      feedback_history: [...question.feedback_history, log],
    };
  }

  private static imageCache = new Map<string, string>();

  // 元画像のデータURLを取得（キャッシュ ＆ rawバイナリ優先 ＆ Base64フォールバック）
  static async getRawImageUrl(filePath: string): Promise<string> {
    if (!filePath) return '';
    if (this.imageCache.has(filePath)) {
      return this.imageCache.get(filePath)!;
    }

    const settings = this.getSettings();
    if (!settings.githubToken || settings.isDemoMode) {
      return '';
    }

    try {
      const url = `https://api.github.com/repos/${settings.githubOwner}/${settings.githubRepo}/contents/${filePath}?ref=${settings.githubBranch}`;

      // 1. まず生バイナリ (raw) を直接取得（高速・CORS確実・Base64オーバーヘッドゼロ）
      const rawRes = await fetch(url, {
        headers: {
          Authorization: `token ${settings.githubToken}`,
          Accept: 'application/vnd.github.v3.raw',
        },
      });

      if (rawRes.ok) {
        const blob = await rawRes.blob();
        const objectUrl = URL.createObjectURL(blob);
        this.imageCache.set(filePath, objectUrl);
        return objectUrl;
      }

      // 2. フォールバック: JSON API (Base64)
      const res = await fetch(url, {
        headers: {
          Authorization: `token ${settings.githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (res.ok) {
        const fileData = await res.json();
        if (fileData.content) {
          const b64Url = `data:image/jpeg;base64,${fileData.content.replace(/\s/g, '')}`;
          this.imageCache.set(filePath, b64Url);
          return b64Url;
        } else if (fileData.download_url) {
          const imgRes = await fetch(fileData.download_url, {
            headers: { Authorization: `token ${settings.githubToken}` },
          });
          if (imgRes.ok) {
            const blob = await imgRes.blob();
            const objectUrl = URL.createObjectURL(blob);
            this.imageCache.set(filePath, objectUrl);
            return objectUrl;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch raw image', e);
    }
    return '';
  }
}

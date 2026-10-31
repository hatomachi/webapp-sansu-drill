import { QuestionItem, UserSettings, QuestionStatus } from '../types';

const STORAGE_KEY_QUESTIONS = 'sansu_drill_questions_v1';
const STORAGE_KEY_SETTINGS = 'sansu_drill_settings_v1';

export const INITIAL_MOCK_QUESTIONS: QuestionItem[] = [
  {
    id: 'q_demo_001',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    next_review_date: new Date().toISOString().split('T')[0],
    status: 'day2_boss',
    category: 'たし算とひき算（ちがいに目をつける）',
    monster_name: 'どんぐりリス男爵',
    monster_icon: '🐿️',
    problem_text: `<ruby>赤<rt>あか</rt></ruby>いどんぐりが 24<ruby>個<rt>こ</rt></ruby>、<ruby>青<rt>あお</rt></ruby>いどんぐりが 18<ruby>個<rt>こ</rt></ruby> あります。<br/><ruby>赤<rt>あか</rt></ruby>いどんぐりは、<ruby>青<rt>あお</rt></ruby>いどんぐりより <ruby>何個<rt>なんこ</rt></ruby> <ruby>多<rt>おお</rt></ruby>いですか。`,
    problem_plain_text: '赤いどんぐりが24個、青いどんぐりが18個あります。赤いどんぐりは、青いどんぐりより何個多いですか。',
    formula: '24 - 18 = 6',
    answer: '6個',
    explanation: '「どちらが何個多いか」を求めるときは、大きい数から小さい数をひくひき算になります。',
    parent_hint: '「どちらが多いかな？」「何個多いか比べるにはひき算だね」と声かけ。紙に24と18の長さの違い（線分図）をサラッと描かせてあげると直感が掴めます。',
    needs_regeneration: false,
    feedback_history: [],
    consecutive_correct: 1,
    history: [
      {
        date: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0],
        result: 'correct',
        stage: 'day1_ready',
      },
    ],
  },
  {
    id: 'q_demo_002',
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    next_review_date: new Date().toISOString().split('T')[0],
    status: 'weekend_boss',
    category: 'たし算の逆算（はじめの数を求める）',
    monster_name: 'ふしぎのクッキー魔女',
    monster_icon: '🧙‍♀️',
    problem_text: `かごの <ruby>中<rt>なか</rt></ruby>に クッキーが <ruby>何枚<rt>なんまい</rt></ruby>か ありました。<br/>あとから 15<ruby>枚<rt>まい</rt></ruby> やいたら、ぜんぶで 32<ruby>枚<rt>まい</rt></ruby>に なりました。<br/>はじめに クッキーは <ruby>何枚<rt>なんまい</rt></ruby> ありましたか。`,
    problem_plain_text: 'かごの中にクッキーが何枚かありました。あとから15枚やいたら、ぜんぶで32枚になりました。はじめにクッキーは何枚ありましたか。',
    formula: '32 - 15 = 17',
    answer: '17枚',
    explanation: '「はじめの数 ＋ 15 ＝ 32」なので、はじめの数はぜんぶの32枚からあとからやいた15枚をひけば求まります。',
    parent_hint: '子どもは「やいた＝ふえた」で思わず足し算しがちです！「ぜんぶで32枚から、新しくやいた15枚をのけたら、最初のが残るよね」と指で隠してイメージさせるとスッと納得します。',
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
        stage: 'day1_ready',
      },
      {
        date: new Date(Date.now() - 48 * 3600 * 1000).toISOString().split('T')[0],
        result: 'correct',
        stage: 'day2_boss',
      },
    ],
  },
  {
    id: 'q_demo_003',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    next_review_date: new Date().toISOString().split('T')[0],
    status: 'day1_ready',
    category: '水のかさ（LとdLの計算）',
    monster_name: 'アクアゴーレム',
    monster_icon: '💧',
    problem_text: `水そうに 水が 2L 4dL はいっています。<br/>そこに 3dL の 水を くわえました。<br/>水は ぜんぶで <ruby>何<rt>なん</rt></ruby>L <ruby>何<rt>なん</rt></ruby>dL に なりましたか。`,
    problem_plain_text: '水そうに水が2L 4dL入っています。そこに3dLの水をくわえました。水はぜんぶで何L何dLになりましたか。',
    formula: '4dL + 3dL = 7dL ➡ 2L 7dL',
    answer: '2L 7dL',
    explanation: 'dLどうしをたし算します。4dL ＋ 3dL ＝ 7dL。Lはそのまま2Lなので、2L 7dLになります。',
    parent_hint: 'LとdLをごちゃ混ぜに足さないように、「dLのお部屋どうしを足そうね」と声をかけてあげてください。',
    needs_regeneration: false,
    feedback_history: [],
    consecutive_correct: 0,
    history: [],
  },
];

export const DEFAULT_SETTINGS: UserSettings = {
  githubToken: '',
  githubOwner: 'hatomachi',
  githubRepo: 'webapp-sansu-drill',
  githubBranch: 'main',
  isDemoMode: true,
};

export class StorageService {
  static getSettings(): UserSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
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

  // GitHub から questions.json を fetch してマージ
  static async syncWithGitHub(): Promise<{ success: boolean; message: string; data?: QuestionItem[] }> {
    const settings = this.getSettings();
    if (!settings.githubToken || settings.isDemoMode) {
      return { success: true, message: 'ローカルデモモードで動作中', data: this.getLocalQuestions() };
    }

    try {
      const url = `https://api.github.com/repos/${settings.githubOwner}/${settings.githubRepo}/contents/data/questions.json?ref=${settings.githubBranch}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `token ${settings.githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (res.status === 404) {
        // まだリモートに questions.json がない場合は、現在のローカルデータをコミットして初期化
        await this.commitQuestionsToGitHub(this.getLocalQuestions(), 'chore: initialize questions.json');
        return { success: true, message: 'GitHubに初期データを作成しました', data: this.getLocalQuestions() };
      }

      if (!res.ok) {
        throw new Error(`GitHub APIエラー: ${res.status} ${res.statusText}`);
      }

      const fileData = await res.json();
      const content = decodeURIComponent(
        escape(atob(fileData.content.replace(/\s/g, '')))
      );
      const remoteQuestions: QuestionItem[] = JSON.parse(content);

      // ローカル保存
      this.saveLocalQuestions(remoteQuestions);
      return { success: true, message: 'GitHubと同期しました', data: remoteQuestions };
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
      const url = `https://api.github.com/repos/${settings.githubOwner}/${settings.githubRepo}/contents/data/questions.json`;
      
      // 既存ファイルの SHA を取得
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
    const filePath = `data/raw/${fileName}`;

    const newQuestion: QuestionItem = {
      id,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      next_review_date: now.toISOString().split('T')[0],
      status: 'inbox',
      raw_image_path: filePath,
      raw_image_base64: `data:image/jpeg;base64,${base64Raw}`,
      memo: memo || '',
      category: '未解析（AI解析中）',
      monster_name: 'タマゴモンスター',
      monster_icon: '🥚',
      problem_text: '親が撮影した問題をAIが解析中です...<br/>（Macの常駐スクリプトまたは類題生成をお待ちください）',
      problem_plain_text: '親が撮影した問題をAIが解析中です...',
      formula: '',
      answer: '',
      explanation: 'Macスクリプトが新着画像を検知すると、小2向けの綺麗な数字で類題・解答・親向け解説を自動生成します。',
      parent_hint: '撮影完了！しばらくすると類題がカードになります。',
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

    // ローカル問題一覧に追加
    const questions = this.getLocalQuestions();
    const updated = [newQuestion, ...questions];
    await this.commitQuestionsToGitHub(updated, `feat(question): register new captured question ${id}`);

    return {
      success: true,
      filePath,
      questionItem: newQuestion,
    };
  }

  // ○×判定によるステータス遷移（ライトナー間隔反復）
  static handleAnswerResult(question: QuestionItem, result: 'correct' | 'wrong'): QuestionItem {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    let nextStatus: QuestionStatus = question.status;
    let nextReviewDate = todayStr;

    if (result === 'correct') {
      if (question.status === 'day1_ready' || question.status === 'inbox') {
        // Day1 クリア ➡ 翌日ボス戦へ
        nextStatus = 'day2_boss';
        const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
        nextReviewDate = tomorrow.toISOString().split('T')[0];
      } else if (question.status === 'day2_boss') {
        // Day2 翌日ボス戦クリア ➡ 週末ボス復活戦へ（銀メダル確定）
        nextStatus = 'weekend_boss';
        // 次の土曜または日曜（約3〜5日後）
        const daysUntilWeekend = Math.max(2, (6 - now.getDay() + 7) % 7 || 7);
        const weekend = new Date(now.getTime() + daysUntilWeekend * 24 * 3600 * 1000);
        nextReviewDate = weekend.toISOString().split('T')[0];
      } else if (question.status === 'weekend_boss') {
        // 週末ボス戦クリア ➡ 殿堂入り（金キラキラ完全制覇！）
        nextStatus = 'mastered';
        nextReviewDate = '';
      }
    } else {
      // 間違えた（×）場合
      if (question.status === 'day2_boss') {
        // 翌日ボスで苦戦 ➡ Day1に戻して翌日再挑戦
        nextStatus = 'day1_ready';
        const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
        nextReviewDate = tomorrow.toISOString().split('T')[0];
      } else if (question.status === 'weekend_boss') {
        // 週末ボスで苦戦 ➡ 銀メダルキープで来週リベンジ（またはDay2降格）
        nextStatus = 'day2_boss';
        const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
        nextReviewDate = tomorrow.toISOString().split('T')[0];
      } else {
        // 据え置き
        nextStatus = 'day1_ready';
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
          stage: question.status,
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
}

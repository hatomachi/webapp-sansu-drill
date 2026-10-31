#!/usr/bin/env python3
"""
Sansu Drill - Mac常駐 AI監視＆類題生成スクリプト
1. 定期的に git pull を実行
2. 新着撮影画像（status: inbox）または親のツッコミ（needs_regeneration: True）を検出
3. Gemini API で画像解析 & 小2向け類題・解答・親向け指導ヒントを生成
4. data/questions.json を更新し、git commit & push
"""

import os
import sys
import json
import subprocess
import time
from datetime import datetime
from pathlib import Path

# リポジトリルートの検出
REPO_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_DIR / "data"
QUESTIONS_FILE = DATA_DIR / "questions.json"
RAW_DIR = DATA_DIR / "raw"

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

SYSTEM_INSTRUCTION = """
あなたは小学校2年生向けの算数学習専門のベテラン教師兼AIです。
親が撮影した「娘が間違えた算数の文章題やドリル」の画像、および親のフィードバック（ツッコミ）を受け取り、
娘がもう一度紙と鉛筆で解くための【最高の類題（1問）】と【親向けの丸つけ・指導ヒント】を生成してください。

【厳格な教育的ガイドライン】
1. ターゲット学年: 小学2年生
   - 漢字にはすべて `<ruby>漢字<rt>かんじ</rt></ruby>` 形式でルビを振ってください（小学1・2年配当以外の漢字は避けるか必ずルビ）。
   - 文章は簡潔で情景が思い浮かぶ自然な日本語にしてください。
2. 綺麗な数字と適切な難易度:
   - 小2の手書き・筆算で解ける綺麗な自然数にしてください（答えが分数、小数、マイナス、極端に大きな数になるのは厳禁）。
   - 単なる数字の丸写しではなく、登場人物やアイテム（どんぐり、折り紙、クッキー、シール、水そう等）を楽しくアレンジしてください。
3. 親のツッコミ（最優先）:
   - 親のコメントやタグ（例:「線分図を描かせる意図」「問題タイプが違う」「逆算にして」等）がある場合、その意図を最優先で反映してください。
4. 親向け指導ヒント:
   - 親が赤ペンで丸つけする際、どう声をかければ子どもの「あ、そうか！」を引き出せるか（線分図の描き方、指で隠すコツなど）を具体的に1〜2文で記述してください。

【出力フォーマット】
必ず以下のキーを持つJSONオブジェクトのみを出力してください（Markdownコードブロックは含めないでください）:
{
  "category": "単元名（例: たし算とひき算の文章題）",
  "monster_name": "親しみやすいモンスター名（例: ふしぎのクッキー魔女）",
  "monster_icon": "モンスターを表す絵文字（例: 🧙‍♀️, 🐉, 💧, 🐿️）",
  "problem_text": "ルビ付きHTML（例: <ruby>赤<rt>あか</rt></ruby>い りんごが...）",
  "problem_plain_text": "ルビなしプレーンテキスト",
  "formula": "立式（例: 32 - 15 = 17）",
  "answer": "答え（例: 17こ）",
  "explanation": "計算の手順や解説",
  "parent_hint": "親の声かけ・線分図等の指導ヒント"
}
"""


def run_cmd(cmd, cwd=REPO_DIR):
    """シェルコマンドを実行"""
    try:
        res = subprocess.run(
            cmd,
            cwd=cwd,
            shell=True,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        return res.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Command failed: {cmd}\nstderr: {e.stderr}", file=sys.stderr)
        return None


def git_pull():
    """リモートの最新コミットを取り込む"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] git pull origin main...")
    return run_cmd("git pull --rebase origin main")


def git_push():
    """更新結果をコミットしてプッシュ"""
    run_cmd("git add data/questions.json")
    msg = f"feat(ai): auto generate similar problems [{datetime.now().strftime('%Y-%m-%d %H:%M')}]"
    run_cmd(f'git commit -m "{msg}"')
    run_cmd("git push origin main")
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Pushed to origin main.")


def call_gemini(image_path: Path, feedback_history: list = None):
    """Google GenAI SDK または REST API を呼び出して類題を生成"""
    api_key = GEMINI_API_KEY or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("[WARN] GEMINI_API_KEY is not set. Generating mock fallback.")
        return generate_mock_fallback(image_path, feedback_history)

    try:
        from google import genai
        from google.genai import types
        from PIL import Image

        client = genai.Client(api_key=api_key)

        prompt_parts = []
        if feedback_history:
            recent_feedback = "\n".join(
                [f"- {fb.get('comment')} (tags: {fb.get('quick_tags', [])})" for fb in feedback_history]
            )
            user_prompt = f"以下の画像の問題をもとに、親からの要望・ツッコミを反映した小2向け類題を生成してください。\n\n【親のツッコミ・こだわり】\n{recent_feedback}"
        else:
            user_prompt = "この画像に写っている間違えた問題の構造を解析し、小学2年生向けの良質な類題（数字・文章アレンジ）と親向け解説を生成してください。"

        prompt_parts.append(user_prompt)

        if image_path.exists():
            img = Image.open(image_path)
            prompt_parts.append(img)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt_parts,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                temperature=0.3,
            ),
        )

        return json.loads(response.text)

    except Exception as e:
        print(f"[ERROR] Failed to call Gemini API: {e}", file=sys.stderr)
        return generate_mock_fallback(image_path, feedback_history)


def generate_mock_fallback(image_path: Path, feedback_history: list = None):
    """API未設定時などのローカルフォールバック生成"""
    return {
        "category": "文章題（たし算・ひき算の発展）",
        "monster_name": "ひらめきフクロウ伯爵",
        "monster_icon": "🦉",
        "problem_text": "<ruby>箱<rt>はこ</rt></ruby>の <ruby>中<rt>なか</rt></ruby>に キャラメルが <ruby>何個<rt>なんこ</rt></ruby>か あります。<br/>ともだちに 8<ruby>個<rt>こ</rt></ruby> あげたら、のこりが 14<ruby>個<rt>こ</rt></ruby>に なりました。<br/>はじめに キャラメルは <ruby>何個<rt>なんこ</rt></ruby> ありましたか。",
        "problem_plain_text": "箱の中にキャラメルが何個かあります。ともだちに8個あげたら、のこりが14個になりました。はじめにキャラメルは何個ありましたか。",
        "formula": "14 + 8 = 22",
        "answer": "22個",
        "explanation": "「あげた分」と「のこり」を合わせると、はじめの数になります。逆算のたし算です。",
        "parent_hint": "「あげた8個を箱に戻したら、最初の数になるよね」と逆再生のイメージで声かけしてあげてください。",
    }


def process_queue():
    """questions.json をチェックして未処理または再生成要求のものを処理"""
    if not QUESTIONS_FILE.exists():
        print(f"[WARN] {QUESTIONS_FILE} does not exist.")
        return

    with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
        questions = json.load(f)

    updated_any = False

    for item in questions:
        needs_work = False
        if item.get("status") == "inbox":
            needs_work = True
        elif item.get("needs_regeneration"):
            needs_work = True

        if not needs_work:
            continue

        print(f"[INFO] Processing question {item['id']}...")
        raw_path_str = item.get("raw_image_path", "")
        img_path = REPO_DIR / raw_path_str

        # Gemini呼び出し
        ai_result = call_gemini(img_path, item.get("feedback_history", []))

        # 結果をマージ
        item["category"] = ai_result.get("category", item.get("category"))
        item["monster_name"] = ai_result.get("monster_name", item.get("monster_name"))
        item["monster_icon"] = ai_result.get("monster_icon", item.get("monster_icon", "👾"))
        item["problem_text"] = ai_result.get("problem_text", item.get("problem_text"))
        item["problem_plain_text"] = ai_result.get("problem_plain_text", item.get("problem_plain_text"))
        item["formula"] = ai_result.get("formula", "")
        item["answer"] = ai_result.get("answer", "")
        item["explanation"] = ai_result.get("explanation", "")
        item["parent_hint"] = ai_result.get("parent_hint", "")

        item["status"] = "day1_ready"  # Day1挑戦待ちに昇格
        item["needs_regeneration"] = False
        item["updated_at"] = datetime.utcnow().isoformat() + "Z"

        updated_any = True
        print(f"[SUCCESS] Updated {item['id']}: {item['monster_name']}")

    if updated_any:
        with open(QUESTIONS_FILE, "w", encoding="utf-8") as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        print(f"[INFO] Saved {QUESTIONS_FILE}")
        try:
            git_push()
        except Exception as e:
            print(f"[WARN] Could not push to git: {e}")


def main():
    print("=== Sansu Drill AI Monitor Started ===")
    print(f"Repository Root: {REPO_DIR}")

    # コマンドライン引数に --once があれば1度だけ実行
    if "--once" in sys.argv:
        try:
            git_pull()
        except Exception:
            pass
        process_queue()
        return

    # 通常ループ（60秒おき）
    while True:
        try:
            git_pull()
            process_queue()
        except Exception as e:
            print(f"[ERROR] Loop error: {e}", file=sys.stderr)
        time.sleep(60)


if __name__ == "__main__":
    main()

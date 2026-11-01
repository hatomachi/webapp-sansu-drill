#!/usr/bin/env python3
"""
Sansu Drill - Mac常駐 agy 監視＆類題生成スクリプト (family-vault 連携版)
1. Outbound (git pull) で family-vault/30_Kids/SansuDrill の新着画像や親ツッコミを検知
2. Mac上の agy CLI (/Users/s-ikari/.local/bin/agy) を非対話実行 (-p)
3. 画像解析 ＆ family-vault内の子どもプロフィール情報 ＆ 小2算数プロンプトで類題・解答・指導ヒントをJSON生成
4. 30_Kids/SansuDrill/questions.json を更新し、family-vault へ git commit & push
"""

import os
import sys
import json
import subprocess
import time
import re
import logging
from datetime import datetime, timezone
from pathlib import Path

# ロガー設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("sansu_drill.family_vault_crawler")

# パス定義
FAMILY_VAULT_DIR = Path(os.environ.get("FAMILY_VAULT_PATH", "/Users/s-ikari/work/family-vault"))
DATA_DIR = FAMILY_VAULT_DIR / "30_Kids" / "SansuDrill"
QUESTIONS_FILE = DATA_DIR / "questions.json"
RAW_DIR = DATA_DIR / "raw"
CHILD_PROFILE_FILE = FAMILY_VAULT_DIR / "30_Kids" / "プロフィール_子ども.md"

AGY_BIN = Path(os.environ.get("AGY_BIN_PATH", "/Users/s-ikari/.local/bin/agy"))

ANSI_ESCAPE = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')

def strip_ansi(text: str) -> str:
    return ANSI_ESCAPE.sub('', text)

def clean_json_output(raw_output: str) -> str:
    cleaned = strip_ansi(raw_output).strip()
    # Markdown コードブロック (```json ... ```) の除去
    lines = cleaned.splitlines()
    if len(lines) >= 2:
        if lines[0].strip().startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    return cleaned

def run_cmd(cmd: str, cwd: Path = FAMILY_VAULT_DIR) -> str:
    res = subprocess.run(
        cmd,
        cwd=cwd,
        shell=True,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    return res.stdout.strip()

def git_pull() -> bool:
    logger.info(f"Executing git pull in {FAMILY_VAULT_DIR}...")
    try:
        run_cmd("git pull --rebase origin main", cwd=FAMILY_VAULT_DIR)
        return True
    except subprocess.CalledProcessError as e:
        logger.warning(f"git pull warning/error: {e.stderr.strip()}")
        return False

def git_commit_and_push(question_id: str, monster_name: str, max_retries: int = 3):
    logger.info(f"Committing and pushing updates to family-vault for {question_id}...")
    rel_path = "30_Kids/SansuDrill/questions.json"
    run_cmd(f"git add {rel_path}", cwd=FAMILY_VAULT_DIR)
    commit_msg = f"feat(kids): update SansuDrill problem {question_id} ({monster_name}) via agy"
    run_cmd(f'git commit -m "{commit_msg}"', cwd=FAMILY_VAULT_DIR)

    for attempt in range(max_retries):
        try:
            run_cmd("git push origin main", cwd=FAMILY_VAULT_DIR)
            logger.info("Successfully pushed updates to family-vault.")
            return
        except subprocess.CalledProcessError as e:
            logger.warning(f"git push failed (attempt {attempt + 1}/{max_retries}): {e.stderr.strip()}")
            if attempt < max_retries - 1:
                logger.info("Re-pulling with rebase before retrying push...")
                run_cmd("git pull --rebase origin main", cwd=FAMILY_VAULT_DIR)
                time.sleep(2)
            else:
                raise

def load_child_context() -> str:
    if CHILD_PROFILE_FILE.exists():
        try:
            content = CHILD_PROFILE_FILE.read_text(encoding="utf-8")
            # 冒頭部分をコンテキストとして抽出
            return f"\n【参考：娘（小2）のプロフィール・興味関心】\n{content[:1000]}\n"
        except Exception:
            pass
    return ""

def build_agy_prompt(item: dict, image_abs_path: Path) -> str:
    feedback_history = item.get("feedback_history", [])
    feedback_section = ""
    if feedback_history:
        recent = "\n".join([f"- {fb.get('comment')} (タグ: {fb.get('quick_tags', [])})" for fb in feedback_history])
        feedback_section = f"""
【🚨 親からの超重要フィードバック・ツッコミ（最優先反映事項）】
{recent}
※ 親の意図（線分図を描かせる、引き算・逆算にする、言葉遣い、難易度など）を100%最優先して問題を再構成してください。
"""

    child_context = load_child_context()

    prompt = f"""
あなたは小学校2年生向けの算数学習専門のベテラン教師AIです。
親がドリルやテストで間違えた算数の文章題をカメラで撮影しました。

画像ファイルパス: {image_abs_path}
（read_file ツール等で上記の画像を確認し、問題の単元・出題意図・子どもがつまずいた構造を正確に読み取ってください）

{child_context}
{feedback_section}

娘（小2）が紙のノートと鉛筆で解くための【最高の類題（3問セット）】と【親向けの丸つけ・指導ヒント】を生成してください。
（※ ライトナー復習システムにより、1回目クリアでオパール、2回目でサファイア、3回目でダイヤモンドを獲得します。解き直すたびに答えを丸暗記しないよう、同等難易度の数字替え・シチュエーション替え類題を3問用意します）

【厳格な教育的ガイドライン】
1. 3段階類題（バリアント）の設計:
   - 娘がつまずいた本質的な計算構造・立式手順（例: くり下がり筆算、逆算、時計の逆算等）は完全に同一にしてください。
   - 難易度は3問とも完全に同等（レベルを無理に上げる必要はありません）。
   - 数字、登場人物、アイテム、物語のシチュエーション（動物、お菓子、文房具、水族館、公園など）を変えて、毎回新鮮な気持ちで挑戦できるようにしてください。
2. ターゲット学年: 小学2年生
   - 漢字にはすべて `<ruby>漢字<rt>かんじ</rt></ruby>` 形式でルビを振ってください（例: `<ruby>赤<rt>あか</rt></ruby>い りんご`）。
   - 小2が情景を思い浮かべられる自然な日本語・ストーリーにしてください。
3. 綺麗な数字と適切な難易度:
   - 小2の手書き・筆算で解ける綺麗な自然数にしてください（答えが分数、小数、マイナス、不自然に巨大になるのは厳禁）。
   - 虫食い算や筆算の場合は、くり上がり・くり下がりの回数や位の位置関係を原問題と一致させてください。
4. 親向け指導ヒント:
   - 親が赤ペンで丸つけする際、どう声をかければ子どもの「あ、そうか！」を引き出せるか（線分図の描き方、指で隠すコツなど）を具体的に1〜2文で記述してください。
5. 算数リッチ表現（自己完結型HTML / Tailwind CSS / インラインSVG）:
   iPadの画面（Tailwind CSS導入済み）で美しく分かりやすく表示されるよう、問題形式に応じてHTMLタグ、Tailwindクラス、インラインSVGを自由に活用してください。外部CSSに頼らず、HTML内で自己完結させてください。
   - 【虫食いマス目（□や穴埋め）】:
     文字の `[ ]` や `□` ではなく、四角いマス目として表示してください。
     例: `<span class="inline-flex items-center justify-center w-8 h-8 mx-1 border-2 border-slate-400 rounded-md bg-slate-50 font-bold text-blue-600 align-middle">ア</span>` （ラベル不要なら空文字のspan）
   - 【筆算（たし算・ひき算・かけ算・虫食い筆算）】:
     全角スペースで並べるとフォントで位がずれるため、等幅フォント（`font-mono`）とテーブル（`<table>`）で位（百・十・一）をピタリと揃えてください。計算記号（`＋`, `－`, `×`）と計算線（`border-b-2 border-slate-800`）を用いて、ノートに写しやすい縦書き筆算を美しく中央配置してください。
     例:
     ```html
     <div class="my-4 flex justify-center">
       <table class="font-mono text-2xl border-collapse text-right">
         <tbody>
           <tr>
             <td class="w-8"></td>
             <td class="w-8">1</td>
             <td class="w-8"><span class="inline-flex items-center justify-center w-8 h-8 border-2 border-slate-400 rounded bg-slate-50 font-bold text-blue-600">ア</span></td>
             <td class="w-8">2</td>
           </tr>
           <tr class="border-b-2 border-slate-800">
             <td class="w-8 text-center">－</td>
             <td class="w-8"></td>
             <td class="w-8">6</td>
             <td class="w-8"><span class="inline-flex items-center justify-center w-8 h-8 border-2 border-slate-400 rounded bg-slate-50 font-bold text-blue-600">イ</span></td>
           </tr>
           <tr>
             <td class="w-8"></td>
             <td class="w-8"></td>
             <td class="w-8">3</td>
             <td class="w-8">5</td>
           </tr>
         </tbody>
       </table>
     </div>
     ```
   - 【線分図・数直線・テープ図】:
     `<svg viewBox="0 0 320 60" class="w-full max-w-sm mx-auto my-3">` などを用いて、長方形や線分、矢印、数値をベクター描画してください。
   - 【時計の文字盤】:
     `<svg viewBox="0 0 100 100" class="w-28 h-28 mx-auto my-2">` などを用いて円、目盛り、長針・短針をインラインSVGで描画してください。
   - 【表・グラフ】:
     標準的な `<table>` タグに Tailwind クラス（`border border-slate-300`, `bg-slate-50` 等）をつけて描画してください。

【出力フォーマット】
以下のキーを持つ純粋なJSONオブジェクトのみを出力してください（解説文やMarkdown装飾は含めず、JSONテキストのみを出力してください）。
variants には、同等難易度で数字やシチュエーションを変えた類題を【必ず3問】含めてください:
{{
  "category": "単元名（例: たし算とひき算の文章題、たし算の逆算など）",
  "monster_name": "問題の題名・モチーフ（例: どんぐりのくらべっこ、ふしぎなクッキー、水そうのかさ）",
  "monster_icon": "題材を表す可愛い絵文字1文字（例: 🍪, 🐿️, 💧, 🎈, 🐟）",
  "variants": [
    {{
      "problem_text": "【問1（オパール用）】ルビ付きHTML（例: <ruby>赤<rt>あか</rt></ruby>い どんぐりが 24<ruby>個<rt>こ</rt></ruby>...）",
      "problem_plain_text": "問1のルビなしプレーンテキスト",
      "formula": "問1の立式（例: 24 - 18 = 6）",
      "answer": "問1の答え（例: 6個）",
      "explanation": "問1の計算手順や解説",
      "parent_hint": "問1の親の声かけ・線分図等の指導ヒント"
    }},
    {{
      "problem_text": "【問2（サファイア用・数字替え）】ルビ付きHTML（例: <ruby>青<rt>あお</rt></ruby>い シールが 35<ruby>枚<rt>まい</rt></ruby>...）",
      "problem_plain_text": "問2のルビなしプレーンテキスト",
      "formula": "問2の立式（例: 35 - 19 = 16）",
      "answer": "問2の答え（例: 16枚）",
      "explanation": "問2の計算手順や解説",
      "parent_hint": "問2の親の声かけ・指導ヒント"
    }},
    {{
      "problem_text": "【問3（ダイヤ用・数字替え）】ルビ付きHTML（例: クッキーが 42<ruby>個<rt>こ</rt></ruby>...）",
      "problem_plain_text": "問3のルビなしプレーンテキスト",
      "formula": "問3の立式（例: 42 - 27 = 15）",
      "answer": "問3の答え（例: 15個）",
      "explanation": "問3の計算手順や解説",
      "parent_hint": "問3の親の声かけ・指導ヒント"
    }}
  ]
}}
"""
    return prompt.strip()

def run_agy_generate(prompt: str, timeout_sec: int = 300) -> dict:
    if not AGY_BIN.exists():
        raise FileNotFoundError(f"agy binary not found at: {AGY_BIN}")

    cmd = [
        str(AGY_BIN),
        "-p",
        prompt,
        "--dangerously-skip-permissions"
    ]

    logger.info("Executing agy CLI...")
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=timeout_sec,
        check=False
    )

    if result.returncode != 0:
        logger.error(f"agy failed with code {result.returncode}: {result.stderr.strip()}")
        raise RuntimeError(f"agy execution failed: {result.stderr.strip()}")

    cleaned = clean_json_output(result.stdout)
    json_match = re.search(r'(\{[\s\S]*\})', cleaned)
    if json_match:
        json_str = json_match.group(1)
        return json.loads(json_str)
    
    return json.loads(cleaned)

def process_queue() -> int:
    processed_count = 0

    while True:
        if not QUESTIONS_FILE.exists():
            logger.warning(f"{QUESTIONS_FILE} does not exist.")
            break

        with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
            questions = json.load(f)

        target_item = None
        for item in questions:
            if item.get("status") == "inbox" or item.get("needs_regeneration"):
                target_item = item
                break

        if not target_item:
            # 未処理アイテムがなくなったためループ終了
            break

        q_id = target_item.get("id")
        logger.info(f"Target detected: {q_id} (status: {target_item.get('status')}, needs_regeneration: {target_item.get('needs_regeneration')})")

        raw_rel_path = target_item.get("raw_image_path", "")
        if raw_rel_path.startswith("30_Kids/SansuDrill/"):
            img_abs_path = FAMILY_VAULT_DIR / raw_rel_path
        else:
            img_abs_path = DATA_DIR / raw_rel_path

        try:
            prompt = build_agy_prompt(target_item, img_abs_path)
            ai_data = run_agy_generate(prompt)

            # 【重要】AI生成完了後、推論中（約40秒間）にリモートに届いた新着問題・画像を取り込む
            git_pull()

            # 最新の questions.json を再読み込みしてピンポイント更新（他の新着問題を消去しないため）
            with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
                latest_questions = json.load(f)

            found = False
            for item in latest_questions:
                if item.get("id") == q_id:
                    item["category"] = ai_data.get("category", item.get("category"))
                    item["monster_name"] = ai_data.get("monster_name", item.get("monster_name"))
                    item["monster_icon"] = ai_data.get("monster_icon", item.get("monster_icon", "👾"))

                    # 3段階類題（バリアント）の格納
                    raw_variants = ai_data.get("variants")
                    if isinstance(raw_variants, list) and len(raw_variants) > 0:
                        variants = raw_variants
                    else:
                        # 単一形式で返ってきた場合の互換変換
                        variants = [{
                            "problem_text": ai_data.get("problem_text", item.get("problem_text", "")),
                            "problem_plain_text": ai_data.get("problem_plain_text", item.get("problem_plain_text", "")),
                            "formula": ai_data.get("formula", ""),
                            "answer": ai_data.get("answer", ""),
                            "explanation": ai_data.get("explanation", ""),
                            "parent_hint": ai_data.get("parent_hint", "")
                        }]
                    item["variants"] = variants

                    # トップレベルの重複フィールドをクリーンアップ（variantsへ一本化）
                    for field in ["problem_text", "problem_plain_text", "formula", "answer", "explanation", "parent_hint"]:
                        item.pop(field, None)

                    item["status"] = "stage1"  # ステージ1（初回確認待ち）に昇格
                    item["needs_regeneration"] = False
                    item["updated_at"] = datetime.now(timezone.utc).isoformat()
                    item.pop("raw_image_base64", None)
                    found = True
                    break

            if not found:
                logger.warning(f"Target item {q_id} not found in latest questions.json after pull. Skipping.")
                break

            logger.info(f"Generated successfully: {ai_data.get('monster_name')} ({ai_data.get('category')})")

            # questions.json 保存
            with open(QUESTIONS_FILE, "w", encoding="utf-8") as f:
                json.dump(latest_questions, f, ensure_ascii=False, indent=2)

            git_commit_and_push(q_id, ai_data.get("monster_name", "あたらしい問題"))
            processed_count += 1

        except Exception as e:
            logger.error(f"Failed to process {q_id}: {e}", exc_info=True)
            # エラー発生時は無限ループを避けるため一度中断し、次回の定期ポーリングに委ねる
            break

    return processed_count

def main():
    logger.info("=== Sansu Drill agy Crawler Starting (family-vault integration) ===")
    logger.info(f"Family Vault root: {FAMILY_VAULT_DIR}")
    logger.info(f"Data Dir: {DATA_DIR}")
    logger.info(f"AGY binary: {AGY_BIN}")

    if "--once" in sys.argv:
        logger.info("Executing single cycle (--once)...")
        git_pull()
        count = process_queue()
        logger.info(f"Single cycle finished. Processed {count} items.")
        return

    # 常駐ループ (60秒間隔)
    logger.info("Starting daemon loop (polling every 60s)...")
    while True:
        try:
            git_pull()
            process_queue()
        except Exception as e:
            logger.error(f"Unexpected error in loop: {e}", exc_info=True)
        time.sleep(60)

if __name__ == "__main__":
    main()

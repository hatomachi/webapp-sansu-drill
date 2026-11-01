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

def git_pull():
    logger.info(f"Executing git pull in {FAMILY_VAULT_DIR}...")
    try:
        run_cmd("git pull --rebase origin main", cwd=FAMILY_VAULT_DIR)
    except subprocess.CalledProcessError as e:
        logger.warning(f"git pull warning/error: {e.stderr.strip()}")

def git_commit_and_push(question_id: str, monster_name: str):
    logger.info(f"Committing and pushing updates to family-vault for {question_id}...")
    rel_path = "30_Kids/SansuDrill/questions.json"
    run_cmd(f"git add {rel_path}", cwd=FAMILY_VAULT_DIR)
    commit_msg = f"feat(kids): update SansuDrill problem {question_id} ({monster_name}) via agy"
    run_cmd(f'git commit -m "{commit_msg}"', cwd=FAMILY_VAULT_DIR)
    run_cmd("git push origin main", cwd=FAMILY_VAULT_DIR)
    logger.info("Successfully pushed updates to family-vault.")

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

娘（小2）が紙のノートと鉛筆で解くための【最高の類題（1問）】と【親向けの丸つけ・指導ヒント】を生成してください。

【厳格な教育的ガイドライン】
1. ターゲット学年: 小学2年生
   - 漢字にはすべて `<ruby>漢字<rt>かんじ</rt></ruby>` 形式でルビを振ってください（例: `<ruby>赤<rt>あか</rt></ruby>い りんご`）。
   - 小2が情景を思い浮かべられる自然な日本語・ストーリーにしてください。
2. 綺麗な数字と適切な難易度:
   - 小2の手書き・筆算で解ける綺麗な自然数にしてください（答えが分数、小数、マイナス、不自然に巨大になるのは厳禁）。
   - 登場人物やアイテム（どんぐり、折り紙、クッキー、シール、水そう、娘が好きな生き物等）を楽しくアレンジしてください。
3. 親向け指導ヒント:
   - 親が赤ペンで丸つけする際、どう声をかければ子どもの「あ、そうか！」を引き出せるか（線分図の描き方、指で隠すコツなど）を具体的に1〜2文で記述してください。

【出力フォーマット】
以下のキーを持つ純粋なJSONオブジェクトのみを出力してください（解説文やMarkdown装飾は含めず、JSONテキストのみを出力してください）:
{{
  "category": "単元名（例: たし算とひき算の文章題、たし算の逆算など）",
  "monster_name": "問題の題名・モチーフ（例: どんぐりのくらべっこ、ふしぎなクッキー、水そうのかさ）",
  "monster_icon": "題材を表す可愛い絵文字1文字（例: 🍪, 🐿️, 💧, 🎈, 🐟）",
  "problem_text": "ルビ付きHTML（例: <ruby>赤<rt>あか</rt></ruby>い どんぐりが 24<ruby>個<rt>こ</rt></ruby>...）",
  "problem_plain_text": "ルビなしプレーンテキスト",
  "formula": "立式（例: 24 - 18 = 6）",
  "answer": "答え（例: 6個）",
  "explanation": "計算の手順や解説",
  "parent_hint": "親の声かけ・線分図等の指導ヒント"
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
    if not QUESTIONS_FILE.exists():
        logger.warning(f"{QUESTIONS_FILE} does not exist.")
        return 0

    with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
        questions = json.load(f)

    processed_count = 0

    for item in questions:
        needs_work = False
        if item.get("status") == "inbox":
            needs_work = True
        elif item.get("needs_regeneration"):
            needs_work = True

        if not needs_work:
            continue

        q_id = item.get("id")
        logger.info(f"Target detected: {q_id} (status: {item.get('status')}, needs_regeneration: {item.get('needs_regeneration')})")

        raw_rel_path = item.get("raw_image_path", "")
        # 相対パス（例: 30_Kids/SansuDrill/raw/xxx.jpg または raw/xxx.jpg）
        if raw_rel_path.startswith("30_Kids/SansuDrill/"):
            img_abs_path = FAMILY_VAULT_DIR / raw_rel_path
        else:
            img_abs_path = DATA_DIR / raw_rel_path

        try:
            prompt = build_agy_prompt(item, img_abs_path)
            ai_data = run_agy_generate(prompt)

            # 結果を反映
            item["category"] = ai_data.get("category", item.get("category"))
            item["monster_name"] = ai_data.get("monster_name", item.get("monster_name"))
            item["monster_icon"] = ai_data.get("monster_icon", item.get("monster_icon", "👾"))
            item["problem_text"] = ai_data.get("problem_text", item.get("problem_text"))
            item["problem_plain_text"] = ai_data.get("problem_plain_text", item.get("problem_plain_text"))
            item["formula"] = ai_data.get("formula", "")
            item["answer"] = ai_data.get("answer", "")
            item["explanation"] = ai_data.get("explanation", "")
            item["parent_hint"] = ai_data.get("parent_hint", "")

            item["status"] = "stage1"  # ステージ1（初回確認待ち）に昇格
            item["needs_regeneration"] = False
            item["updated_at"] = datetime.now(timezone.utc).isoformat()
            item.pop("raw_image_base64", None)  # 1MB上限・肥大化対策のためBase64は除外してrawファイルのみ参照

            logger.info(f"Generated successfully: {item['monster_name']} ({item['category']})")

            # questions.json 保存
            with open(QUESTIONS_FILE, "w", encoding="utf-8") as f:
                json.dump(questions, f, ensure_ascii=False, indent=2)

            git_commit_and_push(q_id, item["monster_name"])
            processed_count += 1

        except Exception as e:
            logger.error(f"Failed to process {q_id}: {e}", exc_info=True)

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

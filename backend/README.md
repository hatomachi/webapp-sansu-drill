# 💻 Sansu Drill - Mac常駐スクリプト

## 概要
iPad/iPhoneのPWAからGitHubへアップロードされた新着画像（`data/raw/`）や親のツッコミ（再生成要求）を検知し、
Gemini API（`gemini-2.5-flash`）を使って小2算数に最適化された類題・解答・親向け指導ヒントを自動生成して `data/questions.json` を更新します。

---

## 🚀 セットアップ ＆ 手動実行

### 1. 依存ライブラリのインストール
```bash
pip install -r backend/requirements.txt
```

### 2. 環境変数の設定
```bash
export GEMINI_API_KEY="your-gemini-api-key"
```

### 3. 単発テスト実行（1回だけチェックして終了）
```bash
python3 backend/sync_and_generate.py --once
```

### 4. 常駐実行（60秒おきに git pull & 監視）
```bash
python3 backend/sync_and_generate.py
```

---

## ⚙️ launchd による自動常駐（Mac起動時に自動実行）

```bash
# plist を LaunchAgents にコピー
cp backend/com.hatomachi.sansu-drill.plist ~/Library/LaunchAgents/

# サービスを登録・起動
launchctl load ~/Library/LaunchAgents/com.hatomachi.sansu-drill.plist

# 停止したい場合
launchctl unload ~/Library/LaunchAgents/com.hatomachi.sansu-drill.plist
```

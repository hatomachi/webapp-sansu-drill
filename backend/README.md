# 💻 Sansu Drill - Mac常駐 agy クローラー

## 概要
`voice-reflection-agent` と同一の自律アーキテクチャを採用：
- iPad/iPhone の PWA から GitHub へアップロードされた新着画像（`data/raw/`）や親のツッコミ（再生成要求）を Outbound（`git pull`）で検知
- Mac ローカルの **`agy` CLI (`/Users/s-ikari/.local/bin/agy`)** を直接実行
- 小2算数専用プロンプトにより、ルビ付き類題・解答・親向け指導ヒントをJSON生成
- `data/questions.json` を更新して GitHub へ自動コミット＆プッシュ（PWAと完全同期）

※ 外部APIキーの管理や追加ライブラリのインストールは一切不要（Python標準ライブラリ＋agy CLIで完結）。

---

## 🚀 実行方法

### 1. 単発テスト実行（1サイクル回して終了）
```bash
./backend/crawler-daemon.sh --once
```

### 2. 手動での常駐実行（60秒間隔でポーリング監視）
```bash
./backend/crawler-daemon.sh
```

---

## ⚙️ launchd による自動常駐（Mac起動時に自動実行）

```bash
# plist を LaunchAgents に配置
cp backend/com.hatomachi.sansu-drill.plist ~/Library/LaunchAgents/

# サービスを起動
launchctl load ~/Library/LaunchAgents/com.hatomachi.sansu-drill.plist

# 状態確認
launchctl list | grep sansu-drill

# 停止したい場合
launchctl unload ~/Library/LaunchAgents/com.hatomachi.sansu-drill.plist
```

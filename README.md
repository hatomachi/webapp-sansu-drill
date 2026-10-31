# 📐 Sansu Drill (webapp-sansu-drill)

> **娘（小2）の算数学習用・間違えた文章題の類題自動生成＆ストックPWA**  
> 🔗 思想連携: `family-vault` ([[30_Kids/家庭学習_漢字勉強テコ入れ作戦|家庭学習_漢字勉強テコ入れ作戦]])  
> 📁 作戦ノート: `personal-vault/10_職人・発明家/webapp-sansu-drill.md`

---

## 🎯 4大コア設計思想

1. **親の準備コストゼロ（撮影5秒）**:
   - 間違えた問題をカメラで撮るだけ。類題生成・解説・スケジュールはすべてAIが全自動化。
2. **実戦主義（紙と鉛筆で解く）**:
   - iPadは「問題提示と丸つけカード」に徹し、画面手書きや入力は作らない。手元のノートと鉛筆で立式・計算。
3. **親の自由入力ツッコミ＆再生成ループ**:
   - 「問題のタイプが違う」「線分図を描かせる意図」「答えが割り切れない」等の親のこだわりをワンタップ＋自由入力でAIに即座にフィードバック。
4. **ライトナー間隔反復（自動仕分けクエスト）**:
   - `Day 1` 初回確認 ➡ `Day 2` 翌日ボス戦（銀メダル） ➡ `週末` ボス復活戦（金キラキラ完全制覇）。

---

## 🏗️ システムアーキテクチャ

```
[ iPad / iPhone (PWA) ]
  ├── 📸 カメラ撮影 ＆ Canvas長辺1600px軽量圧縮
  ├── 📄 大文字・ふりがな付き問題提示カード
  ├── 🔍 親向け解答・指導ヒントアコーディオン
  ├── 💬 親のツッコミ自由入力モーダル
  └── 🏆 ライトナー自動仕分け（制覇マップ）
       ▲
       │ GitHub REST API (PAT)
       ▼
[ GitHub Repository ]
  ├── data/raw/problem_*.jpg  (撮影元画像)
  └── data/questions.json     (問題・討伐ステータス)
       ▲
       │ git pull / git push
       ▼
[ 自宅 Mac 常駐バックエンド (Python / launchd) ]
  ├── 未処理画像 or 親ツッコミ検知
  ├── Gemini 2.5 Flash API (小2専用プロンプト)
  └── 類題・解答・親向け指導ヒントをJSONコミット
```

---

## 🚀 クイックスタート

### 1. フロントエンド（開発サーバー）
```bash
npm install
npm run dev
```

### 2. ビルド（本番用静的アセット出力）
```bash
npm run build
```
Cloudflare Pages 等の静的ホスティングに `dist/` をデプロイするだけで即座にPWAとして利用可能です。

### 3. Mac常駐スクリプト
```bash
pip install -r backend/requirements.txt
export GEMINI_API_KEY="your-api-key"
python3 backend/sync_and_generate.py --once
```

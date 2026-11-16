import React from 'react';
import { Settings, RefreshCw } from 'lucide-react';
import { APP_VERSION } from '../version';

interface HeaderProps {
  onOpenSettings: () => void;
  onSync: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onSync,
  isSyncing,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 pt-safe no-print">
      <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between gap-2">
        {/* 左: ロゴ ＋ バージョン */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
            📐
          </div>
          <h1 className="text-sm font-bold text-slate-900 truncate whitespace-nowrap">
            Sansu Drill
          </h1>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  `現在バージョン: ${APP_VERSION}\n最新版に更新するため再読み込みしますか？`
                )
              ) {
                window.location.reload();
              }
            }}
            className="text-xs font-mono font-semibold px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-200 shrink-0 transition-colors"
            title="タップして最新版へ再読み込み"
          >
            {APP_VERSION}
          </button>
        </div>

        {/* 右: 同期 ＋ 設定のみ */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 active:scale-95 transition-all"
            title="GitHubと同期"
            aria-label="GitHubと同期"
          >
            <RefreshCw
              className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-600' : ''}`}
            />
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 active:scale-95 transition-all"
            title="設定"
            aria-label="設定"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

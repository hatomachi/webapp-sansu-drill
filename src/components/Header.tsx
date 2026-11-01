import React from 'react';
import { Camera, Settings, RefreshCw, UserCheck, Sparkles, Gem } from 'lucide-react';
import { APP_VERSION } from '../version';

interface HeaderProps {
  isParentMode: boolean;
  onToggleParentMode: () => void;
  onOpenCapture: () => void;
  onOpenSettings: () => void;
  onSync: () => void;
  isSyncing: boolean;
  currentView: 'quest' | 'map';
  onViewChange: (view: 'quest' | 'map') => void;
  dueCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isParentMode,
  onToggleParentMode,
  onOpenCapture,
  onOpenSettings,
  onSync,
  isSyncing,
  currentView,
  onViewChange,
  dueCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* 左: ロゴとビュー切り替え */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 text-lg">
            💎
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-800 leading-tight">
                Sansu Drill
              </h1>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`現在バージョン: ${APP_VERSION}\n最新版に更新するため再読み込みしますか？`)) {
                    window.location.reload();
                  }
                }}
                className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-300 transition-colors"
                title="タップして最新版へ再読み込み"
              >
                {APP_VERSION}
              </button>
              {dueCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-600 text-white animate-pulse">
                  本日 {dueCount} 問
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">算数ジュエルクエスト（宝石あつめ）</p>
          </div>
        </div>

        {/* 中央: もんだい / 宝石タブ */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => onViewChange('quest')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
              currentView === 'quest'
                ? 'bg-white text-blue-600 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>もんだい</span>
          </button>
          <button
            onClick={() => onViewChange('map')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
              currentView === 'map'
                ? 'bg-white text-blue-600 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Gem className="w-3.5 h-3.5 text-blue-500" />
            <span>宝石コレクション</span>
          </button>
        </div>

        {/* 右: 操作ボタン群 */}
        <div className="flex items-center space-x-2">
          {/* 親モード切替スイッチ */}
          <button
            onClick={onToggleParentMode}
            title={isParentMode ? '親モード中（解答・ツッコミ・削除ボタン表示）' : '娘モード中'}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              isParentMode
                ? 'bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{isParentMode ? '親モード' : '娘モード'}</span>
          </button>

          {/* 写真撮影ボタン（親用） */}
          <button
            onClick={onOpenCapture}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors active:scale-95"
            title="間違えた問題をカメラで撮る"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">問題撮影</span>
          </button>

          {/* 同期ボタン */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            title="GitHubと同期"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* 設定ボタン */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            title="設定（復習ラベル・GitHub PAT・サンプル削除など）"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { X, Save, Key, Github, RefreshCw, ShieldCheck } from 'lucide-react';
import { UserSettings } from '../types';
import { StorageService, INITIAL_MOCK_QUESTIONS } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  const [settings, setSettings] = useState<UserSettings>(() => StorageService.getSettings());
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(settings);
    setSaveStatus('設定を保存しました');
    setTimeout(() => {
      setSaveStatus(null);
      onSettingsSaved();
      onClose();
    }, 600);
  };

  const handleResetDemoData = () => {
    if (window.confirm('ローカルの問題データを初期デモデータにリセットしますか？')) {
      StorageService.saveLocalQuestions(INITIAL_MOCK_QUESTIONS);
      onSettingsSaved();
      alert('初期デモデータにリセットしました');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-slate-800 text-white rounded-lg">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">アプリ設定 & 同期</h3>
              <p className="text-xs text-slate-500">GitHub API経由で写真・データを同期</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* デモモード切替 */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-900 block">ローカルデモモード</span>
              <span className="text-[11px] text-blue-700">GitHub未設定でも端末内だけで全機能体験可能</span>
            </div>
            <input
              type="checkbox"
              checked={settings.isDemoMode}
              onChange={(e) => setSettings({ ...settings, isDemoMode: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded border-blue-300 focus:ring-blue-500"
            />
          </div>

          {/* GitHub PAT */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
              <Key className="w-3.5 h-3.5 text-slate-500" />
              <span>GitHub Personal Access Token (PAT)</span>
            </label>
            <input
              type="password"
              value={settings.githubToken}
              onChange={(e) => setSettings({ ...settings, githubToken: e.target.value })}
              placeholder="ghp_xxxxxxxxxxxx"
              className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              ※ repo 権限（contents:write）を持つトークンを入力（ブラウザ内にのみ保存されます）
            </p>
          </div>

          {/* リポジトリ設定 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Owner / ユーザー名</label>
              <input
                type="text"
                value={settings.githubOwner}
                onChange={(e) => setSettings({ ...settings, githubOwner: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">リポジトリ名</label>
              <input
                type="text"
                value={settings.githubRepo}
                onChange={(e) => setSettings({ ...settings, githubRepo: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ブランチ</label>
              <input
                type="text"
                value={settings.githubBranch}
                onChange={(e) => setSettings({ ...settings, githubBranch: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">保存先パス (Vault内)</label>
              <input
                type="text"
                value={settings.dataPathPrefix || '30_Kids/SansuDrill'}
                onChange={(e) => setSettings({ ...settings, dataPathPrefix: e.target.value })}
                placeholder="30_Kids/SansuDrill"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* デモデータリセット */}
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
            <button
              type="button"
              onClick={handleResetDemoData}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>デモデータを初期化</span>
            </button>
          </div>

          {saveStatus && (
            <div className="p-2 bg-emerald-50 text-emerald-700 text-xs rounded-lg text-center font-bold flex items-center justify-center space-x-1">
              <ShieldCheck className="w-4 h-4" />
              <span>{saveStatus}</span>
            </div>
          )}

          {/* 保存ボタン */}
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>保存する</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

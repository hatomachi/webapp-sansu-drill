import React, { useState } from 'react';
import { X, Save, Key, RefreshCw, ShieldCheck, Trash2, Calendar, Gem } from 'lucide-react';
import { UserSettings, StageConfig } from '../types';
import { StorageService, INITIAL_MOCK_QUESTIONS, DEFAULT_STAGE_CONFIG } from '../services/storage';

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

  const handleDeleteSamples = async () => {
    if (window.confirm('初期サンプル問題（どんぐり・クッキー・水そう）をすべて削除しますか？\n（自分で撮影した問題のみが残ります）')) {
      await StorageService.deleteSampleQuestions();
      onSettingsSaved();
      alert('サンプル問題を削除しました');
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('本当にすべての問題データを削除して空にしますか？\n※復元できませんのでご注意ください。')) {
      await StorageService.clearAllQuestions();
      onSettingsSaved();
      alert('すべての問題データをクリアしました');
    }
  };

  const handleResetDemoData = () => {
    if (window.confirm('ローカルの問題データを初期デモデータにリセットしますか？')) {
      StorageService.saveLocalQuestions(INITIAL_MOCK_QUESTIONS);
      onSettingsSaved();
      alert('初期デモデータにリセットしました');
    }
  };

  const stageConfig: StageConfig = settings.stageConfig || DEFAULT_STAGE_CONFIG;

  const handleStageConfigChange = (key: keyof StageConfig, value: string) => {
    setSettings({
      ...settings,
      stageConfig: {
        ...stageConfig,
        [key]: value,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-slate-800 text-white rounded-lg">
              <Gem className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">アプリ設定 & 復習スケジュール</h3>
              <p className="text-xs text-slate-500">段階ラベル・GitHub同期・データ管理</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* 3段階復習のラベル自由入力 */}
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-bold text-amber-950">
                3段階の復習ラベル（自由入力）
              </span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              娘さんの学習リズムに合わせて、各ステップの呼び名（毎日、水・土、2週後など）を自由に変更できます。
            </p>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  ① ステップ1（初回・撮影直後）
                </label>
                <input
                  type="text"
                  value={stageConfig.stage1Label}
                  onChange={(e) => handleStageConfigChange('stage1Label', e.target.value)}
                  placeholder="毎日"
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  ② ステップ2（⚪️ オパール獲得後）
                </label>
                <input
                  type="text"
                  value={stageConfig.stage2Label}
                  onChange={(e) => handleStageConfigChange('stage2Label', e.target.value)}
                  placeholder="水・土"
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  ③ ステップ3（🔷 サファイア獲得後）
                </label>
                <input
                  type="text"
                  value={stageConfig.stage3Label}
                  onChange={(e) => handleStageConfigChange('stage3Label', e.target.value)}
                  placeholder="2週後"
                  className="w-full text-xs p-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* デモモード切替 */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-900 block">ローカルデモモード</span>
              <span className="text-[11px] text-blue-700">GitHub未設定でも端末内だけで動作可能</span>
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

          {/* データ削除・管理オペレーション */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">データ管理オペレーション</span>
            
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDeleteSamples}
                className="w-full px-3 py-2 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>サンプル問題のみを消す（実データのみ残す）</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex-1 px-3 py-2 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl font-medium flex items-center justify-center space-x-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>全データをクリア</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="flex-1 px-3 py-2 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl font-medium flex items-center justify-center space-x-1 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>サンプルを復元</span>
                </button>
              </div>
            </div>
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

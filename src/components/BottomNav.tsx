import React from 'react';
import { Printer, CheckCircle2, Layers, Camera } from 'lucide-react';

export type AppTab = 'build' | 'grade' | 'stock';

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenCapture: () => void;
  gradeBadgeCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenCapture,
  gradeBadgeCount,
}) => {
  return (
    <nav className="bg-white border-t border-slate-200 px-2 pt-1.5 pb-2 pb-safe">
      <div className="max-w-2xl mx-auto grid grid-cols-4 gap-1.5">
        <button
          type="button"
          onClick={() => onTabChange('build')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors ${
            activeTab === 'build'
              ? 'text-blue-600 bg-blue-50/70 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Printer className="w-5 h-5 mb-0.5" />
          <span className="text-xs leading-none">つくる</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('grade')}
          className={`relative flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors ${
            activeTab === 'grade'
              ? 'text-emerald-600 bg-emerald-50/70 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 mb-0.5" />
          <span className="text-xs leading-none">丸つけ</span>
          {gradeBadgeCount > 0 && (
            <span className="absolute top-1 right-4 min-w-[18px] h-[18px] px-1 bg-emerald-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center leading-none">
              {gradeBadgeCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange('stock')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors ${
            activeTab === 'stock'
              ? 'text-blue-600 bg-blue-50/70 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span className="text-xs leading-none">ストック</span>
        </button>

        <button
          type="button"
          onClick={onOpenCapture}
          className="flex flex-col items-center justify-center py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm active:scale-95 transition-all"
        >
          <Camera className="w-5 h-5 mb-0.5" />
          <span className="text-xs leading-none">撮る</span>
        </button>
      </div>
    </nav>
  );
};

import React from 'react';
import { X } from 'lucide-react';
import { QuestionItem } from '../types';

interface OriginalImageModalProps {
  question: QuestionItem | null;
  onClose: () => void;
}

export const OriginalImageModal: React.FC<OriginalImageModalProps> = ({ question, onClose }) => {
  if (!question) return null;

  const imageSrc = question.raw_image_base64 || question.raw_image_path;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center space-x-2">
              <span>📷 撮影した元の問題</span>
              <span className="text-xs font-normal text-slate-500">({question.id})</span>
            </h3>
            {question.memo && (
              <p className="text-xs text-slate-600 mt-0.5">親のメモ: {question.memo}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-slate-100 min-h-[300px]">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="元の問題写真"
              className="max-h-[70vh] w-auto object-contain rounded-lg shadow-md border border-slate-300"
            />
          ) : (
            <div className="text-center p-8 text-slate-400">
              <p className="text-sm">画像データが見つかりませんでした</p>
              <p className="text-xs mt-1">パス: {question.raw_image_path || '未登録'}</p>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-200 bg-white flex justify-between items-center text-xs text-slate-500">
          <span>{question.category}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
          >
            とじる
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';
import { StorageService } from '../services/storage';
import { QuestionItem } from '../types';

interface CaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionAdded: (newQuestion: QuestionItem) => void;
}

export const CaptureModal: React.FC<CaptureModalProps> = ({
  isOpen,
  onClose,
  onQuestionAdded,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Raw, setBase64Raw] = useState<string | null>(null);
  const [memo, setMemo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressedSize, setCompressedSize] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage('画像をきれいに軽量圧縮中（長辺1600px）...');

    try {
      const result = await compressImage(file, 1600, 0.82);
      setPreviewUrl(result.base64Data);
      setBase64Raw(result.base64Raw);
      const kb = Math.round(result.sizeBytes / 1024);
      setCompressedSize(`${kb} KB`);
      setStatusMessage(null);
    } catch (err: any) {
      console.error(err);
      setStatusMessage('圧縮に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!base64Raw) return;

    setIsProcessing(true);
    setStatusMessage('アップロード中...');

    try {
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${Date.now().toString().slice(-4)}`;
      const fileName = `problem_${dateStr}.jpg`;

      const result = await StorageService.uploadRawImage(fileName, base64Raw, memo);
      onQuestionAdded(result.questionItem);

      // リセットして閉じる
      setPreviewUrl(null);
      setBase64Raw(null);
      setMemo('');
      setStatusMessage(null);
      onClose();
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`アップロード失敗: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* ヘッダー */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-blue-50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">間違えた問題を撮影（5秒）</h3>
              <p className="text-xs text-blue-700">類題生成・解説・スケジュールはAIが全自動化</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 隠しインプット */}
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* メインエリア */}
        <div className="p-5 space-y-4">
          {!previewUrl ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-300 rounded-2xl bg-blue-50/50 hover:bg-blue-50 transition-all hover:border-blue-500 group"
              >
                <div className="p-3 bg-blue-600 text-white rounded-full shadow-md group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="mt-3 text-xs font-bold text-blue-900">カメラで今すぐ撮影</span>
                <span className="text-[10px] text-blue-600 mt-0.5">iPad / スマホのカメラ起動</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all hover:border-slate-400 group"
              >
                <div className="p-3 bg-slate-700 text-white rounded-full shadow-md group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <span className="mt-3 text-xs font-bold text-slate-800">ライブラリから選択</span>
                <span className="text-[10px] text-slate-500 mt-0.5">撮影済みの写真を選ぶ</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center max-h-64">
                <img
                  src={previewUrl}
                  alt="プレビュー"
                  className="max-h-64 w-auto object-contain"
                />
                <button
                  onClick={() => {
                    setPreviewUrl(null);
                    setBase64Raw(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                {compressedSize && (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] font-mono rounded">
                    圧縮後: {compressedSize}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  親のひとことメモ（任意）
                </label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="例: たし算とひき算まとめドリル問3。式を逆に書いてた"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {statusMessage && (
            <p className="text-xs text-center text-blue-600 font-medium animate-pulse">
              {statusMessage}
            </p>
          )}

          {/* アップロードボタン */}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              キャンセル
            </button>
            <button
              type="button"
              disabled={!base64Raw || isProcessing}
              onClick={handleUpload}
              className="flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>アップロード ＆ AI解析開始</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

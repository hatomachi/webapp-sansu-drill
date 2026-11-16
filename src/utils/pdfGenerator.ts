import { jsPDF } from 'jspdf';
import { domToJpeg } from 'modern-screenshot';

export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

export type PdfDeliveryResult =
  | 'shared'
  | 'downloaded'
  | 'cancelled'
  | 'activation-expired';

/**
 * iPhone / iPad（デスクトップモードUAのiPadOS含む）/ Android 判定
 */
export function isTouchMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isAndroid = /Android/i.test(ua);
  return isIOS || isIPadOS || isAndroid;
}

function waitForAnimationFrames(count = 2): Promise<void> {
  return new Promise((resolve) => {
    let remaining = count;
    const step = () => {
      remaining -= 1;
      if (remaining <= 0) {
        resolve();
      } else {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  });
}

async function capturePageAsJpeg(element: HTMLElement): Promise<string> {
  const baseOptions = {
    width: A4_WIDTH_PX,
    height: A4_HEIGHT_PX,
    quality: 0.94,
    backgroundColor: '#ffffff',
    // 外部Webフォントの走査をスキップし、ローカルシステムフォントで高速・安定レンダリングする
    font: false as const,
  };

  try {
    return await domToJpeg(element, {
      ...baseOptions,
      scale: 2.5,
    });
  } catch (err) {
    // 高DPI Canvas 確保に失敗する端末向けの軽量スケールリトライ
    console.warn('High-scale capture failed, retrying with scale 2:', err);
    return await domToJpeg(element, {
      ...baseOptions,
      scale: 2,
    });
  }
}

/**
 * 固定A4サイズのDOM要素群をページ単位でJPEG化し、A4縦PDFファイルを生成する
 */
export async function generateA4PdfFile(
  pageElements: HTMLElement[],
  filename: string
): Promise<File> {
  if (pageElements.length === 0) {
    throw new Error('PDF化するページが見つかりません。');
  }

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await waitForAnimationFrames(2);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  for (let i = 0; i < pageElements.length; i++) {
    const dataUrl = await capturePageAsJpeg(pageElements[i]);
    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }
    pdf.addImage(
      dataUrl,
      'JPEG',
      0,
      0,
      A4_WIDTH_MM,
      A4_HEIGHT_MM,
      undefined,
      'FAST'
    );
  }

  const blob = pdf.output('blob');
  return new File([blob], filename, { type: 'application/pdf' });
}

/**
 * 生成したPDFファイルをローカルにダウンロード保存する
 */
export function downloadPdfFile(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
    URL.revokeObjectURL(url);
  }, 1500);
}

/**
 * Web Share API（Files共有）で OS 共有シート（Canon PRINT 等）を開く
 */
export async function sharePdfFile(
  file: File
): Promise<'shared' | 'cancelled' | 'activation-expired' | 'unsupported'> {
  if (
    typeof navigator.share !== 'function' ||
    typeof navigator.canShare !== 'function'
  ) {
    return 'unsupported';
  }

  try {
    if (!navigator.canShare({ files: [file] })) {
      return 'unsupported';
    }
  } catch {
    return 'unsupported';
  }

  try {
    await navigator.share({
      files: [file],
      title: 'さんすう ふくしゅうプリント',
    });
    return 'shared';
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return 'cancelled';
      }
      if (err.name === 'NotAllowedError') {
        return 'activation-expired';
      }
    }
    throw err;
  }
}

/**
 * 端末に応じた最適な方法でPDFを届ける（スマホは共有シート優先、PCは直接ダウンロード）
 */
export async function deliverPdfFile(file: File): Promise<PdfDeliveryResult> {
  if (isTouchMobileDevice()) {
    try {
      const shareResult = await sharePdfFile(file);
      if (shareResult !== 'unsupported') {
        return shareResult;
      }
    } catch (err) {
      console.warn('Web Share failed, falling back to download:', err);
    }
  }

  downloadPdfFile(file);
  return 'downloaded';
}

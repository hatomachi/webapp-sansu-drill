export interface CompressedImageResult {
  file: File;
  base64Data: string; // "data:image/jpeg;base64,..."
  base64Raw: string;  // base64純粋データ
  width: number;
  height: number;
  sizeBytes: number;
}

export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.82
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('画像オブジェクトの生成に失敗しました'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvasコンテキストの取得に失敗しました'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const base64Raw = dataUrl.split(',')[1];

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Blob生成に失敗しました'));
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: mimeType,
              lastModified: Date.now(),
            });

            resolve({
              file: compressedFile,
              base64Data: dataUrl,
              base64Raw,
              width,
              height,
              sizeBytes: blob.size,
            });
          },
          mimeType,
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

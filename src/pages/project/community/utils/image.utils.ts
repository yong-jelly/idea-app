/**
 * 이미지 파일을 Data URL로 변환합니다.
 * @param file - 변환할 이미지 파일
 * @returns Promise<string> - Data URL
 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 여러 이미지 파일을 Data URL 배열로 변환합니다.
 * @param files - 변환할 이미지 파일 배열
 * @param maxCount - 최대 개수 제한
 * @returns Promise<string[]> - Data URL 배열
 */
export async function filesToDataURLs(files: File[], maxCount: number): Promise<string[]> {
  const filesToProcess = Array.from(files).slice(0, maxCount);
  const dataURLs = await Promise.all(filesToProcess.map(fileToDataURL));
  return dataURLs;
}


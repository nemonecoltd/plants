// 폰 사진은 3~5MB(4000px 이상)라 그대로 올리면 업로드가 느리고 nginx 본문 크기 제한에도
// 걸리기 쉽다. 진단에 필요한 건 "무슨 식물이고 잎 상태가 어떤가"라 해상도가 높을 이유가
// 없어서, 보내기 전에 브라우저에서 먼저 줄인다(서버에서 한 번 더 줄이지만, 업로드 자체를
// 가볍게 만드는 게 체감 속도에 훨씬 크게 작용한다).
const MAX_PX = 1280;
const QUALITY = 0.82;

export async function compressImage(file: File): Promise<Blob> {
  // HEIC 등 브라우저가 디코딩 못 하는 포맷이면 createImageBitmap이 실패한다.
  // 그때는 원본을 그대로 보내고 서버(PIL)에서 처리하게 둔다.
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const scale = Math.min(1, MAX_PX / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY)
  );
  // 압축본이 원본보다 크면(이미 작고 최적화된 사진) 원본을 쓴다
  return blob && blob.size < file.size ? blob : file;
}

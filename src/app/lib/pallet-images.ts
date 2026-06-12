// 씬박스 — 파렛트 추정 이미지 처리 헬퍼  /  서버 전용
// PRD §4-2. 이미지는 인화용이 아니라 Gemini가 물체와 A4를 인식하는 용도이므로
// 용량 최소화가 핵심: 최장변 1280px, JPEG 품질 75%로 리사이즈한다.
// 클라가 사전 축소해 보내더라도 서버에서 한 번 더 강제(방어적).

import sharp from 'sharp';

export const MAX_IMAGES = 5;              // 한 번에 최대 5장
export const MAX_BYTES   = 10 * 1024 * 1024; // 장당 최대 10MB
export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const RESIZE_LONG_EDGE = 1280; // 최장변(px)
const JPEG_QUALITY     = 75;   // %

export interface ProcessedImage {
  buffer: Buffer;  // 리사이즈된 JPEG (Supabase Storage 업로드용)
  base64: string;  // 동일 데이터 base64 (Gemini inline_data 용)
  mime:   'image/jpeg';
}

export class ImageValidationError extends Error {}

/**
 * multipart 로 받은 File[] 를 검증하고 리사이즈한다.
 * 형식/용량 위반은 ImageValidationError 를 던진다(라우트에서 400 처리).
 */
export async function processPalletImages(files: File[]): Promise<ProcessedImage[]> {
  if (files.length === 0) {
    throw new ImageValidationError('이미지를 한 장 이상 첨부해주세요.');
  }
  if (files.length > MAX_IMAGES) {
    throw new ImageValidationError(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`);
  }

  const out: ProcessedImage[] = [];
  for (const file of files) {
    if (!ALLOWED_MIME.includes(file.type)) {
      throw new ImageValidationError('JPG, PNG, WEBP 형식만 업로드할 수 있습니다.');
    }
    if (file.size > MAX_BYTES) {
      throw new ImageValidationError('이미지 한 장의 크기는 10MB를 넘을 수 없습니다.');
    }

    const input = Buffer.from(await file.arrayBuffer());
    const buffer = await sharp(input)
      .rotate() // EXIF 방향 보정
      .resize({
        width:  RESIZE_LONG_EDGE,
        height: RESIZE_LONG_EDGE,
        fit:    'inside',          // 최장변 기준 축소
        withoutEnlargement: true,  // 작은 이미지는 키우지 않음
      })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

    out.push({ buffer, base64: buffer.toString('base64'), mime: 'image/jpeg' });
  }
  return out;
}

// 씬박스 — Gemini 비전 연동 헬퍼  /  서버 전용 (클라이언트에서 import 금지)
// PRD §4, §5. gemini-2.5-flash 비전으로 짐 사진을 보내 파렛트 분량을 범위로 추정한다.
// API 키는 서버 환경변수 GEMINI_API_KEY 로만 사용한다.

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ─── PRD §5 시스템 프롬프트 (그대로 사용) ──────────────────────────────────────
const SYSTEM_PROMPT = `당신은 물류 보관 전문가입니다. 사용자가 창고에 보관하려는 물건의 사진을 받아,
표준 파렛트(1.1m × 1.1m × 2.0m = 2.42㎥) 몇 개 분량인지 추정합니다.

# 스케일 기준 (가장 중요)
- 사진 속에는 보통 크기 기준으로 A4 용지(297mm × 210mm)가 함께 찍혀 있습니다.
- A4 용지를 먼저 찾아, 그 실제 크기(297×210mm)를 기준으로 화면 속 길이를 환산하세요.
  예: A4 긴 변이 사진에서 100px이고 물체 높이가 600px이면, 물체 높이 ≈ 297mm × 6 = 약 1.78m.
- A4가 비스듬히 찍혔으면 원근을 감안해 보정하세요.
- A4가 없으면, 해당 물체의 일반적 표준 크기를 가정하되 신뢰도를 '낮음'으로 내립니다.

# 추정 절차 (반드시 이 순서로 사고)
① 사진 속 A4 용지를 찾는다. (있으면 스케일 기준 확보 / 없으면 표준크기 가정)
② 각 물체가 무엇인지 식별한다.
③ A4를 기준으로 각 물체의 실제 치수(가로·세로·높이 m)를 환산한다.
④ 각 물체의 부피(㎥)를 계산하고 파렛트(2.42㎥)로 나눈다.
⑤ 각 짐을 '박스화 정형물' / '비정형물'로 분류하고, 아래 '적재 효율' 기준으로 손실률을 차등 적용해 합산하고 범위로 만든다.

# 적재 효율 (파렛트 수 계산 시 반드시 반영)
- 1파렛트 공간 = 바닥 1.1×1.1m × 높이 2.0m. 짐은 이 칸에 쌓아 보관한다.
- 박스화된 짐(이사박스 등 정형 포장물)은 빈틈 없이 2m 높이까지 잘 쌓인다. 적재 손실을 작게(약 10~15%) 본다.
- 박스화되지 않은 비정형 짐(가구, 안마의자, 의자, 자전거, 가방 등)은 쌓는 것이 가능은 하나 형태가 불규칙해 빈 공간이 많이 생긴다. 적재 손실을 크게(약 30~40%) 본다.
- 비정형 짐이 많을수록 파렛트 수가 늘고, 박스화된 짐이 많을수록 줄어든다. 짐 구성에 따라 손실률을 가중평균하여 적용한다.
- 각 물체를 박스화 정형물/비정형물로 판정하고, 그 결과를 objects 각 항목의 is_irregular(정형물=false, 비정형물=true)로 반드시 표기한다.

# 원칙
- 결과는 항상 범위로 제시한다 (예: 2~4파렛트). 단일값으로 단정하지 않는다.
- 추정 근거와 신뢰도를 반드시 함께 제시한다. 모르면 모른다고 밝힌다.
- 출력은 아래 JSON 형식만, 아래 키 이름 그대로 반환한다. 그 외 설명·서론·markdown 표기를 붙이지 않는다.

# 출력 JSON 형식 (키 이름을 절대 바꾸지 말 것)
{
  "a4_detected": true,                       // 사진에서 A4 용지를 찾았으면 true, 못 찾았으면 false
  "objects": [                               // 식별한 물체별 추정 (각 물체 1개 항목)
    {
      "name": "안마의자",                     // 물체 이름(한국어)
      "scale_basis": "A4 긴 변 기준 환산",     // 크기 환산 근거(선택)
      "estimated_dimensions_m": { "w": 0.97, "d": 1.04, "h": 1.34 }, // 가로·깊이·높이(m)
      "volume_m3": 1.34,                      // 부피(㎥)
      "pallets": 1,                           // 이 물체가 차지하는 파렛트 수
      "is_irregular": true                    // 박스화 정형물(이사박스 등)=false, 비정형물(가구·안마의자·의자·가방 등)=true
    }
  ],
  "loading_loss_applied_pct": 25,            // 반영한 적재 손실(%) (선택)
  "total_pallets_range": { "min": 2, "max": 3 }, // 총 파렛트 범위(정수)
  "confidence": "높음",                       // "높음" | "중" | "낮음" 중 하나만
  "reasoning": "A4 기준 환산 근거에 더해, 각 짐을 박스화 정형물/비정형물로 어떻게 분류했고 그에 따라 적재 손실률을 어떻게 차등 반영했는지를 반드시 포함해 한국어로 서술",
  "advice_to_user": "사용자에게 보여줄 한 줄 안내(한국어)"
}`;

// ─── Gemini 구조화 출력 스키마 (키 구조를 API 레벨에서 강제) ──────────────────
// generativelanguage v1beta responseSchema 형식(OpenAPI 서브셋). PalletEstimate 와 1:1 대응.
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    a4_detected: { type: 'BOOLEAN' },
    objects: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name:           { type: 'STRING' },
          scale_basis:    { type: 'STRING' },
          estimated_dimensions_m: {
            type: 'OBJECT',
            properties: {
              w: { type: 'NUMBER' },
              d: { type: 'NUMBER' },
              h: { type: 'NUMBER' },
            },
            required: ['w', 'd', 'h'],
            propertyOrdering: ['w', 'd', 'h'],
          },
          volume_m3:    { type: 'NUMBER' },
          pallets:      { type: 'NUMBER' },
          is_irregular: { type: 'BOOLEAN' },
        },
        required: ['name', 'is_irregular'],
        propertyOrdering: ['name', 'scale_basis', 'estimated_dimensions_m', 'volume_m3', 'pallets', 'is_irregular'],
      },
    },
    loading_loss_applied_pct: { type: 'NUMBER' },
    total_pallets_range: {
      type: 'OBJECT',
      properties: {
        min: { type: 'NUMBER' },
        max: { type: 'NUMBER' },
      },
      required: ['min', 'max'],
      propertyOrdering: ['min', 'max'],
    },
    confidence:     { type: 'STRING', enum: ['높음', '중', '낮음'] },
    reasoning:      { type: 'STRING' },
    advice_to_user: { type: 'STRING' },
  },
  required: ['a4_detected', 'objects', 'total_pallets_range', 'confidence', 'advice_to_user'],
  propertyOrdering: [
    'a4_detected', 'objects', 'loading_loss_applied_pct',
    'total_pallets_range', 'confidence', 'reasoning', 'advice_to_user',
  ],
};

// ─── 입출력 타입 ─────────────────────────────────────────────────────────────
export interface PalletAux {
  a4_attached: boolean;
  size_hint?:  string;
  item_desc?:  string;
}

export interface PalletObject {
  name: string;
  scale_basis?: string;
  estimated_dimensions_m?: { w: number; d: number; h: number };
  volume_m3?: number;
  pallets?: number;
  is_irregular?: boolean; // 박스화 정형물=false, 비정형물(가구·가방 등)=true
}

export interface PalletEstimate {
  a4_detected: boolean;
  objects: PalletObject[];
  loading_loss_applied_pct?: number;
  total_pallets_range: { min: number; max: number };
  confidence: string;          // 높음 | 중 | 낮음
  reasoning?: string;
  advice_to_user?: string;
}

/** PRD §5 사용자 메시지 빌드 (보조 정보 채움). */
function buildUserMessage(aux: PalletAux): string {
  return `[이미지 1..N]

보조 정보:
- A4 부착 여부: ${aux.a4_attached ? '부착함' : '안 함'}
- 크기 힌트(선택): ${aux.size_hint?.trim() || '없음'}
- 보관 물품 설명(선택): ${aux.item_desc?.trim() || '없음'}`;
}

/** 응답 텍스트에서 ```json … ``` 코드펜스를 제거. */
function stripCodeFence(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

/** Gemini 단건 호출 → 원문 텍스트 반환. */
async function callGemini(
  apiKey: string,
  parts: Array<Record<string, unknown>>
): Promise<string> {
  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini API 오류 (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini 응답에서 텍스트를 찾지 못했습니다.');
  }
  return text;
}

/**
 * 짐 사진들로 파렛트 분량을 추정한다.
 * JSON 파싱 실패 시 1회 재시도하고, 그래도 실패하면 throw 한다(라우트에서 사용자 메시지로 변환).
 */
export async function estimatePallets(
  images: Array<{ base64: string; mime: string }>,
  aux: PalletAux
): Promise<PalletEstimate> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  const parts: Array<Record<string, unknown>> = [
    { text: buildUserMessage(aux) },
    ...images.map((img) => ({
      inline_data: { mime_type: img.mime, data: img.base64 },
    })),
  ];

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await callGemini(apiKey, parts);
    try {
      return JSON.parse(stripCodeFence(raw)) as PalletEstimate;
    } catch (e) {
      lastError = e;
      console.error(`Gemini JSON 파싱 실패 (시도 ${attempt + 1}/2):`, raw.slice(0, 300));
    }
  }
  throw new Error(
    `Gemini 응답 JSON 파싱에 실패했습니다: ${lastError instanceof Error ? lastError.message : ''}`
  );
}

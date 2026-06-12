'use client';

// 씬박스 — 짐 부피(파렛트) 추정 페이지  /  공개 라우트 /size-check (비로그인 허용)
// 컨셉: "당신의 짐을 씬박스에 담아보세요" — 업로드 영역은 '담기' 은유, 결과 영역은 '파렛트' 단위만.
// /api/pallet-estimate 로 multipart(images/a4_attached/size_hint/item_desc) POST.

import { useState, useRef, useEffect } from 'react';
import { Package, Sofa, Shapes } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';

// 기존 랜딩과 동일한 팔레트
const BLUE      = '#1A36E8';
const BLUE_DEEP = '#0F1F8F';
const YELLOW    = '#FFD400';
const BEIGE     = '#F5F4EF';
const INK       = '#0A0A0A';
const GRAY      = '#8A8A85';

const MAX_IMAGES = 5;
const PHONE_DISPLAY = '070-8057-6783'; // 화면 고정 — AI 응답에서 가져오지 않음
const PHONE_TEL     = '07080576783';
const STORAGE_KEY   = 'scenebox_last_estimate'; // 마지막 결과 보존(결과 데이터만, 사진 제외)

interface EstObject { name: string; pallets: number | null; is_irregular: boolean | null; }
interface EstResult {
  pallets_min: number | null;
  pallets_max: number | null;
  confidence: string | null;
  advice_to_user: string | null;
  objects: EstObject[];
  reasoning?: string | null;
  loading_loss_pct?: number | null;
}

/** reasoning 텍스트의 가벼운 마크다운 정리(** 강조, * 불릿 제거) → 줄 배열. */
function cleanReasoning(text: string): string[] {
  return text
    .replace(/\*\*/g, '')
    .split('\n')
    .map((l) => l.replace(/^\s*[*-]\s+/, '· ').trim())
    .filter((l) => l.length > 0);
}

/** 파렛트 수 표기: 정수는 그대로, 소수는 1자리, 0이 아닌 미세값은 0.1 하한. */
function fmtPallets(p: number | null): string {
  if (p == null) return '?';
  if (p <= 0) return '0';
  if (p < 0.1) return '0.1';
  const r = Math.round(p * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/** 저장 시각 표기 (YYYY.MM.DD HH:MM). */
function fmtTime(ms: number | null): string {
  if (!ms) return '';
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 신뢰도 뱃지 색상. */
function confidenceStyle(c: string | null): { bg: string; fg: string; label: string } {
  if (c === '높음') return { bg: '#DCFCE7', fg: '#15803D', label: '신뢰도 높음' };
  if (c === '낮음') return { bg: '#F1F1EE', fg: GRAY,      label: '신뢰도 낮음' };
  return { bg: '#FEF9C3', fg: '#A16207', label: c ? `신뢰도 ${c}` : '신뢰도 중' };
}

export default function SizeCheckPage() {
  const [files, setFiles]         = useState<File[]>([]);
  const [previews, setPreviews]   = useState<string[]>([]);
  const [a4Attached, setA4]       = useState(true);
  const [sizeHint, setSizeHint]   = useState('');
  const [itemDesc, setItemDesc]   = useState('');
  const [guideOpen, setGuideOpen] = useState(false);
  const [auxOpen, setAuxOpen]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [result, setResult]       = useState<EstResult | null>(null);
  const [savedAt, setSavedAt]     = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 마운트 시 저장된 마지막 결과 복원 (클라이언트에서만 — 하이드레이션 미스매치 방지)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw);
      const hasData = p && (p.pallets_min != null || p.pallets_max != null || (Array.isArray(p.objects) && p.objects.length));
      if (hasData) {
        setResult({
          pallets_min:    p.pallets_min ?? null,
          pallets_max:    p.pallets_max ?? null,
          confidence:     p.confidence ?? null,
          advice_to_user: p.advice_to_user ?? null,
          objects:        Array.isArray(p.objects) ? p.objects : [],
        });
        setSavedAt(typeof p.savedAt === 'number' ? p.savedAt : null);
      }
    } catch { /* 저장본 파손 시 무시 */ }
  }, []);

  // 결과를 localStorage 에 저장(결과 데이터만, 사진 제외). 새 추정마다 덮어써 갱신.
  const persist = (r: EstResult, at: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        pallets_min:    r.pallets_min ?? null,
        pallets_max:    r.pallets_max ?? null,
        confidence:     r.confidence ?? null,
        advice_to_user: r.advice_to_user ?? null,
        objects:        r.objects ?? [],
        savedAt:        at,
      }));
    } catch { /* 용량/프라이빗 모드 등으로 실패해도 화면 표시는 유지 */ }
  };

  const clearSaved = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    setSavedAt(null);
    reset();
  };

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setError(null);
    const incoming = Array.from(list);
    const room = MAX_IMAGES - files.length;
    if (room <= 0) {
      setError(`사진은 최대 ${MAX_IMAGES}장까지 담을 수 있어요.`);
      return;
    }
    const accepted = incoming.slice(0, room);
    if (incoming.length > room) {
      setError(`최대 ${MAX_IMAGES}장까지만 담을 수 있어 일부 사진은 제외했어요.`);
    }
    setFiles(prev => [...prev, ...accepted]);
    setPreviews(prev => [...prev, ...accepted.map(f => URL.createObjectURL(f))]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const submit = async () => {
    if (files.length === 0 || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('images', f));
      fd.append('a4_attached', String(a4Attached));
      if (sizeHint.trim()) fd.append('size_hint', sizeHint.trim());
      if (itemDesc.trim()) fd.append('item_desc', itemDesc.trim());

      // 로그인 상태면 토큰 첨부(한도 상향). 없으면 익명 쿠키 경로로 진행.
      const headers: Record<string, string> = {};
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          headers['Authorization'] = `Bearer ${data.session.access_token}`;
        }
      } catch { /* 세션 조회 실패해도 익명으로 진행 */ }

      const res = await fetch('/api/pallet-estimate', { method: 'POST', body: fd, headers });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || '추정에 실패했어요. 사진을 바꿔 다시 시도해주세요.');
        return;
      }
      const fresh = body as EstResult;
      const now = Date.now();
      setResult(fresh);
      setSavedAt(now);
      persist(fresh, now);
    } catch {
      setError('네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    previews.forEach(URL.revokeObjectURL);
    setFiles([]);
    setPreviews([]);
    setResult(null);
    setError(null);
    setSizeHint('');
    setItemDesc('');
    setA4(true);
  };

  const conf = result ? confidenceStyle(result.confidence) : null;
  // 개별 짐 파렛트 합계(합계 → 손실 → 최종 흐름 표시용)
  const objectsSum = result ? result.objects.reduce((s, o) => s + (o.pallets ?? 0), 0) : 0;
  const reasoningLines = result?.reasoning ? cleanReasoning(result.reasoning) : [];

  return (
    <div className="sc-bg" style={{ minHeight: '100vh', background: BLUE, color: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800;900&family=Gothic+A1:wght@400;500;700;800;900&display=swap');
        .sc-bg { position: relative; overflow: hidden; }
        .sc-bg::before {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 54px 54px;
        }
        .sc { font-family: 'Gothic A1', sans-serif; position: relative; z-index: 2; }
        .sc .mono { font-family: 'Archivo', sans-serif; }
        .sc .box { width: 14px; height: 14px; border: 2.5px solid #fff; display: inline-block; }
        @keyframes scSpin { to { transform: rotate(360deg); } }
        .sc .spin { width: 34px; height: 34px; border: 3px solid rgba(255,255,255,0.3); border-top-color: ${YELLOW}; border-radius: 50%; animation: scSpin 0.9s linear infinite; }
        .sc input[type=text]::placeholder { color: #B8B8B2; }

        /* 박스 프레임 — 얇은 노란 점선 테두리 + 카메라 뷰파인더식 ㄱ자 코너 마크 */
        .sc .pixel-box {
          position: relative;
          border-radius: 0;
          background-color: ${BEIGE};
          box-shadow: inset 0 2px 10px rgba(0,0,0,0.06);
          /* 4변 얇은 노란 점선 테두리(차분하게 영역만 표시) — 상/하: repeat-x, 좌/우: repeat-y */
          background-image:
            repeating-linear-gradient(90deg, ${YELLOW} 0 7px, transparent 7px 14px),
            repeating-linear-gradient(90deg, ${YELLOW} 0 7px, transparent 7px 14px),
            repeating-linear-gradient(0deg,  ${YELLOW} 0 7px, transparent 7px 14px),
            repeating-linear-gradient(0deg,  ${YELLOW} 0 7px, transparent 7px 14px);
          background-position: 0 0, 0 100%, 0 0, 100% 0;
          background-size: 14px 2px, 14px 2px, 2px 14px, 2px 14px;
          background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
        }
        /* 카메라 프레임 코너 마크(ㄱ자) — 크고 두껍게 강조 */
        .sc .pixel-box .corner { position: absolute; width: 46px; height: 46px; pointer-events: none; z-index: 2; }
        .sc .pixel-box .corner.tl { top: -3px;    left: -3px;  border-top: 8px solid ${YELLOW};    border-left: 8px solid ${YELLOW}; }
        .sc .pixel-box .corner.tr { top: -3px;    right: -3px; border-top: 8px solid ${YELLOW};    border-right: 8px solid ${YELLOW}; }
        .sc .pixel-box .corner.bl { bottom: -3px; left: -3px;  border-bottom: 8px solid ${YELLOW}; border-left: 8px solid ${YELLOW}; }
        .sc .pixel-box .corner.br { bottom: -3px; right: -3px; border-bottom: 8px solid ${YELLOW}; border-right: 8px solid ${YELLOW}; }
      `}</style>

      <div className="sc" style={{ maxWidth: 520, margin: '0 auto', padding: 'clamp(26px, 5vh, 44px) clamp(20px, 5vw, 32px) clamp(28px, 6vh, 48px)' }}>

        {/* 상단 헤더: 좌측 로고(홈) + 우측 닫기 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" className="mono" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 900, fontSize: 18, letterSpacing: '-0.5px', color: '#fff', textDecoration: 'none' }}>
            SCENE<span className="box" />BOX
          </a>
          <a
            href="/"
            aria-label="홈으로"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.55)', color: '#fff', fontSize: 16, lineHeight: 1, textDecoration: 'none' }}
          >✕</a>
        </div>

        {/* 타이틀 */}
        <h1 style={{ marginTop: 'clamp(24px, 5vh, 44px)', fontSize: 'clamp(30px, 8vw, 46px)', fontWeight: 900, lineHeight: 1.25, letterSpacing: '-0.5px', color: '#fff' }}>
          당신의 짐을<br /><span style={{ color: YELLOW }}>씬박스</span>에 담아보세요
        </h1>
        <p style={{ marginTop: 'clamp(10px, 1.6vh, 16px)', fontSize: 'clamp(12.5px, 3.4vw, 15px)', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, wordBreak: 'keep-all', textWrap: 'balance', letterSpacing: '-0.2px' }}>
          사진을 올리면 AI가 보관에 필요한 파렛트 수를 추천해드립니다.
        </p>

        {/* ───── 결과 화면 ───── */}
        {result ? (
          <div style={{ marginTop: 'clamp(26px, 5vh, 44px)' }}>
            {savedAt && (
              <p style={{ marginBottom: 10, fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>
                최근 추정 결과 · {fmtTime(savedAt)}
              </p>
            )}
            {/* 메인 결과 */}
            <div style={{ background: '#fff', border: `2px solid ${INK}`, borderRadius: 4, padding: 'clamp(28px, 5vw, 40px) 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 'clamp(13px, 3.4vw, 15px)', color: GRAY, fontWeight: 700 }}>예상 보관 분량</p>
              <p style={{ marginTop: 8, fontSize: 'clamp(38px, 11vw, 54px)', fontWeight: 900, color: BLUE, letterSpacing: '-1px', lineHeight: 1.1 }}>
                약 {fmtPallets(result.pallets_min)}~{fmtPallets(result.pallets_max)} 파렛트
              </p>
              {conf && (
                <span style={{ display: 'inline-block', marginTop: 12, padding: '6px 14px', borderRadius: 100, background: conf.bg, color: conf.fg, fontSize: 12, fontWeight: 800 }}>
                  {conf.label}
                </span>
              )}
            </div>

            {/* 물체별 분해 */}
            {result.objects && result.objects.length > 0 && (
              <div style={{ marginTop: 14, background: '#fff', border: '1px solid #E5E4DF', borderRadius: 4, padding: '16px 18px' }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: INK, marginBottom: 10 }}>물체별 예상 분량</p>
                {result.objects.map((o, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderTop: i === 0 ? 'none' : '1px solid #F0EFEA' }}>
                    <span style={{ flex: 1, fontSize: 14, color: '#2A2A28', lineHeight: 1.4 }}>
                      · {o.name}
                      {o.is_irregular && (
                        <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 3, background: '#F1F1EE', color: GRAY, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>비정형</span>
                      )}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: INK, whiteSpace: 'nowrap' }}>≈ {fmtPallets(o.pallets)} 파렛트</span>
                  </div>
                ))}

                {/* 합계 → 손실 반영 → 최종 흐름 (개별 합과 최종값 차이 설명) */}
                <div style={{ marginTop: 10, paddingTop: 12, borderTop: '2px solid #ECEBE6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#55554F' }}>
                    <span>개별 짐 합계</span>
                    <span style={{ fontWeight: 700 }}>≈ {fmtPallets(objectsSum)} 파렛트</span>
                  </div>
                  {result.loading_loss_pct != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: GRAY, marginTop: 6 }}>
                      <span>비정형 적재 손실 반영 ↓</span>
                      <span style={{ fontWeight: 700 }}>약 {result.loading_loss_pct}%</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14.5, color: INK, fontWeight: 900, marginTop: 8 }}>
                    <span>최종 예상</span>
                    <span style={{ color: BLUE }}>약 {fmtPallets(result.pallets_min)}~{fmtPallets(result.pallets_max)} 파렛트</span>
                  </div>
                  <p style={{ marginTop: 10, fontSize: 11.5, color: GRAY, lineHeight: 1.6 }}>
                    ※ 비정형 짐은 형태가 불규칙해 쌓을 때 빈 공간이 생겨, 실제 점유 공간이 개별 합보다 커집니다.
                  </p>
                </div>
              </div>
            )}

            {/* AI 안내 한 줄 */}
            {result.advice_to_user && (
              <div style={{ marginTop: 14, background: '#EEF1FF', border: `1px solid #C9D2FF`, borderRadius: 4, padding: '14px 16px', fontSize: 13.5, color: BLUE_DEEP, lineHeight: 1.55 }}>
                💬 {result.advice_to_user}
              </div>
            )}

            {/* 추정 근거 (AI reasoning, 항상 표시) */}
            {reasoningLines.length > 0 && (
              <div style={{ marginTop: 14, background: '#fff', border: '1px solid #E5E4DF', borderRadius: 4, padding: '16px 18px' }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: INK, marginBottom: 10 }}>🔍 추정 근거</p>
                {reasoningLines.map((line, i) => (
                  <p key={i} style={{ fontSize: 13, color: '#3A3A37', lineHeight: 1.7, marginTop: i === 0 ? 0 : 6 }}>{line}</p>
                ))}
              </div>
            )}

            {/* 고정 안내 (하드코딩, 항상 동일) */}
            <div style={{ marginTop: 14, background: '#fff', border: '1px solid #E5E4DF', borderRadius: 4, padding: '14px 16px', fontSize: 12, color: '#55554F', lineHeight: 1.7 }}>
              <p>※ 이 결과는 사진 기반 AI 추정치로, 참고용입니다.</p>
              <p>※ 박스화되지 않은 비정형 짐(가구 등)이 포함된 경우, 실제 적재 시 1파렛트 내외의 오차가 발생할 수 있습니다.</p>
              <p>※ 정확한 견적과 보관 방법은 전화 상담을 통해 안내받으실 수 있습니다. 📞 씬박스 {PHONE_DISPLAY}</p>
            </div>

            {/* 예약 흐름 연결 */}
            <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => { window.location.href = '/login'; }}
                style={{ width: '100%', padding: '16px 0', background: YELLOW, color: INK, border: 'none', borderRadius: 4, fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(255,212,0,0.35)' }}
              >
                보관 예약하기
              </button>
              <a
                href={`tel:${PHONE_TEL}`}
                style={{ width: '100%', padding: '15px 0', background: '#fff', color: BLUE, border: '2px solid #fff', borderRadius: 4, fontSize: 15, fontWeight: 800, textAlign: 'center', textDecoration: 'none' }}
              >
                📞 전화 상담 {PHONE_DISPLAY}
              </a>
              <button
                onClick={reset}
                style={{ width: '100%', padding: '12px 0', background: 'transparent', color: 'rgba(255,255,255,0.8)', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                다른 짐 다시 추정하기
              </button>
              <button
                onClick={clearSaved}
                style={{ width: '100%', padding: '2px 0 0', background: 'transparent', color: 'rgba(255,255,255,0.5)', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                저장된 결과 지우기
              </button>
            </div>
          </div>
        ) : (
          /* ───── 입력 화면 ───── */
          <div style={{ marginTop: 'clamp(26px, 5vh, 44px)' }}>
            {/* 업로드 프레임 ('담기' 은유) — 픽셀아트 박스 */}
            <div
              className={`pixel-box${files.length ? ' filled' : ''}`}
              style={{
                padding: 'clamp(20px, 5vw, 36px)',
                minHeight: 'clamp(300px, 52vh, 480px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* 카메라 뷰파인더식 ㄱ자 코너 마크 */}
              <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
              {files.length === 0 ? (
                <>
                  {/* 박스·가구·비정형 화물 — 다양한 짐을 추정한다는 의미 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(16px, 5vw, 30px)' }}>
                    <Package color={BLUE} strokeWidth={1.6} style={{ width: 'clamp(38px, 11vw, 58px)', height: 'clamp(38px, 11vw, 58px)' }} />
                    <Sofa color={BLUE} strokeWidth={1.6} style={{ width: 'clamp(38px, 11vw, 58px)', height: 'clamp(38px, 11vw, 58px)' }} />
                    <Shapes color={BLUE} strokeWidth={1.6} style={{ width: 'clamp(38px, 11vw, 58px)', height: 'clamp(38px, 11vw, 58px)' }} />
                  </div>
                  <p style={{ marginTop: 'clamp(16px, 2.4vh, 24px)', fontSize: 'clamp(17px, 4.6vw, 22px)', fontWeight: 800, color: INK, textAlign: 'center' }}>여기에 짐 사진을 담아주세요</p>
                  <p style={{ marginTop: 8, fontSize: 'clamp(12px, 3.2vw, 14px)', color: GRAY, textAlign: 'center' }}>최대 {MAX_IMAGES}장 · 모바일은 카메라 촬영도 가능</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{ marginTop: 'clamp(20px, 3vh, 30px)', minHeight: 52, padding: 'clamp(14px, 4vw, 18px) clamp(30px, 9vw, 48px)', background: YELLOW, color: INK, border: 'none', borderRadius: 4, fontSize: 'clamp(15px, 4.2vw, 18px)', fontWeight: 800, cursor: 'pointer' }}
                  >
                    사진 올리기
                  </button>
                </>
              ) : (
                <>
                  <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(8px, 2.5vw, 14px)' }}>
                    {previews.map((src, i) => (
                      <div key={i} style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 4, overflow: 'hidden', border: '1px solid #E5E4DF' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`담은 사진 ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          onClick={() => removeFile(i)}
                          aria-label="사진 빼기"
                          style={{ position: 'absolute', top: 3, right: 3, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(10,10,10,0.65)', color: '#fff', fontSize: 13, lineHeight: '22px', cursor: 'pointer', padding: 0 }}
                        >✕</button>
                      </div>
                    ))}
                    {files.length < MAX_IMAGES && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{ aspectRatio: '1 / 1', borderRadius: 4, border: `1.5px dashed ${BLUE}`, background: '#F4F6FF', color: BLUE, fontSize: 26, fontWeight: 700, cursor: 'pointer' }}
                      >+</button>
                    )}
                  </div>
                  <p style={{ marginTop: 14, fontSize: 13, color: '#55554F', fontWeight: 700, alignSelf: 'flex-start' }}>{files.length} / {MAX_IMAGES}장 담음</p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={e => addFiles(e.target.files)}
              style={{ display: 'none' }}
            />

            {/* A4 촬영 가이드 (아코디언) */}
            <button
              onClick={() => setGuideOpen(v => !v)}
              aria-expanded={guideOpen}
              style={{
                marginTop: 'clamp(18px, 3vh, 28px)', width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                background: guideOpen ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.09)',
                border: '1px solid rgba(255,255,255,0.38)',
                borderRadius: 4, cursor: 'pointer', textAlign: 'left',
                padding: '15px 16px',
              }}
            >
              <span style={{ fontSize: 'clamp(14px, 3.8vw, 15.5px)', fontWeight: 800, color: '#fff', lineHeight: 1.4 }}>
                📄 정확한 추정을 위해 A4 용지를 함께 찍어주세요
              </span>
              <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: '50%', background: YELLOW, color: INK, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, transform: guideOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
            </button>
            {guideOpen && (
              <div style={{ marginTop: 6, background: '#fff', border: '1px solid #E5E4DF', borderRadius: 4, padding: '14px 16px', fontSize: 13, color: '#3A3A37', lineHeight: 1.8 }}>
                <p>① A4 용지 한 장을 준비하세요.</p>
                <p>② 보관할 물건의 정면에 A4를 붙이거나 기대 세워주세요. (평평하게 밀착)</p>
                <p>③ 물건 전체와 A4가 한 화면에 들어오게 정면에 가깝게 찍으세요.</p>
                <p>④ 물건이 여러 개면 각 물건마다 A4를 붙여 따로 찍어주세요.</p>
                <p style={{ marginTop: 6, color: GRAY }}>※ A4 없이도 추정되지만 범위가 넓어지고 정확도가 떨어져요.</p>
              </div>
            )}

            {/* 보조 입력 (아코디언) */}
            <button
              onClick={() => setAuxOpen(v => !v)}
              aria-expanded={auxOpen}
              style={{
                marginTop: 'clamp(10px, 1.6vh, 16px)', width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                background: auxOpen ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.09)',
                border: '1px solid rgba(255,255,255,0.38)',
                borderRadius: 4, cursor: 'pointer', textAlign: 'left',
                padding: '15px 16px',
              }}
            >
              <span style={{ fontSize: 'clamp(14px, 3.8vw, 15.5px)', fontWeight: 800, color: '#fff', lineHeight: 1.4 }}>
                ⚙️ 더 정확하게 하려면
              </span>
              <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: '50%', background: YELLOW, color: INK, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, transform: auxOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
            </button>
            {auxOpen && (
              <div style={{ marginTop: 6, background: '#fff', border: '1px solid #E5E4DF', borderRadius: 4, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700 }}>A4 용지를 함께 찍었어요</span>
                  <button
                    onClick={() => setA4(v => !v)}
                    aria-pressed={a4Attached}
                    style={{ width: 52, height: 28, borderRadius: 100, border: 'none', cursor: 'pointer', background: a4Attached ? BLUE : '#D6D5CE', position: 'relative', transition: 'background 0.2s' }}
                  >
                    <span style={{ position: 'absolute', top: 3, left: a4Attached ? 27 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </button>
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#5C5C57' }}>크기 힌트 (선택)</label>
                  <input
                    type="text"
                    value={sizeHint}
                    onChange={e => setSizeHint(e.target.value)}
                    placeholder="예) 안마의자 높이 1m 정도"
                    style={{ marginTop: 6, width: '100%', padding: '11px 12px', border: '1px solid #D6D5CE', borderRadius: 4, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#5C5C57' }}>보관 물품 설명 (선택)</label>
                  <input
                    type="text"
                    value={itemDesc}
                    onChange={e => setItemDesc(e.target.value)}
                    placeholder="예) 안마의자, 이사박스 3개, 의자"
                    style={{ marginTop: 6, width: '100%', padding: '11px 12px', border: '1px solid #D6D5CE', borderRadius: 4, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}

            {/* 에러 */}
            {error && (
              <p style={{ marginTop: 14, background: '#fff', borderRadius: 4, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontWeight: 700, lineHeight: 1.5 }}>{error}</p>
            )}

            {/* 실행 / 로딩 */}
            {loading ? (
              <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
                <div className="spin" />
                <p style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>씬박스에 짐을 담는 중…</p>
                <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)' }}>AI가 사진을 분석하고 있어요. 최대 1분 정도 걸릴 수 있어요.</p>
              </div>
            ) : (
              <button
                onClick={submit}
                disabled={files.length === 0}
                style={{
                  marginTop: 'clamp(24px, 4vh, 36px)',
                  width: '100%',
                  minHeight: 56,
                  padding: 'clamp(17px, 2.4vh, 21px) 0',
                  // 같은 노란 계열에서 밝기/선명도로 활성/비활성 구분 (회색 미사용)
                  background: files.length === 0 ? '#E9D88A' : YELLOW,
                  color: files.length === 0 ? 'rgba(10,10,10,0.45)' : INK,
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 'clamp(16px, 4.4vw, 19px)',
                  fontWeight: 800,
                  cursor: files.length === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: files.length === 0 ? 'none' : '0 10px 30px rgba(255,212,0,0.55)',
                }}
              >
                내 짐 부피 확인하기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

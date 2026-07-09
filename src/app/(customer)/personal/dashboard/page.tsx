"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Menu, LogOut, Package, PackageOpen, X,
  MessageCircle, ChevronRight, CalendarClock,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE  = "#2563EB";
const GREEN = "#10B981";
const KAKAO_CHAT_URL = "http://pf.kakao.com/_ngBCX/chat";

type Client = { name: string };
type Subscription = {
  id: string;
  plan_type: string | null;   // '3month' | '1month'
  unit_count: number;
  monthly_fee: number;
  next_payment_date: string | null;
  start_date: string | null;
  status: string;
};
type ReqRow = {
  id: string;
  request_type: string;
  retrieval_type: string | null;
  unit_count: number | null;
  status: string;
  created_at: string;
};

const daysUntil = (d: string | null) => {
  if (!d) return 999;
  const target = new Date(d); target.setHours(0,0,0,0);
  const t = new Date(); t.setHours(0,0,0,0);
  return Math.round((target.getTime() - t.getTime()) / 86400000);
};

const fmtDate = (d: string) => {
  const date = new Date(d);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

const statusLabel: Record<string, string> = {
  requested: "접수됨",
  confirmed: "처리 중",
  paid: "결제 완료",
  completed: "완료",
  cancelled: "취소됨",
};

export default function PersonalDashboardPage() {
  const router = useRouter();

  const [client, setClient]       = useState<Client | null>(null);
  const [subs, setSubs]           = useState<Subscription[]>([]);
  const [requests, setRequests]   = useState<ReqRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<{ id: string } | null>(null); // 대기 예약
  const [renewingSub, setRenewingSub] = useState<string | null>(null); // 연장 신청 중
  const [renewHistory, setRenewHistory] = useState<any[]>([]); // 연장 이력

  const requestRenewal = async (sub: Subscription, period: '3month' | '1month') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const fee = period === '3month' ? 33000 : 44000;
    const label = period === '3month' ? '3개월 약정 연장' : '1개월 연장';
    if (!window.confirm(`${label} (월 ${fee.toLocaleString()}원)을 신청하시겠어요?\n\n신청하시면 담당자가 결제 링크를 보내드립니다.`)) return;
    setRenewingSub(sub.id);
    const { error } = await supabase.from('personal_requests').insert({
      client_id: user.id,
      request_type: 'renewal',
      plan_type: period,
      unit_count: sub.unit_count,
      amount: fee,
      address_detail: '연장 신청 (기존 보관)',
      status: 'requested',
    });
    setRenewingSub(null);
    if (error) { alert('신청 실패: ' + error.message); return; }
    alert('✅ 연장 신청이 접수되었습니다.\n담당자가 결제 링크를 보내드릴 예정입니다.');
  };

  const handleLogout = async () => {
    if (!window.confirm("로그아웃 하시겠어요?")) return;
    await supabase.auth.signOut();
    router.push("/");
  };

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }

      const { data: clientData } = await supabase
        .from("clients").select("name, contact_phone").eq("id", user.id).single();
      if (!clientData?.contact_phone) { router.push("/personal/onboarding"); return; }
      if (clientData) setClient({ name: clientData.name });

      // 내 전화번호로 대기 중인 예약(pending_bookings) 검사
      const phoneNorm = (clientData.contact_phone ?? "").replace(/\D/g, "");
      if (phoneNorm) {
        const { data: pending } = await supabase
          .from("pending_bookings")
          .select("id")
          .eq("phone", phoneNorm)
          .eq("status", "waiting")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (pending) setPendingBooking(pending);
      }

      const { data: subData } = await supabase
        .from("personal_subscriptions")
        .select("id, plan_type, unit_count, monthly_fee, next_payment_date, start_date, status")
        .eq("client_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: true });
        if (subData) setSubs(subData as Subscription[]);

        const { data: histData } = await supabase
          .from("subscription_renewals")
          .select("subscription_id, period_months, amount, renewed_at, prev_next_payment, new_next_payment, created_at")
          .eq("client_id", user.id)
          .order("created_at", { ascending: false });
        if (histData) setRenewHistory(histData);

      const { data: reqData } = await supabase
        .from("personal_requests")
        .select("id, request_type, retrieval_type, unit_count, status, created_at")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (reqData) setRequests(reqData as ReqRow[]);

      setIsLoading(false);
    }
    fetchData();
  }, []);

  const totalUnits = subs.reduce((sum, s) => sum + (s.unit_count ?? 0), 0);

  const quickActions = [
    { id: "store", icon: Package, label: "보관 예약", sub: "롤테이너 신청하고 짐 맡기기", grad: "linear-gradient(135deg, #2563EB, #1D4ED8)", shadow: "rgba(37,99,235,0.35)", route: "/personal/booking" },
    { id: "out", icon: PackageOpen, label: "반출 신청", sub: "보관 중인 짐 찾기", grad: "linear-gradient(135deg, #10B981, #059669)", shadow: "rgba(16,185,129,0.35)", route: "/personal/retrieval" },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center" style={{ background: "#F0F7F4" }}>
        <p className="animate-pulse text-[14px] font-bold" style={{ color: "#94A3B8" }}>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#F0F7F4", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }} className="flex justify-center">
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100vh", position: "relative", paddingBottom: 100 }}>

        {/* 헤더 */}
        <header style={{ background: "#fff", borderBottom: "0.5px solid #D1E8DF" }} className="sticky top-0 z-50 flex items-center justify-between px-5 py-4">
          <button style={{ color: "#374151" }} onClick={() => setDrawerOpen(true)}>
            <Menu size={22} strokeWidth={1.5} />
          </button>
          <span onClick={() => router.push("/personal")} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: "#0A0A0A", letterSpacing: "-0.5px", fontFamily: "'Archivo','Apple SD Gothic Neo',sans-serif" }}>SCENE</span>
            <span style={{ width: 15, height: 15, border: "2.5px solid #0A0A0A", borderRadius: 2, display: "inline-block" }} />
            <span style={{ fontSize: 18, fontWeight: 900, color: "#0A0A0A", letterSpacing: "-0.5px", fontFamily: "'Archivo','Apple SD Gothic Neo',sans-serif" }}>BOX</span>
          </span>
          <button style={{ color: "#374151" }} onClick={handleLogout}>
            <LogOut size={22} strokeWidth={1.5} />
          </button>
        </header>

        {/* 드로어 */}
        {drawerOpen && (
          <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,10,10,0.45)", backdropFilter: "blur(2px)", display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 430, position: "relative" }}>
              <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 270, background: "#fff", boxShadow: "4px 0 24px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px", borderBottom: "0.5px solid #E5E7EB" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: "#0A0A0A", fontFamily: "'Archivo','Apple SD Gothic Neo',sans-serif" }}>SCENE</span>
                    <span style={{ width: 13, height: 13, border: "2.5px solid #0A0A0A", borderRadius: 2, display: "inline-block" }} />
                    <span style={{ fontSize: 16, fontWeight: 900, color: "#0A0A0A", fontFamily: "'Archivo','Apple SD Gothic Neo',sans-serif" }}>BOX</span>
                  </span>
                  <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
                    <X size={20} strokeWidth={1.8} />
                  </button>
                </div>
                <div style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", gap: 2 }}>
                  <button onClick={() => { setDrawerOpen(false); router.push("/personal/booking"); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px", background: "none", border: "none", borderRadius: 12, cursor: "pointer", textAlign: "left", width: "100%" }}>
                    <Package size={20} color="#374151" strokeWidth={1.6} />
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>보관 예약</span>
                  </button>
                  <button onClick={() => { setDrawerOpen(false); router.push("/personal/retrieval"); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px", background: "none", border: "none", borderRadius: 12, cursor: "pointer", textAlign: "left", width: "100%" }}>
                    <PackageOpen size={20} color="#374151" strokeWidth={1.6} />
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>반출 신청</span>
                  </button>
                  <button onClick={() => { setDrawerOpen(false); router.push("/personal/onboarding"); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px", background: "none", border: "none", borderRadius: 12, cursor: "pointer", textAlign: "left", width: "100%" }}>
                    <CalendarClock size={20} color="#374151" strokeWidth={1.6} />
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>내 정보 수정</span>
                  </button>
                </div>
                <div style={{ padding: "12px", borderTop: "0.5px solid #E5E7EB" }}>
                  <button onClick={() => { setDrawerOpen(false); handleLogout(); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px", background: "none", border: "none", borderRadius: 12, cursor: "pointer", textAlign: "left", width: "100%" }}>
                    <LogOut size={20} color="#EF4444" strokeWidth={1.6} />
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#EF4444" }}>로그아웃</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

<div className="flex flex-col gap-4 px-4" style={{ paddingTop: 40 }}>
        {pendingBooking && (
          <div
            onClick={() => router.push(`/personal/confirm-booking?id=${pendingBooking.id}`)}
            style={{
              background: "linear-gradient(135deg, #2563EB, #3B82F6)",
              borderRadius: 16, padding: "16px 18px", cursor: "pointer",
              boxShadow: "0 4px 16px rgba(37,99,235,0.3)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 3 }}>
                📦 {client?.name ? `${client.name}님, ` : ""}준비된 예약이 있어요
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
                전화로 협의하신 예약을 확인하고 동의해주세요
              </p>
            </div>
            <span style={{ fontSize: 20, color: "#fff", flexShrink: 0, marginLeft: 12 }}>→</span>
          </div>
        )}

          {/* 인사 + 총 보관 현황 요약 */}
          <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 1px 12px rgba(0,0,0,0.05)", padding: "20px" }}>
            <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 4, fontWeight: 500 }}>나의 보관 현황</p>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: "#0F172A", lineHeight: 1.3, marginBottom: 16 }}>
              {client?.name ?? "고객"} 님,<br />환영합니다 👋
            </h2>

            <div style={{ background: "#F0F7F4", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#64748B" }}>총 보관 중인 롤테이너</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: subs.length > 0 ? "#0F172A" : "#94A3B8" }}>
                {subs.length > 0 ? `${totalUnits}칸` : "보관 내역 없음"}
              </span>
            </div>
          </div>

          {/* 구독별 카드 (plan_type별로 분리 표시) */}
          {subs.map((s) => {
            const is1m = s.plan_type === "1month";
            return (
              <div key={s.id} style={{ background: "#fff", borderRadius: 18, boxShadow: "0 1px 12px rgba(0,0,0,0.05)", padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN, display: "inline-block" }} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                      {is1m ? "1개월 이용" : "3개월 약정"}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{s.unit_count}칸</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    {s.start_date && (
                      <>
                        <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>최초 계약일</p>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6 }}>{fmtDate(s.start_date)}</p>
                      </>
                    )}
                    <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>{is1m ? "이용 만료일" : "약정 갱신 예정일"}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{s.next_payment_date ? fmtDate(s.next_payment_date) : "—"}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>이용 요금제</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: BLUE }}>
                      {is1m ? "칸당 44,000원" : "칸당 33,000원"}
                    </p>
                  </div>
                </div>

                {daysUntil(s.next_payment_date) <= 10 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F1F5F9" }}>
                    <p style={{ fontSize: 12, color: "#EA580C", fontWeight: 600, marginBottom: 8 }}>
                      ⏰ {daysUntil(s.next_payment_date) <= 0 ? "만료되었습니다" : `만료 ${daysUntil(s.next_payment_date)}일 전`} · 연장하시겠어요?
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => requestRenewal(s, '3month')} disabled={renewingSub === s.id}
                        style={{ flex: 1, background: BLUE, color: "#fff", border: "none", borderRadius: 12, padding: "12px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        3개월 연장
                        <span style={{ display: "block", fontSize: 10, opacity: 0.85, fontWeight: 400, marginTop: 2 }}>월 33,000원</span>
                      </button>
                      <button onClick={() => requestRenewal(s, '1month')} disabled={renewingSub === s.id}
                        style={{ flex: 1, background: "#6366F1", color: "#fff", border: "none", borderRadius: 12, padding: "12px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        1개월 연장
                        <span style={{ display: "block", fontSize: 10, opacity: 0.85, fontWeight: 400, marginTop: 2 }}>44,000원·반출무료</span>
                      </button>
                      </div>
                  </div>
                )}

                {/* 연장 이력 (이 구독의 것만, 최신순) */}
                {(() => {
                  const hist = renewHistory.filter((h) => h.subscription_id === s.id);
                  if (hist.length === 0) return null;
                  return (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F1F5F9" }}>
                      <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginBottom: 8 }}>📋 연장 이력</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {hist.map((h, i) => {
                          const p = h.period_months === 3 ? "3개월 연장" : "1개월 연장";
                          const rDate = h.renewed_at ? fmtDate(h.renewed_at) : (h.created_at ? fmtDate(h.created_at) : "-");
                          const prevDate = h.prev_next_payment ? fmtDate(h.prev_next_payment) : "-";
                          const eDate = h.new_next_payment ? fmtDate(h.new_next_payment) : "-";
                          return (
                            <div key={i} style={{ fontSize: 12 }}>
                              <p style={{ color: "#374151", fontWeight: 600 }}>· {p} · 칸당 월 {(h.amount || 0).toLocaleString()}원</p>
                              <p style={{ color: "#94A3B8", fontSize: 11, marginLeft: 10 }}>연장일 {rDate} · 만료 {prevDate} → {eDate}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}

          {/* 빠른 액션 */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", marginBottom: 10, paddingLeft: 2, letterSpacing: "0.5px" }}>신청하기</p>
            <div className="flex flex-col gap-3">
              {quickActions.map(({ id, icon: Icon, label, sub: subtitle, grad, shadow, route }) => (
                <button key={id} onClick={() => router.push(route)} style={{ background: grad, borderRadius: 18, padding: "18px", boxShadow: `0 6px 18px ${shadow}`, border: "none", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", textAlign: "left", width: "100%" }}>
                  <div style={{ width: 50, height: 50, borderRadius: 14, background: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={24} color="#fff" strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 3 }}>{label}</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>{subtitle}</p>
                  </div>
                  <ChevronRight size={20} color="rgba(255,255,255,0.7)" strokeWidth={2} />
                </button>
              ))}
            </div>
          </div>

          {/* 최근 활동 */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", marginBottom: 12, paddingLeft: 2, letterSpacing: "0.5px" }}>최근 신청 내역</p>
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 8px rgba(0,0,0,0.05)", overflow: "hidden" }}>
              {requests.length === 0 ? (
                <p style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: "#94A3B8" }}>신청 내역이 없습니다.</p>
              ) : (
                requests.map((r, i) => {
                  const isStorage = r.request_type === "storage";
                  const title = isStorage
                    ? `롤테이너 보관 ${r.unit_count ?? ""}칸`
                    : `짐 반출 (${r.retrieval_type === "oncall" ? "수시" : r.retrieval_type === "parcel" ? "택배" : "정기"})`;
                  return (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: i < requests.length - 1 ? "0.5px solid #F0F7F4" : "none" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: isStorage ? "#EFF6FF" : "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {isStorage ? <Package size={16} color={BLUE} strokeWidth={1.5} /> : <PackageOpen size={16} color={GREEN} strokeWidth={1.5} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{title}</p>
                        <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{fmtDate(r.created_at)}</p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B", background: "#F1F5F9", padding: "3px 9px", borderRadius: 99 }}>{statusLabel[r.status] ?? r.status}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 카카오 문의 */}
          <div style={{ background: "#FFFDF0", borderRadius: 18, border: "1px solid #FDE68A", padding: "18px" }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#1A1A1A", marginBottom: 6 }}>💡 변경·취소 문의</p>
            <p style={{ fontSize: 12, color: "#78716C", lineHeight: 1.7, marginBottom: 14 }}>
              예약 변경, 취소, 기타 궁금한 점은 카카오톡으로 빠르게 도와드려요.
            </p>
            <button onClick={() => window.open(KAKAO_CHAT_URL, "_blank")} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: "#FEE500", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <MessageCircle size={17} color="#191600" strokeWidth={2} fill="#191600" />
              <span style={{ fontSize: 14, fontWeight: 800, color: "#191600" }}>카카오톡 1:1 문의하기</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
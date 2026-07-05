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
  plan_type: string | null;
  unit_count: number;
  monthly_fee: number;
  next_payment_date: string | null;
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

const fmtDate = (d: string) => {
  const date = new Date(d);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};
const getDday = (d: string) =>
  Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

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
  const [sub, setSub]             = useState<Subscription | null>(null);
  const [requests, setRequests]   = useState<ReqRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

      const { data: subData } = await supabase
        .from("personal_subscriptions")
        .select("plan_type, unit_count, monthly_fee, next_payment_date, status")
        .eq("client_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      if (subData) setSub(subData as Subscription);

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

  const dday = sub?.next_payment_date ? getDday(sub.next_payment_date) : null;

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

        <div className="flex flex-col gap-4 px-4" style={{ paddingTop: 20 }}>

          {/* 보관 현황 카드 */}
          <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 1px 12px rgba(0,0,0,0.05)", padding: "20px" }}>
            <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 4, fontWeight: 500 }}>나의 보관 현황</p>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: "#0F172A", lineHeight: 1.3, marginBottom: 16 }}>
              {client?.name ?? "고객"} 님,<br />환영합니다 👋
            </h2>

            <div style={{ background: "#F0F7F4", borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
              <div className="mb-3 flex items-center justify-between">
              <span style={{ fontSize: 12, color: "#64748B" }}>보관 중인 롤테이너</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
              {sub ? `${sub.unit_count}칸 보관 중` : "보관 내역 없음"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", borderRadius: 10, padding: "10px 14px", border: "0.5px solid #D1E8DF" }}>
                <div className="flex items-center gap-2">
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: sub ? GREEN : "#D1D5DB", display: "inline-block" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{sub ? "이용 중" : "미이용"}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: BLUE, background: "#EFF6FF", padding: "3px 10px", borderRadius: 99 }}>
                  {dday !== null ? `결제 D-${dday}` : "—"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>
                  {sub?.plan_type === "1month" ? "이용 만료일" : "약정 갱신 예정일"}
                </p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{sub?.next_payment_date ? fmtDate(sub.next_payment_date) : "—"}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>이용 요금제</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: BLUE }}>
                  {sub
                    ? sub.plan_type === "1month"
                      ? "1개월 · 칸당 44,000원"
                      : "3개월 약정 · 칸당 33,000원"
                    : "—"}
                </p>
              </div>
            </div>
          </div>

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
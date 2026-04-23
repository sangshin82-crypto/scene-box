"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Menu, Bell, Package, Truck, Scale,
  CheckCircle2, CalendarClock, Trash2,
  ChevronRight, MessageCircle,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE   = "#2563EB";
const GREEN  = "#10B981";
const PURPLE = "#7C3AED";
const KAKAO_CHAT_URL = "http://pf.kakao.com/_ngBCX/chat";

type Client = { name: string; };
type Space = {
  grid_id: string;
  monthly_fee: number;
  end_date: string;
  grids: { grid_number: string; zone: string }[] | null;
};
type Activity = {
  id: string;
  type: "transport" | "disposal" | "inventory";
  badge: string;
  badgeBg: string;
  badgeColor: string;
  title: string;
  time: string;
  icon: React.ElementType;
  color: string;
  route: string;
};

const fmtDate = (d: string) => {
  const date = new Date(d);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

const getDday = (endDate: string) =>
  Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

export default function DashboardPage() {
  const router = useRouter();

  const [client, setClient]           = useState<Client | null>(null);
  const [spaces, setSpaces]           = useState<Space[]>([]);
  const [activities, setActivities]   = useState<Activity[]>([]);
  const [monthlyBill, setMonthlyBill] = useState<number>(0);
  const [nextPayDate, setNextPayDate] = useState<string>("");
  const [isLoading, setIsLoading]     = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }

      const { data: phoneData } = await supabase
        .from("clients")
        .select("contact_phone")
        .eq("id", user.id)
        .single();

      if (!phoneData?.contact_phone) {
        router.push("/onboarding");
        return;
      }

      const name = user.user_metadata?.name ?? user.user_metadata?.full_name ?? "이름 없음";
      const isNew = user.created_at === user.last_sign_in_at;
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: isNew
            ? `🆕 <b>신규 고객 가입!</b>\n\n👤 이름: ${name}\n🕐 가입일: ${new Date().toLocaleDateString("ko-KR")}`
            : `🔄 <b>기존 고객 로그인</b>\n\n👤 이름: ${name}\n🕐 로그인: ${new Date().toLocaleDateString("ko-KR")}`
        }),
      });

      const clientId = user.id;

      const { data: clientData } = await supabase
        .from("clients").select("name").eq("id", clientId).single();
      if (clientData) setClient(clientData);

      const { data: spacesData } = await supabase
        .from("spaces")
        .select("grid_id, monthly_fee, end_date, grids(grid_number, zone)")
        .eq("client_id", clientId)
        .eq("status", "active");

      if (spacesData?.length) {
        setSpaces(spacesData as unknown as Space[]);
        setMonthlyBill(spacesData.reduce((sum: number, s: any) => sum + s.monthly_fee, 0));
        if (spacesData[0]?.end_date) setNextPayDate(spacesData[0].end_date);
      }

      const { data: transports } = await supabase
        .from("transport_requests")
        .select("id, truck_type, scheduled_at, status")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(2);

      const { data: disposals } = await supabase
        .from("disposal_requests")
        .select("id, total_charge, created_at, status")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(2);

      const { data: items } = await supabase
        .from("inventory_items")
        .select("id, name, stored_at")
        .eq("client_id", clientId)
        .order("stored_at", { ascending: false })
        .limit(2);

      const acts: Activity[] = [];
      transports?.forEach(t => acts.push({
        id: t.id, type: "transport",
        badge: "배차 예약", badgeBg: "#EFF6FF", badgeColor: BLUE,
        icon: CalendarClock, color: BLUE,
        title: `${t.truck_type} 트럭`, time: fmtDate(t.scheduled_at), route: "/transport",
      }));
      disposals?.forEach(d => acts.push({
        id: d.id, type: "disposal",
        badge: "폐기 정산", badgeBg: "#FFFBEB", badgeColor: "#D97706",
        icon: Trash2, color: "#F59E0B",
        title: d.total_charge ? `${d.total_charge.toLocaleString()}원` : "정산 대기 중",
        time: fmtDate(d.created_at), route: "/disposal",
      }));
      items?.forEach(it => acts.push({
        id: it.id, type: "inventory",
        badge: "입고 완료", badgeBg: "#ECFDF5", badgeColor: GREEN,
        icon: CheckCircle2, color: GREEN,
        title: it.name, time: fmtDate(it.stored_at), route: "/inventory",
      }));

      setActivities(acts.slice(0, 3));
      setIsLoading(false);
    }
    fetchDashboard();
  }, []);

  const zoneLabel = spaces[0]?.grids?.[0]?.zone ? `${spaces[0].grids[0].zone}존` : "";
  const gridCount = spaces.length;
  const dday      = nextPayDate ? getDday(nextPayDate) : null;

  const quickActions = [
    { id: "store", icon: Package, label: "공간 예약", sub: "그리드 선택 및 보관 공간 예약", color: BLUE,   bg: "#EFF6FF", route: "/booking"   },
    { id: "truck", icon: Truck,   label: "차량 배차", sub: "픽업·납품 차량 즉시 신청",     color: GREEN,  bg: "#ECFDF5", route: "/transport" },
    { id: "scale", icon: Scale,   label: "폐기 요청", sub: "폐기물 처리 및 정산 신청",     color: PURPLE, bg: "#F5F3FF", route: "/disposal"  },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center" style={{ background: "#F0F7F4" }}>
        <p className="animate-pulse text-[14px] font-bold" style={{ color: "#94A3B8" }}>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#F0F7F4", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}
      className="flex justify-center">
      <div style={{ width: "100%", maxWidth: 430, background: "#F0F7F4", minHeight: "100vh", position: "relative", paddingBottom: 100 }}>

        {/* 헤더 */}
        <header style={{ background: "#fff", borderBottom: "0.5px solid #D1E8DF" }}
          className="sticky top-0 z-50 flex items-center justify-between px-5 py-4">
          <button className="rounded-lg p-1" style={{ color: "#374151" }}>
            <Menu size={22} strokeWidth={1.5} />
          </button>
          <span style={{ fontSize: 19, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.5px" }}>
            Scene<span style={{ color: BLUE }}>Box</span>
          </span>
          <button className="relative rounded-lg p-1" style={{ color: "#374151" }}>
            <Bell size={22} strokeWidth={1.5} />
            <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: "#EF4444", border: "1.5px solid #F0F7F4" }} />
          </button>
        </header>

        <div className="flex flex-col gap-4 px-4" style={{ paddingTop: 52 }}>

          {/* 보관 현황 카드 */}
          <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 1px 12px rgba(0,0,0,0.05)", padding: "20px" }}>
            <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 4, fontWeight: 500 }}>나의 보관 현황</p>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: "#0F172A", marginBottom: 16, lineHeight: 1.3 }}>
              {client?.name ?? "고객"} 님,<br />환영합니다 👋
            </h2>

            <div style={{ background: "#F0F7F4", borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
              <div className="mb-3 flex items-center justify-between">
                <span style={{ fontSize: 12, color: "#64748B" }}>이용 중인 공간</span>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                    {gridCount > 0 ? `${zoneLabel} — ${gridCount} Grid` : "계약 없음"}
                  </span>
                  {gridCount > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: `linear-gradient(90deg, ${BLUE}, #3B82F6)`, padding: "3px 8px", borderRadius: 99, whiteSpace: "nowrap" }}>
                      최대 높이 10m
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", borderRadius: 10, padding: "10px 14px", border: "0.5px solid #D1E8DF" }}>
                <div className="flex items-center gap-2">
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: gridCount > 0 ? GREEN : "#D1D5DB", display: "inline-block", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                    {gridCount > 0 ? "장기 구독 중" : "계약 없음"}
                  </span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: BLUE, background: "#EFF6FF", padding: "3px 10px", borderRadius: 99 }}>
                  {dday !== null ? `결제 D-${dday}` : "—"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>다음 결제일</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                  {nextPayDate ? fmtDate(nextPayDate) : "—"}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>예상 청구액</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: BLUE }}>
                  {monthlyBill > 0 ? `${monthlyBill.toLocaleString()}원` : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* 퀵 액션 */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", marginBottom: 10, paddingLeft: 2, letterSpacing: "0.5px" }}>QUICK ACTION</p>
            <div className="flex flex-col gap-2">
              {quickActions.map(({ id, icon: Icon, label, sub, color, bg, route }) => (
                <button key={id} onClick={() => router.push(route)}
                  style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)", border: "none", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left", width: "100%" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={20} color={color} strokeWidth={1.5} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: color, marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 11, color: "#94A3B8" }}>{sub}</p>
                  </div>
                  <ChevronRight size={16} color="#CBD5E1" strokeWidth={1.5} />
                </button>
              ))}
            </div>
          </div>

          {/* 최근 활동 */}
          <div>
            <div className="mb-3 flex items-center justify-between" style={{ paddingLeft: 2 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.5px" }}>최근 활동</p>
              <button style={{ fontSize: 12, color: BLUE, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
                onClick={() => router.push("/inventory")}>전체보기</button>
            </div>
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 8px rgba(0,0,0,0.05)", overflow: "hidden" }}>
              {activities.length === 0 ? (
                <p style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: "#94A3B8" }}>최근 활동이 없습니다.</p>
              ) : (
                activities.map(({ id, icon: Icon, color, badge, badgeBg, badgeColor, title, time, route }, i) => (
                  <button key={id} onClick={() => router.push(route)}
                    style={{ width: "100%", textAlign: "left", background: "none", border: "none", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: i < activities.length - 1 ? "0.5px solid #F0F7F4" : "none", cursor: "pointer" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: badgeBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={16} color={color} strokeWidth={1.5} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: badgeColor, background: badgeBg, padding: "2px 7px", borderRadius: 99 }}>{badge}</span>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</p>
                      <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{time}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 카카오 안내 카드 */}
          <div style={{ background: "#FFFDF0", borderRadius: 18, border: "1px solid #FDE68A", padding: "18px 18px" }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#1A1A1A", marginBottom: 6 }}>💡 계약 종료 및 예약 변경 안내</p>
            <p style={{ fontSize: 12, color: "#78716C", lineHeight: 1.7, marginBottom: 14 }}>
              보관 계약 종료(짐 빼기) 신청, 배차 시간 변경 등 모든 문의는 카카오톡을 통해 즉시 처리해 드립니다.
            </p>
            <button
              onClick={() => window.open(KAKAO_CHAT_URL, '_blank')}
              style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: "#FEE500", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 2px 8px rgba(254,229,0,0.4)" }}>
              <MessageCircle size={17} color="#191600" strokeWidth={2} fill="#191600" />
              <span style={{ fontSize: 14, fontWeight: 800, color: "#191600" }}>카카오톡 1:1 문의하기</span>
            </button>
          </div>

        </div>

        {/* 플로팅 카카오 버튼 */}
        <button
          onClick={() => window.open(KAKAO_CHAT_URL, '_blank')}
          style={{ position: "fixed", bottom: 84, right: "max(16px, calc(50% - 215px + 16px))", background: "#FEE500", border: "none", borderRadius: 99, padding: "11px 18px", display: "flex", alignItems: "center", gap: 7, cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 90 }}>
          <MessageCircle size={16} color="#191600" strokeWidth={2} fill="#191600" />
          <span style={{ fontSize: 13, fontWeight: 800, color: "#191600", whiteSpace: "nowrap" }}>반출/변경/기타 문의</span>
        </button>

      </div>
    </div>
  );
}
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, X, MapPin, Warehouse, ArrowUpDown,
  Calendar, Clock, Truck, AlertTriangle, Check,
  PersonStanding, UserCheck,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE = "#2563EB";

const TRUCKS = [
  { id: "1t",   label: "1톤 트럭",   sub: "기본 소품" },
  { id: "2.5t", label: "2.5톤 트럭", sub: "중형 세트" },
  { id: "5t",   label: "5톤 윙바디", sub: "대형 세트" },
];

const EXTRA_OPTIONS = [
  {
    id: "porter",
    icon: PersonStanding,
    title: "전문 포터(헬퍼) 추가",
    desc: "기사님과 함께 짐을 나를 추가 인부 1명을 매칭합니다. (해체/철거 불가)",
    price: "+ 150,000원 / 건",
    priceColor: BLUE,
  },
  {
    id: "driver",
    icon: UserCheck,
    title: "기사님 상하차 수작업 지원",
    desc: "기사님께 수작업 지원을 요청합니다. 전문 포터 수준의 작업은 제한될 수 있습니다. (비용 별도 협의)",
    price: "* 비용 별도 문의",
    priceColor: "#9CA3AF",
  },
];

const sendTelegramNotification = async (message: string) => {
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
  } catch (e) {
    console.error("텔레그램 알림 실패:", e);
  }
};

export default function TransportPage() {
  const router = useRouter();
  const [origin, setOrigin]     = useState("");
  const [date, setDate]         = useState("");
  const [time, setTime]         = useState("");
  const [truck, setTruck]       = useState("2.5t");
  const [extraOption, setExtra] = useState<string | null>(null);
  const [note, setNote]         = useState("");
  const [agreed, setAgreed]     = useState(false);
  const [swapped, setSwapped]   = useState(false);
  const [fareOpen, setFareOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = Boolean(origin.trim() && date && time && agreed);

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    const clientId = user?.id ?? "00000000-0000-0000-0000-000000000001";

    const { data: clientData } = await supabase
      .from("clients").select("name").eq("id", clientId).single();
    const clientName = clientData?.name ?? "고객";

    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

    const { error } = await supabase
      .from("transport_requests")
      .insert({
        client_id:      clientId,
        origin_address: origin,
        destination:    "Scene Box 오포 창고",
        scheduled_at:   scheduledAt,
        truck_type:     truck,
        helper_option:  extraOption ?? "none",
        driver_note:    note || null,
        status:         "pending",
      });

    if (error) {
      alert("요청 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } else {
      await sendTelegramNotification(
        `🚛 <b>배차 요청 접수!</b>\n\n` +
        `👤 고객명: ${clientName}\n` +
        `📍 출발지: ${origin}\n` +
        `🚚 차량: ${truck} 트럭\n` +
        `📅 일정: ${date} ${time}\n` +
        `➕ 옵션: ${extraOption ?? "없음"}\n` +
        `📝 전달사항: ${note || "없음"}`
      );
      alert("배차 요청이 완료되었습니다! 관리자가 운임을 확정하면 정산 탭에서 확인하실 수 있습니다.");
      router.push("/dashboard");
    }
    setIsSubmitting(false);
  };

  const originField = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 12, border: "1.5px solid #D1E8DF", padding: "13px 14px" }}>
      <MapPin size={17} color={BLUE} strokeWidth={1.8} style={{ flexShrink: 0 }} />
      <input value={origin} onChange={e => setOrigin(e.target.value)}
        placeholder="출발지 주소를 입력해주세요"
        style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#0F172A", background: "transparent" }} />
    </div>
  );

  const destField = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F0F7F4", borderRadius: 12, border: "1.5px solid #D1E8DF", padding: "13px 14px" }}>
      <Warehouse size={17} color="#94A3B8" strokeWidth={1.8} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 14, color: "#94A3B8", fontWeight: 500 }}>Scene Box 오포 창고</span>
    </div>
  );

  return (
    <div style={{ background: "#F0F7F4", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100vh", paddingBottom: 160 }}>

        {/* 헤더 */}
        <div style={{ background: "#fff", borderBottom: "0.5px solid #D1E8DF", position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px" }}>
          <button type="button" onClick={() => router.back()} style={{ padding: 4, background: "none", border: "none", cursor: "pointer" }}>
            <ChevronLeft size={23} color="#374151" strokeWidth={1.8} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>차량 배차 요청</span>
          <button onClick={() => router.back()} style={{ padding: 4, background: "none", border: "none", cursor: "pointer" }}>
            <X size={21} color="#374151" strokeWidth={1.8} />
          </button>
        </div>

        <div style={{ padding: "56px 16px 0", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* STEP 1 */}
          <section>
            <StepLabel n={1} title="운송 구간 및 일정" />
            <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 1px 12px rgba(0,0,0,0.05)", padding: "18px 16px" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {swapped ? destField : originField}
                <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
                  <button onClick={() => setSwapped(p => !p)}
                    style={{ width: 34, height: 34, borderRadius: "50%", background: "#fff", border: "1.5px solid #D1E8DF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transform: swapped ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s" }}>
                    <ArrowUpDown size={15} color={BLUE} strokeWidth={2} />
                  </button>
                </div>
                {swapped ? originField : destField}
              </div>
              <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#F0F7F4", borderRadius: 12, border: "1.5px solid #D1E8DF", padding: "12px" }}>
                  <Calendar size={15} color="#64748B" strokeWidth={1.8} style={{ flexShrink: 0 }} />
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: date ? "#0F172A" : "#94A3B8", background: "transparent", minWidth: 0 }} />
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#F0F7F4", borderRadius: 12, border: "1.5px solid #D1E8DF", padding: "12px" }}>
                  <Clock size={15} color="#64748B" strokeWidth={1.8} style={{ flexShrink: 0 }} />
                  <input type="time" value={time} onChange={e => setTime(e.target.value)}
                    style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: time ? "#0F172A" : "#94A3B8", background: "transparent", minWidth: 0 }} />
                </div>
              </div>
            </div>
          </section>

          {/* STEP 2 */}
          <section>
            <StepLabel n={2} title="차량 크기 선택" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {TRUCKS.map(({ id, label, sub }) => {
                const active = truck === id;
                return (
                  <button key={id} onClick={() => setTruck(id)}
                    style={{ padding: "16px 8px", borderRadius: 14, border: `2px solid ${active ? BLUE : "#D1E8DF"}`, background: active ? "#EFF6FF" : "#fff", boxShadow: active ? `0 2px 12px ${BLUE}22` : "0 1px 4px rgba(0,0,0,0.04)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "all 0.15s" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: active ? BLUE : "#F0F7F4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Truck size={19} color={active ? "#fff" : "#94A3B8"} strokeWidth={1.6} />
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: active ? BLUE : "#374151", lineHeight: 1.3 }}>{label}</p>
                      <p style={{ fontSize: 11, color: active ? "#60A5FA" : "#94A3B8", marginTop: 2 }}>{sub}</p>
                    </div>
                    {active && (
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: BLUE, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={11} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 운임표 */}
          <section>
            <button onClick={() => setFareOpen(p => !p)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, color: BLUE, fontWeight: 600 }}>📍 권역별 예상 운임표 보기</span>
              <span style={{ fontSize: 11, color: BLUE, transition: "transform 0.2s", display: "inline-block", transform: fareOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
            </button>
            {fareOpen && (
              <div style={{ marginTop: 12, background: "#fff", borderRadius: 14, boxShadow: "0 1px 10px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#EFF6FF" }}>
                      {["권역", "1톤", "2.5톤", "5톤"].map((h, i) => (
                        <th key={h} style={{ padding: "10px 8px", fontWeight: 700, color: BLUE, textAlign: i === 0 ? "left" : "center", borderBottom: "1.5px solid #BFDBFE", paddingLeft: i === 0 ? 16 : 8 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { area: "수도권 A", sub: "서울 남부·성남·용인", t1: "5만", t25: "8만",  t5: "12만" },
                      { area: "수도권 B", sub: "서울 북부·고양·김포", t1: "7만", t25: "10만", t5: "15만" },
                    ].map((row, i) => (
                      <tr key={row.area} style={{ borderBottom: "1px solid #F0F7F4", background: i % 2 === 1 ? "#FAFAFA" : "#fff" }}>
                        <td style={{ padding: "11px 8px 11px 16px" }}>
                          <p style={{ fontWeight: 600, color: "#0F172A", marginBottom: 1 }}>{row.area}</p>
                          <p style={{ fontSize: 11, color: "#94A3B8" }}>{row.sub}</p>
                        </td>
                        {[row.t1, row.t25, row.t5].map((v, j) => (
                          <td key={j} style={{ textAlign: "center", color: "#374151", fontWeight: 600, padding: "11px 8px" }}>{v}</td>
                        ))}
                      </tr>
                    ))}
                    <tr style={{ background: "#F9FAFB" }}>
                      <td style={{ padding: "11px 8px 11px 16px" }}>
                        <p style={{ fontWeight: 600, color: "#0F172A" }}>그 외 경기/지방</p>
                      </td>
                      <td colSpan={3} style={{ textAlign: "center", color: "#94A3B8", fontWeight: 600, fontSize: 13, padding: "11px 8px" }}>별도 문의</td>
                    </tr>
                  </tbody>
                </table>
                <p style={{ fontSize: 11, color: "#94A3B8", padding: "10px 16px 14px", lineHeight: 1.6 }}>
                  * 위 금액은 예상치이며, 실제 거리에 따라 차이가 발생할 수 있습니다.
                </p>
              </div>
            )}
          </section>

          {/* 유료 옵션 */}
          <section>
            <StepLabel n="" title="유료 옵션 선택" sub="(선택)" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {EXTRA_OPTIONS.map(({ id, icon: Icon, title, desc, price, priceColor }) => {
                const active = extraOption === id;
                return (
                  <button key={id} onClick={() => setExtra(active ? null : id)}
                    style={{ background: "#fff", borderRadius: 14, border: `2px solid ${active ? BLUE : "#D1E8DF"}`, padding: "16px 18px", cursor: "pointer", textAlign: "left", boxShadow: active ? `0 2px 12px ${BLUE}22` : "0 1px 6px rgba(0,0,0,0.04)", display: "flex", alignItems: "flex-start", gap: 14, transition: "all 0.15s" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: active ? "#EFF6FF" : "#F0F7F4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={21} color={active ? BLUE : "#94A3B8"} strokeWidth={1.6} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: active ? BLUE : "#0F172A" }}>{title}</p>
                        {active && (
                          <div style={{ width: 18, height: 18, borderRadius: "50%", background: BLUE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Check size={11} color="#fff" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.6, marginBottom: 8 }}>{desc}</p>
                      <span style={{ fontSize: 12, fontWeight: 700, color: priceColor, background: active && id === "porter" ? "#EFF6FF" : "#F0F7F4", padding: "3px 10px", borderRadius: 99, border: `1px solid ${active && id === "porter" ? "#BFDBFE" : "#D1E8DF"}` }}>
                        {price}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* STEP 3 */}
          <section>
            <StepLabel n={3} title="기사님 전달 사항" sub="(선택)" />
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="지하 주차장 진입 불가 등 특이사항을 적어주세요."
              rows={4}
              style={{ width: "100%", borderRadius: 14, border: "1.5px solid #D1E8DF", background: "#fff", padding: "14px 16px", fontSize: 14, color: "#0F172A", resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.6, boxShadow: "0 1px 8px rgba(0,0,0,0.04)", fontFamily: "inherit" }}
            />
          </section>

          {/* STEP 4 */}
          <section>
            <StepLabel n={4} title="필수 확인 사항" />
            <div style={{ background: "#FEF2F2", borderRadius: 16, border: "1.5px solid #FECACA", padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <AlertTriangle size={17} color="#DC2626" strokeWidth={1.8} style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>상하차 전 반드시 확인해주세요</p>
              </div>
              <button onClick={() => setAgreed(p => !p)}
                style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, border: `2px solid ${agreed ? "#DC2626" : "#FCA5A5"}`, background: agreed ? "#DC2626" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                  {agreed && <Check size={12} color="#fff" strokeWidth={3} />}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#991B1B", lineHeight: 1.6 }}>
                    [필수] 차량 도착 전, 모든 세트/구조물은 즉시 싣기만 할 수 있도록 해체 및 포장이 완료되어 있어야 합니다.
                  </p>
                  <p style={{ fontSize: 11, color: "#EF4444", marginTop: 6, lineHeight: 1.6 }}>
                    기사님은 해체 및 철거 작업을 지원하지 않으며, 상하차 대기 시 추가 요금이 발생할 수 있습니다.
                  </p>
                </div>
              </button>
            </div>
          </section>

        </div>

        {/* 하단 버튼 */}
        <div style={{ position: "fixed", bottom: 56, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(240,247,244,0.95)", backdropFilter: "blur(12px)", borderTop: "0.5px solid #D1E8DF", padding: "14px 16px 20px", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)", zIndex: 90 }}>
          <p style={{ textAlign: "center", fontSize: 11, color: "#94A3B8", marginBottom: 10 }}>
            * 운송/작업 비용은 배차 완료 후 확정되며, 정산 탭을 통해 청구/결제가 진행됩니다.
          </p>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            style={{ width: "100%", padding: "15px 0", borderRadius: 14, border: "none", background: canSubmit ? `linear-gradient(90deg, ${BLUE}, #3B82F6)` : "#E5E7EB", color: canSubmit ? "#fff" : "#9CA3AF", fontSize: 15, fontWeight: 700, cursor: canSubmit ? "pointer" : "not-allowed", boxShadow: canSubmit ? `0 4px 16px ${BLUE}55` : "none", transition: "all 0.2s" }}>
            {isSubmitting ? "요청 중..." : canSubmit ? "배차 요청하기" : "필수 항목을 입력해주세요"}
          </button>
        </div>

      </div>
    </div>
  );
}

function StepLabel({ n, title, sub }: { n: number | ""; title: string; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      {n !== "" && (
        <span style={{ width: 22, height: 22, borderRadius: "50%", background: BLUE, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {n}
        </span>
      )}
      <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{title}</span>
      {sub && <span style={{ fontSize: 12, color: "#94A3B8" }}>{sub}</span>}
    </div>
  );
}
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Package, Check } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE = "#2563EB";
const GREEN = "#10B981";
const TERMS_VERSION = "2026-07-10"; // 약관 시행일 = 동의 버전

type Pending = {
  id: string;
  phone: string;
  name: string | null;
  plan_type: string | null;
  unit_count: number;
  amount: number;
  address_detail: string | null;
  memo: string | null;
  status: string;
};

function ConfirmBookingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const pendingId = params.get("id");

  const [pending, setPending] = useState<Pending | null>(null);
  const [clientName, setClientName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }

      const { data: client } = await supabase
        .from("clients").select("name").eq("id", user.id).single();
      if (client?.name) setClientName(client.name);

      if (!pendingId) { setNotFound(true); setIsLoading(false); return; }

      const { data } = await supabase
        .from("pending_bookings")
        .select("*")
        .eq("id", pendingId)
        .eq("status", "waiting")
        .maybeSingle();

      if (!data) { setNotFound(true); setIsLoading(false); return; }
      setPending(data as Pending);
      setIsLoading(false);
    }
    load();
  }, [pendingId]);

  const planLabel = pending?.plan_type === "1month" ? "1개월 이용" : "3개월 약정";
  const unitPrice = pending?.plan_type === "1month" ? "칸당 44,000원" : "칸당 33,000원";

  const handleConfirm = async () => {
    if (!pending) return;
    if (!agreed) { setError("약관에 동의해주세요."); return; }
    setIsSubmitting(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/"); return; }

    const { data: reqRow, error: reqErr } = await supabase
      .from("personal_requests")
      .insert({
        client_id: user.id,
        request_type: "storage",
        plan_type: pending.plan_type,
        unit_count: pending.unit_count,
        address_detail: pending.address_detail ?? "",
        amount: pending.amount,
        memo: pending.memo,
        status: "requested",
      })
      .select("id")
      .single();

    if (reqErr) {
      setError("예약 확정 중 오류가 발생했습니다. 다시 시도해주세요.");
      setIsSubmitting(false);
      return;
    }

    await supabase.from("agreements").insert({
      client_id: user.id,
      terms_version: TERMS_VERSION,
      channel: "phone_confirm",
      request_id: reqRow?.id ?? null,
    });

    await supabase
      .from("pending_bookings")
      .update({ status: "claimed", claimed_at: new Date().toISOString() })
      .eq("id", pending.id);

    alert("예약이 확정되었습니다!\n회사가 지정하는 정기 방문일을 별도로 안내해 드립니다.");
    router.push("/personal/dashboard");
  };

  if (isLoading) {
    return (
      <div style={{ background: "#F0F7F4", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#94A3B8" }}>불러오는 중...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ background: "#F0F7F4", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", padding: "0 24px" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>연결된 예약을 찾을 수 없습니다</p>
          <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7, marginBottom: 20 }}>
            이미 확정되었거나 예약 정보가 없습니다.<br />문제가 계속되면 카카오톡으로 문의해주세요.
          </p>
          <button onClick={() => router.push("/personal/dashboard")}
            style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: BLUE, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            대시보드로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#F0F7F4", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }} className="flex justify-center">
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100vh", paddingBottom: 40 }}>

      <header style={{ background: "#fff", borderBottom: "0.5px solid #D1E8DF", paddingTop: "max(env(safe-area-inset-top), 20px)" }} className="sticky top-0 z-50 flex items-center gap-3 px-5 pb-4">
          <button onClick={() => router.push("/personal/dashboard")} style={{ color: "#374151", background: "none", border: "none", cursor: "pointer" }}>
            <ArrowLeft size={22} strokeWidth={1.8} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>예약 확인</span>
        </header>

        <div className="flex flex-col gap-4" style={{ padding: "24px 16px 20px" }}>

          <div style={{ background: "linear-gradient(135deg, #EFF6FF, #F0F7F4)", borderRadius: 16, padding: "18px", border: "0.5px solid #D1E8DF" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Package size={20} color={BLUE} strokeWidth={2} />
              <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
                {clientName ? `${clientName}님, ` : ""}준비된 예약이 있어요
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: "#64748B", lineHeight: 1.7 }}>
              전화로 협의하신 내용입니다. 아래 내용을 확인하고 약관에 동의하시면 예약이 확정됩니다.
            </p>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 18px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600, marginBottom: 14 }}>예약 내용</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Row label="이용 유형" value={planLabel} />
              <Row label="롤테이너 칸 수" value={`${pending!.unit_count}칸`} />
              <Row label="요금제" value={unitPrice} />
              {pending!.address_detail && <Row label="수거 주소" value={pending!.address_detail} />}
              <div style={{ height: 1, background: "#F0F7F4", margin: "4px 0" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>결제 예정 금액</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: BLUE }}>{pending!.amount.toLocaleString()}원</span>
              </div>
            </div>
            <p style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6, marginTop: 12 }}>
              ※ 실제 금액은 현장에서 칸 수 확정 후 페이앱 링크로 안내·결제됩니다.
            </p>
          </div>

          <div onClick={() => setAgreed((v) => !v)} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#fff", borderRadius: 14, padding: "14px 16px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)", cursor: "pointer" }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, border: agreed ? "none" : "1.5px solid #CBD5E1", background: agreed ? BLUE : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
              {agreed && <Check size={14} color="#fff" strokeWidth={3} />}
            </div>
            <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.6 }}>
              <a href="/personal/terms" target="_blank" onClick={(e) => e.stopPropagation()} style={{ color: BLUE, textDecoration: "underline" }}>이용약관</a>,{" "}
              <a href="/personal/refund" target="_blank" onClick={(e) => e.stopPropagation()} style={{ color: BLUE, textDecoration: "underline" }}>환불규정</a>,{" "}
              <a href="/personal/privacy" target="_blank" onClick={(e) => e.stopPropagation()} style={{ color: BLUE, textDecoration: "underline" }}>개인정보처리방침</a>에 동의합니다.
            </p>
          </div>

          {error && <p style={{ fontSize: 13, color: "#EF4444", textAlign: "center" }}>{error}</p>}

          <button
            onClick={handleConfirm} disabled={isSubmitting || !agreed}
            style={{ width: "100%", padding: "16px 0", borderRadius: 14, border: "none", background: (isSubmitting || !agreed) ? "#E5E7EB" : `linear-gradient(90deg, ${BLUE}, #3B82F6)`, color: (isSubmitting || !agreed) ? "#9CA3AF" : "#fff", fontSize: 16, fontWeight: 700, cursor: (isSubmitting || !agreed) ? "not-allowed" : "pointer" }}>
            {isSubmitting ? "확정 중..." : "동의하고 예약 확정하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 13, color: "#64748B" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{value}</span>
    </div>
  );
}

export default function ConfirmBookingPage() {
  return (
    <Suspense fallback={
      <div style={{ background: "#F0F7F4", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#94A3B8" }}>불러오는 중...</p>
      </div>
    }>
      <ConfirmBookingInner />
    </Suspense>
  );
}

'use client';

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function handleCallback() {
      try {
        // URL에서 paymentId 추출
        const paymentId = searchParams.get("paymentId");
        if (!paymentId) throw new Error("결제 정보를 찾을 수 없습니다.");

        // sessionStorage에서 컨텍스트 복원
        const raw = sessionStorage.getItem("payment_context");
        if (!raw) throw new Error("결제 컨텍스트를 찾을 수 없습니다.");

        const { amount, clientId, grids, uploadedUrl } = JSON.parse(raw);
        sessionStorage.removeItem("payment_context");

        // 백엔드 결제 검증
        const confirmRes = await fetch("/api/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId, amount, clientId, grids, uploadedUrl }),
        });

        if (!confirmRes.ok) {
          const errData = await confirmRes.json();
          throw new Error(errData.error || "결제 검증 실패");
        }

        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 2000);

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "알 수 없는 오류";
        setMessage(msg);
        setStatus("error");
        setTimeout(() => router.push("/dashboard"), 3000);
      }
    }

    handleCallback();
  }, [searchParams, router]);

  return (
    <div style={{
      background: "#F0F7F4", minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif",
      padding: "0 24px",
    }}>
      <div style={{ textAlign: "center" }}>
        {status === "loading" && (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>결제를 확인하고 있습니다...</p>
            <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 8 }}>잠시만 기다려주세요.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>결제가 완료되었습니다!</p>
            <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 8 }}>대시보드로 이동합니다...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#EF4444" }}>결제 확인 실패</p>
            <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 8 }}>{message}</p>
            <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>대시보드로 이동합니다...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ background: "#F0F7F4", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 14, color: "#94A3B8" }}>불러오는 중...</p>
      </div>
    }>
      <CallbackInner />
    </Suspense>
  );
}
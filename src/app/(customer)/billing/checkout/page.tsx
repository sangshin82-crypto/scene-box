'use client';

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, X, CreditCard, Building2, Check, ShieldCheck, FileText, ChevronDown, Camera } from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import { loadPaymentWidget, PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";

const BLUE = "#2563EB";
const fmtWon = (n: number) => n.toLocaleString("ko-KR") + "원";

type CheckKey = "terms" | "liability" | "scope" | "checkout";

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

function BillingCheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const billIdFromQuery = searchParams.get("billId"); // 정산탭에서 넘겨준 billId

  const [bill, setBill]           = useState<any>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payMethod, setPayMethod] = useState<"card" | "bank">("card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientId, setClientId] = useState("");
  const [checks, setChecks] = useState<Record<CheckKey, boolean>>({
    terms: false, liability: false, scope: false, checkout: false,
  });
  const [expanded, setExpanded] = useState<Record<CheckKey, boolean>>({
    terms: false, liability: false, scope: false, checkout: false,
  });
  const [needsInvoice, setNeedsInvoice] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [existingLicenseUrl, setExistingLicenseUrl] = useState<string>("");
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const [paymentWidget, setPaymentWidget] = useState<PaymentWidgetInstance | null>(null);
  const paymentMethodsRef = useRef<HTMLDivElement | null>(null);

  const allChecked   = checks.terms && checks.liability && checks.scope && checks.checkout;
  const toggleCheck  = (k: CheckKey) => setChecks(p => ({ ...p, [k]: !p[k] }));
  const toggleExpand = (k: CheckKey) => setExpanded(p => ({ ...p, [k]: !p[k] }));

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      const id = user?.id ?? "00000000-0000-0000-0000-000000000001";
      setClientId(id);

      const { data: clientData } = await supabase
        .from("clients").select("name, email, phone, last_business_license_url").eq("id", id).single();
      if (clientData) {
        setClientName(clientData.name);
        // 기존 사업자등록증 및 담당자 정보 자동 입력
        if (clientData.last_business_license_url) {
          setExistingLicenseUrl(clientData.last_business_license_url);
        }
        setForm({
          name: clientData.name || "",
          phone: clientData.phone || "",
          email: clientData.email || "",
        });
      }

      // billId가 있으면 해당 청구서 조회, 없으면 이번 달 청구서
      let billData: any = null;
      if (billIdFromQuery) {
        const { data } = await supabase
          .from("monthly_bills").select("*")
          .eq("id", billIdFromQuery)
          .single();
        billData = data;
      } else {
        const now = new Date();
        const { data } = await supabase
          .from("monthly_bills").select("*")
          .eq("client_id", id)
          .eq("status", "pending")
          .order("billing_year", { ascending: false })
          .order("billing_month", { ascending: false })
          .limit(1)
          .maybeSingle();
        billData = data;
      }

      if (billData) {
        setBill(billData);
        const { data: items } = await supabase
          .from("bill_line_items").select("*")
          .eq("bill_id", billData.id)
          .neq("item_type", "deposit")
          .order("created_at", { ascending: true });

        const filtered = (items ?? []).filter(
          (item: any) => !item.description.startsWith("월 보관료")
        );
        setLineItems(filtered);
      }
      setIsLoading(false);
    }
    fetchData();
  }, [billIdFromQuery]);

  useEffect(() => {
    if (payMethod !== "card") return;
    const initializeWidget = async () => {
      try {
        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
        if (!clientKey) return;
        const widget = await loadPaymentWidget(clientKey, "GUEST");
        setPaymentWidget(widget);
      } catch (error) {
        console.error("토스 위젯 초기화 실패:", error);
      }
    };
    initializeWidget();
  }, [payMethod]);

  const subtotal = lineItems.filter(it => it.item_type !== "deposit").reduce((sum, it) => sum + (it.amount ?? 0), 0);
  const total    = subtotal; // lineItems에 이미 VAT 포함 금액으로 저장됨

  useEffect(() => {
    if (!paymentWidget || !paymentMethodsRef.current || payMethod !== "card") return;
    try {
      paymentWidget.renderPaymentMethods(
        "#billing-payment-methods",
        { value: total },
        { variantKey: "DEFAULT" }
      );
    } catch (error) {
      console.error("결제 수단 렌더링 실패:", error);
    }
  }, [paymentWidget, total, payMethod]);

  const orderId  = `BILL_${bill?.id ?? Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const orderName = `씬박스 ${bill?.billing_year}년 ${bill?.billing_month}월 정산`;

  const handlePayment = async () => {
    if (!allChecked || isSubmitting || !bill) return;
    setIsSubmitting(true);

    try {
      if (payMethod === "card") {
        await sendTelegramNotification(
          `💳 <b>카드 결제 링크 요청!</b>\n\n` +
          `👤 고객명: ${clientName}\n` +
          `📅 청구 월: ${bill.billing_year}년 ${bill.billing_month}월\n` +
          `💰 결제 금액: ${fmtWon(total)} (VAT 포함)\n` +
          `📅 요청일: ${new Date().toLocaleDateString("ko-KR")}\n\n` +
          `⚡ 페이앱으로 카드 결제 링크 발송 필요!`
        );
        alert("카드 결제 요청이 접수되었습니다.\n관리자가 카드 결제 링크를 곧 문자(카카오톡)으로 발송해드립니다.");
        router.push("/billing");
        return;
      }

      // 무통장 — 해당 billId만 paid 처리
      let uploadedUrl = existingLicenseUrl || "";

      // 세금계산서 필요 시 처리
      if (needsInvoice) {
        // 새 파일 업로드
        if (licenseFile) {
          const fileExt = licenseFile.name.split('.').pop();
          const fileName = `bill_${bill.id}_license_${Date.now()}.${fileExt}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("tax-docs")
            .upload(fileName, licenseFile);

          if (uploadError) throw new Error("사업자등록증 업로드 실패: " + uploadError.message);

          const { data: { publicUrl } } = supabase.storage
            .from("tax-docs")
            .getPublicUrl(fileName);
          uploadedUrl = publicUrl;
        }

        // monthly_bills에 세금계산서 정보 저장
        const { error: billUpdateError } = await supabase
          .from("monthly_bills")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            needs_invoice: true,
            business_license_url: uploadedUrl,
            invoice_contact_name: form.name,
            invoice_contact_phone: form.phone,
            invoice_contact_email: form.email,
          })
          .eq("id", bill.id);
        if (billUpdateError) throw new Error("청구서 업데이트 실패");

        // clients 테이블에 캐시 업데이트 (다음번 자동 입력용)
        if (uploadedUrl) {
          await supabase
            .from("clients")
            .update({ last_business_license_url: uploadedUrl })
            .eq("id", clientId);
        }
      } else {
        // 세금계산서 불필요 시 기본 처리
        const { error } = await supabase
          .from("monthly_bills")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("id", bill.id);
        if (error) throw new Error("결제 처리 실패");
      }

      await sendTelegramNotification(
        `💳 <b>정산 결제 완료! (무통장)</b>\n\n` +
        `👤 고객명: ${clientName}\n` +
        `📅 청구 월: ${bill.billing_year}년 ${bill.billing_month}월\n` +
        `💰 결제 금액: ${fmtWon(total)} (VAT 포함)\n` +
        `📅 결제일: ${new Date().toLocaleDateString("ko-KR")}` +
        (needsInvoice ? `\n📎 세금계산서: 발행 필요` : "")
      );

      alert("정산이 정상적으로 접수되었습니다!\n\n[입금 계좌 안내]\n국민은행 567001-04-101845 박민지\n입금 금액: " + fmtWon(total) + " (VAT 포함)\n\n입금 확인이 완료되면 정산이 최종 확정됩니다.");
      router.push("/billing");

    } catch (err: any) {
      console.error("결제 처리 실패:", err);
      alert("처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="flex min-h-screen w-full items-center justify-center" style={{ background: "#F0F7F4" }}>
      <p className="animate-pulse text-[14px] font-bold" style={{ color: "#94A3B8" }}>불러오는 중...</p>
    </div>
  );

  return (
    <div style={{ background: "#F0F7F4", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}
      className="flex justify-center">
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100vh", paddingBottom: 140 }}>

        {/* 헤더 */}
        <div style={{ background: "#fff", borderBottom: "0.5px solid #D1E8DF" }}
          className="sticky top-0 z-50 flex items-center justify-between px-4 py-4">
          <button type="button" className="p-1" onClick={() => router.back()}>
            <ChevronLeft size={23} color="#374151" strokeWidth={1.8} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
            {bill ? `${bill.billing_year}년 ${bill.billing_month}월 정산 결제` : "정산 결제"}
          </span>
          <button className="p-1" onClick={() => router.back()}>
            <X size={21} color="#374151" strokeWidth={1.8} />
          </button>
        </div>

        <div style={{ padding: "20px 16px 0", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* 금액 카드 */}
          <section>
            <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 1px 12px rgba(0,0,0,0.05)", overflow: "hidden", border: "0.5px solid #D1E8DF" }}>
              <div style={{ background: `linear-gradient(135deg, ${BLUE}, #3B82F6)`, padding: "16px 20px" }}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 4 }}>
                  최종 결제 금액 (VAT 포함)
                </p>
                <p style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>
                  {fmtWon(total)}
                </p>
              </div>
              <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                {lineItems.map(it => (
                  <div key={it.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#94A3B8" }}>{it.description}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{fmtWon(it.amount)}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px dashed #D1E8DF", paddingTop: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>최종 합계 (VAT 포함)</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: BLUE }}>{fmtWon(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 결제 수단 */}
          <section>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>결제 수단 선택</p>
            <div style={{ display: "flex", background: "#E8F5F0", borderRadius: 14, padding: 4, marginBottom: 14 }}>
              {[
                { id: "card" as const, icon: CreditCard, label: "카드 결제" },
                { id: "bank" as const, icon: Building2, label: "세금계산서 및 무통장입금" },
              ].map(({ id, icon: Icon, label }) => {
                const active = payMethod === id;
                return (
                  <button key={id} onClick={() => setPayMethod(id)}
                    style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", background: active ? "#fff" : "transparent", color: active ? BLUE : "#94A3B8", fontWeight: active ? 700 : 500, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s", boxShadow: active ? "0 1px 6px rgba(0,0,0,0.08)" : "none" }}>
                    <Icon size={15} strokeWidth={1.8} />{label}
                  </button>
                );
              })}
            </div>

            {payMethod === "card" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: "#EFF6FF", borderRadius: 16, padding: "20px 18px", border: "0.5px solid #BFDBFE" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <CreditCard size={19} color={BLUE} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: BLUE, marginBottom: 8 }}>카드 결제 안내</p>
                      <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.8 }}>
                        결제하기 버튼을 누르시면 카드 결제 요청이 접수됩니다.<br />
                        관리자가 카드 결제 링크를 곧 문자(카카오톡)으로 발송해드립니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {payMethod === "bank" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: "#F0F7F4", borderRadius: 14, padding: "16px 18px", border: "1px dashed #D1E8DF" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Building2 size={15} color="#64748B" strokeWidth={1.8} />
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>입금 계좌 안내</p>
                  </div>
                  <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.7 }}>
                    국민은행 567001-04-101845 박민지
                  </p>
                </div>
                <button onClick={() => setNeedsInvoice(p => !p)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: needsInvoice ? "#EFF6FF" : "#fff", borderRadius: 14, padding: "14px 18px", border: `1.5px solid ${needsInvoice ? "#BFDBFE" : "#D1E8DF"}`, cursor: "pointer", transition: "all 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <FileText size={16} color={needsInvoice ? BLUE : "#94A3B8"} strokeWidth={1.8} />
                    <div style={{ textAlign: "left" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: needsInvoice ? BLUE : "#374151" }}>세금계산서 발행 필요</p>
                      <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>사업자 거래 시 선택해주세요</p>
                    </div>
                  </div>
                  <div style={{ width: 44, height: 24, borderRadius: 99, background: needsInvoice ? BLUE : "#D1E8DF", position: "relative", transition: "all 0.2s", flexShrink: 0 }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: needsInvoice ? 23 : 3, transition: "all 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
                  </div>
                </button>
                {needsInvoice && (
                  <>
                    {/* 담당자 정보 */}
                    <div style={{ background: "#fff", borderRadius: 16, padding: "16px 18px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)", border: "0.5px solid #D1E8DF" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <FileText size={15} color={BLUE} strokeWidth={1.8} />
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>세금계산서 발행 정보</p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {[
                          { key: "name" as const, placeholder: "담당자 성함", type: "text" },
                          { key: "phone" as const, placeholder: "연락처 (예: 010-1234-5678)", type: "tel" },
                          { key: "email" as const, placeholder: "이메일 (세금계산서 수신)", type: "email" },
                        ].map(({ key, placeholder, type }) => (
                          <input key={key} type={type} placeholder={placeholder} value={form[key]}
                            onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #D1E8DF", fontSize: 14, color: "#0F172A", background: "#F0F7F4", outline: "none", boxSizing: "border-box" as const }} />
                        ))}
                      </div>
                    </div>

                    {/* 사업자등록증 업로드 */}
                    <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #D1E8DF", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
                      <div style={{ padding: "14px 18px", borderBottom: "0.5px solid #F0F7F4", display: "flex", alignItems: "center", gap: 8 }}>
                        <Camera size={16} color={BLUE} strokeWidth={1.8} />
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>사업자등록증 사본 첨부</p>
                        {!existingLicenseUrl && !licenseFile && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#EF4444", background: "#FEF2F2", padding: "2px 6px", borderRadius: 99 }}>필수</span>
                        )}
                      </div>
                      <label style={{ display: "block", padding: "16px 18px", cursor: "pointer" }}>
                        <input
                          type="file"
                          accept="image/*, .pdf"
                          onChange={e => setLicenseFile(e.target.files?.[0] || null)}
                          style={{ display: "none" }}
                        />
                        {licenseFile ? (
                          // 새로 업로드한 파일
                          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#ECFDF5", borderRadius: 12, padding: "12px 14px" }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Check size={18} color="#10B981" strokeWidth={2} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>새 파일 선택 완료</p>
                              <p style={{ fontSize: 11, color: "#6EE7B7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{licenseFile.name}</p>
                            </div>
                            <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600, flexShrink: 0 }}>변경</span>
                          </div>
                        ) : existingLicenseUrl ? (
                          // 기존 파일 사용
                          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#EFF6FF", borderRadius: 12, padding: "12px 14px" }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Check size={18} color={BLUE} strokeWidth={2} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: BLUE }}>기존 파일 사용</p>
                              <p style={{ fontSize: 11, color: "#60A5FA" }}>이전에 업로드한 사업자등록증</p>
                            </div>
                            <span style={{ fontSize: 11, color: BLUE, fontWeight: 600, flexShrink: 0 }}>변경</span>
                          </div>
                        ) : (
                          // 파일 선택 전
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 0", border: "1.5px dashed #D1E8DF", borderRadius: 12 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F0F7F4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Camera size={22} color="#94A3B8" strokeWidth={1.5} />
                            </div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>파일을 선택해주세요</p>
                            <p style={{ fontSize: 11, color: "#94A3B8" }}>JPG, PNG, PDF 가능</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          {/* 약관 동의 */}
          <section>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>필수 약관 동의</p>
            <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 1px 10px rgba(0,0,0,0.05)", overflow: "hidden", border: "0.5px solid #D1E8DF" }}>
              <button
                onClick={() => setChecks(allChecked
                  ? { terms: false, liability: false, scope: false, checkout: false }
                  : { terms: true, liability: true, scope: true, checkout: true }
                )}
                style={{ width: "100%", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, background: allChecked ? "#EFF6FF" : "#F0F7F4", border: "none", borderBottom: "0.5px solid #D1E8DF", cursor: "pointer", textAlign: "left" }}>
                <CheckBox checked={allChecked} />
                <span style={{ fontSize: 14, fontWeight: 700, color: allChecked ? BLUE : "#374151" }}>전체 동의</span>
              </button>
              <div style={{ padding: "4px 0" }}>
                <TermRow checked={checks.terms}     onToggle={() => toggleCheck("terms")}     onExpand={() => toggleExpand("terms")}     expanded={expanded.terms}
                  label="[필수] 본 서비스는 B2B 전용 '물리적 공간(Grid) 대여 서비스'이며, 보관 물품에 대한 훼손/파손 면책 조항에 동의합니다." color={BLUE}
                  detail="씬박스는 보관업이 아닌 물리적 공간(Grid) 임대 서비스입니다. 화물의 보존은 고객의 자체 자산 보험으로 커버해야 하며, 당사는 환경적 요인 및 불가항력적 사고로 인한 훼손에 대해 배상 책임을 지지 않습니다." />
                <TermRow checked={checks.liability} onToggle={() => toggleCheck("liability")} onExpand={() => toggleExpand("liability")} expanded={expanded.liability}
                  label="[필수] 보관료 연체 시 이행보증금 우선 차감 및 장기 연체 화물의 임의 처분에 동의합니다." color="#0F172A"
                  detail="요금 연체 시 납부한 이행보증금에서 미납금이 우선 차감되며, 60일 이상 장기 연체 시 당사는 사전 통보 후 공간 확보를 위해 해당 화물을 임의로 반출, 매각, 또는 폐기 처분할 수 있습니다." />
                <TermRow checked={checks.checkout}  onToggle={() => toggleCheck("checkout")}  onExpand={() => toggleExpand("checkout")}  expanded={expanded.checkout}
                  label="[필수] 화물 출고(부분 반환 포함) 시, 최소 1영업일(24시간) 전 사전 예약 필수 원칙에 동의합니다." color="#0F172A"
                  detail="원활한 현장 작업 및 동선 확보를 위해 사전 예약 없는 당일 즉시 출고 요구는 원칙적으로 거절되며, 이로 인한 고객의 업무 지연에 대해 회사는 책임지지 않습니다." />
                <TermRow checked={checks.scope}     onToggle={() => toggleCheck("scope")}     onExpand={() => toggleExpand("scope")}     expanded={expanded.scope}
                  label="[필수] 당사는 '보관 및 운송' 전용 서비스로, 현장 구조물 해체/철거 작업은 제공하지 않음에 동의합니다." color="#0F172A"
                  detail="씬박스는 보관 및 운송 전용 서비스입니다. 미술 세트나 구조물의 현장 해체, 철거, 분해 작업은 서비스 범위에 포함되지 않습니다." />
              </div>
            </div>
          </section>
        </div>

        {/* 하단 버튼 */}
        <div style={{ position: "fixed", bottom: 56, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(240,247,244,0.95)", backdropFilter: "blur(12px)", borderTop: "0.5px solid #D1E8DF", padding: "14px 16px 20px", zIndex: 90, boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
          <button onClick={handlePayment} disabled={!allChecked || isSubmitting}
            style={{ width: "100%", padding: "15px 0", borderRadius: 14, border: "none", background: allChecked ? `linear-gradient(90deg, ${BLUE}, #3B82F6)` : "#E5E7EB", color: allChecked ? "#fff" : "#9CA3AF", fontSize: 15, fontWeight: 700, cursor: allChecked ? "pointer" : "not-allowed", transition: "all 0.2s", boxShadow: allChecked ? `0 4px 16px ${BLUE}44` : "none" }}>
            {isSubmitting ? "처리 중..." : allChecked ? `${fmtWon(total)} 결제하기` : "약관에 동의해주세요"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BillingCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen w-full items-center justify-center" style={{ background: "#F0F7F4" }}>
        <p className="animate-pulse text-[14px] font-bold" style={{ color: "#94A3B8" }}>불러오는 중...</p>
      </div>
    }>
      <BillingCheckoutInner />
    </Suspense>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? BLUE : "#D1E8DF"}`, background: checked ? BLUE : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
      {checked && <Check size={12} color="#fff" strokeWidth={3} />}
    </div>
  );
}

function TermRow({ checked, onToggle, onExpand, expanded, label, color, detail }: {
  checked: boolean; onToggle: () => void; onExpand: () => void;
  expanded: boolean; label: string; color: string; detail: string;
}) {
  return (
    <div style={{ borderBottom: "0.5px solid #F0F7F4" }}>
      <div style={{ display: "flex", alignItems: "flex-start", padding: "13px 18px", gap: 12 }}>
        <button onClick={onToggle} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0, marginTop: 1 }}>
          <CheckBox checked={checked} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12, color, lineHeight: 1.6, fontWeight: 600 }}>{label}</span>
          {expanded && (
            <div style={{ marginTop: 8, padding: "10px 12px", background: "#F0F7F4", borderRadius: 10, fontSize: 12, color: "#64748B", lineHeight: 1.7 }}>
              {detail}
            </div>
          )}
        </div>
        <button onClick={onExpand} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}>
          <ChevronDown size={14} color="#94A3B8" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </button>
      </div>
    </div>
  );
}

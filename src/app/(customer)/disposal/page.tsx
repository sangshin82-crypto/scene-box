'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, X, Package, Check,
  Scale, AlertTriangle, Trash2,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE = "#2563EB";

type InventoryItem = {
  id: string;
  name: string;
  stored_at: string;
  grids: { grid_number: string; zone: string } | null;
};

const fmtDate = (d: string) => {
  const date = new Date(d);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

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

export default function DisposalPage() {
  const router = useRouter();

  const [items, setItems]           = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [agreed, setAgreed]         = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchItems() {
      const { data: { user } } = await supabase.auth.getUser();
      const clientId = user?.id ?? "00000000-0000-0000-0000-000000000001";

      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, stored_at, grids(grid_number, zone)")
        .eq("client_id", clientId)
        .eq("status", "stored")
        .order("stored_at", { ascending: false });

      if (error) {
        console.error("물품 로딩 실패:", error);
      } else {
        setItems((data ?? []) as unknown as InventoryItem[]);
      }
      setIsLoading(false);
    }
    fetchItems();
  }, []);

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const canSubmit = selected.size > 0 && agreed;

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    const clientId = user?.id ?? "00000000-0000-0000-0000-000000000001";

    // 고객 이름 조회
    const { data: clientData } = await supabase
      .from("clients")
      .select("name")
      .eq("id", clientId)
      .single();
    const clientName = clientData?.name ?? "고객";

    // 선택된 물품 이름 조회
    const selectedItems = items.filter(item => selected.has(item.id));
    const itemNames = selectedItems.map(item => item.name).join(", ");

    const { data: disposalData, error: disposalError } = await supabase
      .from("disposal_requests")
      .insert({
        client_id:         clientId,
        unit_price_per_kg: 500,
        transport_fee:     0,
        status:            "pending",
      })
      .select()
      .single();

    if (disposalError || !disposalData) {
      console.error("폐기 요청 실패:", disposalError);
      alert("요청 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setIsSubmitting(false);
      return;
    }

    const itemRows = [...selected].map(itemId => ({
      disposal_request_id: disposalData.id,
      inventory_item_id:   itemId,
    }));

    const { error: itemsError } = await supabase
      .from("disposal_request_items")
      .insert(itemRows);

    if (itemsError) {
      console.error("폐기 물품 연결 실패:", itemsError);
      alert("요청 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setIsSubmitting(false);
      return;
    }

    await supabase
      .from("inventory_items")
      .update({ status: "disposed" })
      .in("id", [...selected]);

    // 텔레그램 알림 전송
    await sendTelegramNotification(
      `🗑 <b>폐기 요청 접수!</b>\n\n` +
      `👤 고객명: ${clientName}\n` +
      `📦 물품 수: ${selected.size}개\n` +
      `📋 물품 목록: ${itemNames}\n` +
      `📅 요청일: ${new Date().toLocaleDateString("ko-KR")}`
    );

    alert(`${selected.size}개 물품 폐기 요청이 완료되었습니다!\n관리자가 실측 후 비용을 확정하면 정산 탭에서 확인하실 수 있습니다.`);
    router.push("/dashboard");
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
        <p className="animate-pulse text-[14px] font-bold text-gray-500">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#F3F4F6", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100vh", paddingBottom: 130 }}>

        <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px" }}>
          <button type="button" onClick={() => router.back()} style={{ padding: 4, background: "none", border: "none", cursor: "pointer" }}>
            <ChevronLeft size={24} color="#374151" />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>폐기 정산 요청</span>
          <button style={{ padding: 4, background: "none", border: "none", cursor: "pointer" }}>
            <X size={22} color="#374151" />
          </button>
        </div>

        <div style={{ padding: "20px 16px 0", display: "flex", flexDirection: "column", gap: 20 }}>

          <section>
            <StepLabel n={1} />
            <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 12, paddingLeft: 30 }}>
              폐기를 원하는 물품을 선택해주세요. (다중 선택 가능)
            </p>
            {items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF" }}>
                <Package size={36} color="#D1D5DB" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>보관 중인 물품이 없습니다</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map(({ id, name, stored_at, grids }) => {
                  const active = selected.has(id);
                  const zoneLabel = grids ? `${grids.zone}존 ${grids.grid_number}` : "—";
                  return (
                    <button key={id} onClick={() => toggle(id)} style={{ background: active ? "#EFF6FF" : "#fff", borderRadius: 14, border: `2px solid ${active ? BLUE : "#E5E7EB"}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left", boxShadow: active ? `0 2px 12px ${BLUE}22` : "0 1px 4px rgba(0,0,0,0.05)", transition: "all 0.15s" }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, border: `2px solid ${active ? BLUE : "#D1D5DB"}`, background: active ? BLUE : "#fff", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                        {active && <Check size={13} color="#fff" strokeWidth={3} />}
                      </div>
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: active ? "#DBEAFE" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                        <Package size={20} color={active ? BLUE : "#9CA3AF"} strokeWidth={1.8} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: active ? "#fff" : "#6B7280", background: active ? BLUE : "#E5E7EB", padding: "2px 7px", borderRadius: 99 }}>
                            {zoneLabel}
                          </span>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: active ? BLUE : "#111827", marginBottom: 2 }}>{name}</p>
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>입고일: {fmtDate(stored_at)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {selected.size > 0 && (
              <p style={{ fontSize: 12, color: BLUE, fontWeight: 600, marginTop: 10, textAlign: "right" }}>
                총 {selected.size}개 선택됨
              </p>
            )}
          </section>

          <section>
            <StepLabel n={2} />
            <div style={{ background: "#F9FAFB", borderRadius: 14, border: "1.5px solid #E5E7EB", padding: "18px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Scale size={20} color={BLUE} strokeWidth={1.8} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>투명한 무게 단위(kg) 정산</p>
              </div>
              <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7 }}>
                선택하신 물품은 폐기장으로 이동 후 정확한 무게를 측정하여 비용이 산정됩니다.
              </p>
              <div style={{ marginTop: 12, background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#6B7280" }}>기본 단가</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: BLUE }}>1kg당 500원</span>
              </div>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 10, lineHeight: 1.8 }}>
                * 실제 폐기 비용은 현장 계근(무게 측정) 후 최종 확정됩니다.<br />
                * 단, 폐기장 이동을 위한 운송 및 수작업 비용은 별도 청구됩니다.
              </p>
            </div>
          </section>

          <section>
            <StepLabel n={3} />
            <div style={{ background: "#FEF2F2", borderRadius: 16, border: "1.5px solid #FECACA", padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>폐기 후 복구는 불가능합니다</p>
              </div>
              <button onClick={() => setAgreed(p => !p)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, border: `2px solid ${agreed ? "#DC2626" : "#FCA5A5"}`, background: agreed ? "#DC2626" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                  {agreed && <Check size={12} color="#fff" strokeWidth={3} />}
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#991B1B", lineHeight: 1.6 }}>
                  [필수] 폐기 처리가 시작된 적재물은 즉시 파기되며 절대 복구할 수 없음에 동의합니다.
                </p>
              </button>
              <p style={{ fontSize: 11, color: "#EF4444", marginTop: 12, lineHeight: 1.6, paddingLeft: 32 }}>
                * 확정된 폐기 비용은 정산 탭을 통해 청구/결제가 진행됩니다.
              </p>
            </div>
          </section>

        </div>

        <div style={{ position: "fixed", bottom: 56, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#fff", borderTop: "1px solid #E5E7EB", padding: "14px 16px 20px", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)", zIndex: 90 }}>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            style={{ width: "100%", padding: "16px 0", borderRadius: 14, border: "none", background: canSubmit ? `linear-gradient(90deg, ${BLUE}, #3B82F6)` : "#E5E7EB", color: canSubmit ? "#fff" : "#9CA3AF", fontSize: 16, fontWeight: 700, cursor: canSubmit ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: canSubmit ? `0 4px 16px ${BLUE}55` : "none", transition: "all 0.2s" }}>
            {isSubmitting ? "요청 중..." : canSubmit
              ? <><Trash2 size={18} color="#fff" strokeWidth={2} />{selected.size}개 물품 폐기 요청하기</>
              : "폐기할 물품을 선택해주세요"
            }
          </button>
        </div>

      </div>
    </div>
  );
}

function StepLabel({ n }: { n: 1 | 2 | 3 }) {
  const title = n === 1 ? "폐기할 보관 물품 선택" : n === 2 ? "폐기 방식 및 정산 안내" : "필수 확인 사항";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: n === 1 ? 4 : 12 }}>
      <span style={{ width: 22, height: 22, borderRadius: "50%", background: BLUE, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {n}
      </span>
      <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{title}</span>
    </div>
  );
}
'use client';

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE = "#2563EB";
const fmtWon = (n: number) => `${n.toLocaleString("ko-KR")}원`;
const fmtDate = (d: string) => {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
};

type BillLineItem = {
  id: string;
  description: string;
  amount: number;
  item_type: string;
};

type MonthlyBill = {
  id: string;
  status: string;
  paid_at: string | null;
  admin_memo: string | null;
  vat_amount: number;
  total_amount: number;
};

export default function BillingPage() {
  const router = useRouter();

  const [bill, setBill] = useState<MonthlyBill | null>(null);
  const [lineItems, setLineItems] = useState<BillLineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBillingData() {
      const { data: { user } } = await supabase.auth.getUser();
      const clientId = user?.id ?? "00000000-0000-0000-0000-000000000001";

      const now = new Date();
      const { data: billData, error: billError } = await supabase
        .from("monthly_bills")
        .select("*")
        .eq("client_id", clientId)
        .eq("billing_year", now.getFullYear())
        .eq("billing_month", now.getMonth() + 1)
        .single();

      if (billError) {
        console.error("청구서 로딩 실패:", billError);
        setIsLoading(false);
        return;
      }

      setBill(billData);

      const { data: itemsData, error: itemsError } = await supabase
        .from("bill_line_items")
        .select("*")
        .eq("bill_id", billData.id)
        .order("created_at", { ascending: true });

      if (itemsError) {
        console.error("항목 로딩 실패:", itemsError);
      } else {
        setLineItems(itemsData ?? []);
      }

      setIsLoading(false);
    }

    fetchBillingData();
  }, []);

  const subtotal = useMemo(() =>
    lineItems.reduce((sum, it) => sum + (it.amount ?? 0), 0),
  [lineItems]);

  const vat = bill?.vat_amount ?? Math.round(subtotal * 0.1);
  const total = bill?.total_amount ?? subtotal + vat;

  const isPaid = bill?.status === "paid";
  const canCheckout = !isPaid && lineItems.length > 0;

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
        <p className="animate-pulse text-[14px] font-bold text-gray-500">
          데이터를 불러오는 중입니다...
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-gray-50 pb-[110px]">

      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[17px] font-extrabold tracking-[-0.3px] text-gray-900">
            정산·청구 내역
          </h1>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", background: "#EFF6FF", padding: "4px 10px", borderRadius: 99, border: "1px solid #BFDBFE" }}>
            📞 <a href="tel:07080576783" style={{ color: "#2563EB", textDecoration: "none" }}>070-8057-6783</a>
            {" / "}
            <a href="tel:01028978524" style={{ color: "#2563EB", textDecoration: "none" }}>010-2897-8524</a>
          </span>
        </div>
      </div>

      <main className="px-4 pt-4 flex flex-col gap-4">
        <section>
          <div className="mb-2 flex items-end justify-between">
            <h2 className="text-[14px] font-extrabold text-gray-900">결제 예정 내역</h2>
            <span className="text-[11px] font-semibold text-gray-500">관리자 확정 항목</span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {lineItems.length === 0 ? (
              <div className="px-4 py-6 text-center text-[13px] text-gray-400">
                청구 예정 내역이 없습니다.
              </div>
            ) : (
              <>
                {lineItems.map((it, idx) => {
                  const confirmed = it.amount > 0;
                  return (
                    <div
                      key={it.id}
                      className={[
                        "flex items-center justify-between gap-3 px-4 py-4",
                        idx !== 0 ? "border-t border-gray-100" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        {confirmed
                          ? <CheckCircle2 size={18} color="#10B981" strokeWidth={2} />
                          : <Clock size={18} color="#F97316" strokeWidth={2} />
                        }
                        <div>
                          <p className="text-[13px] font-bold text-gray-900">{it.description}</p>
                          <p className={["mt-0.5 text-[11px] font-semibold", confirmed ? "text-gray-400" : "text-orange-400"].join(" ")}>
                            {confirmed ? "금액 확정" : "관리자 입력 대기 중"}
                          </p>
                        </div>
                      </div>
                      <p className={["shrink-0 text-[13px] font-extrabold", confirmed ? "text-gray-900" : "text-gray-300"].join(" ")}>
                        {confirmed ? fmtWon(it.amount) : "—"}
                      </p>
                    </div>
                  );
                })}

                {/* 소계 */}
                <div className="flex items-center justify-between border-t border-dashed border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-[13px] font-semibold text-gray-500">소계</p>
                  <p className="text-[13px] font-bold text-gray-700">{fmtWon(subtotal)}</p>
                </div>

                {/* VAT */}
                <div className="flex items-center justify-between border-t border-dashed border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-[13px] font-semibold text-gray-500">부가세 (VAT 10%)</p>
                  <p className="text-[13px] font-bold text-gray-700">{fmtWon(vat)}</p>
                </div>

                {/* 합계 */}
                <div className="flex items-center justify-between border-t-2 border-gray-200 bg-gray-50 px-4 py-4">
                  <p className="text-[13px] font-extrabold text-gray-700">최종 합계 (VAT 포함)</p>
                  <p className="text-[16px] font-black tracking-[-0.4px]" style={{ color: BLUE }}>
                    {fmtWon(total)}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="mb-1 text-[12px] font-extrabold text-blue-800">관리자 메모</p>
            <p className="text-[12px] font-semibold leading-5 text-blue-900/80">
              {bill?.admin_memo ?? "등록된 메모가 없습니다."}
            </p>
          </div>
        </section>

        {isPaid && (
          <section>
            <div className="mb-2 flex items-end justify-between">
              <h2 className="text-[14px] font-extrabold text-gray-900">결제 완료 내역</h2>
              <span className="text-[11px] font-semibold text-gray-500">조회 전용</span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm opacity-70 px-4 py-4">
              <p className="text-[13px] font-bold text-gray-700">전체 청구 금액</p>
              <p className="mt-0.5 text-[11px] font-semibold text-gray-500">
                {bill?.paid_at ? fmtDate(bill.paid_at) : ""} 결제 완료
              </p>
            </div>
          </section>
        )}
      </main>

      <div className="fixed bottom-14 left-1/2 z-[90] w-full max-w-[430px] -translate-x-1/2 border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-xs font-semibold text-gray-500">최종 결제 금액 (VAT 포함)</span>
            <span className="text-[20px] font-black tracking-[-0.4px] text-gray-900">
              {fmtWon(total)}
            </span>
          </div>
          <button
            type="button"
            disabled={!canCheckout}
            onClick={() => router.push("/billing/checkout")}
            style={{ background: canCheckout ? BLUE : undefined }}
            className={[
              "rounded-xl px-6 py-3 text-[15px] font-extrabold transition",
              canCheckout ? "text-white active:opacity-80" : "cursor-not-allowed bg-gray-200 text-gray-400",
            ].join(" ")}
          >
            결제하기
          </button>
        </div>
        {!canCheckout && (
          <p className="mt-1 text-center text-[11px] font-semibold text-gray-400">
            관리자가 금액을 확정하면 결제가 가능합니다.
          </p>
        )}
      </div>

    </div>
  );
}
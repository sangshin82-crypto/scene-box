'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Phone, MessageCircle } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE = "#2563EB";
const KAKAO_CHAT_URL = "http://pf.kakao.com/_ngBCX/chat";

type Client = {
  id: string;
  name: string;
  contact_phone: string | null;
  contact_email: string | null;
  created_at: string;
  spaces: { status: string }[];
};

export default function AdminClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchClients() {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, contact_phone, contact_email, created_at, spaces(status)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("고객 목록 로딩 실패:", error);
      } else {
        setClients((data ?? []) as unknown as Client[]);
      }
      setIsLoading(false);
    }
    fetchClients();
  }, []);

  const filtered = clients.filter(c =>
    c.name?.includes(search) || c.contact_phone?.includes(search)
  );

  const fmtDate = (d: string) => {
    const date = new Date(d);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  };

  if (isLoading) return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
      <p className="animate-pulse text-[14px] font-bold text-gray-500">불러오는 중...</p>
    </div>
  );

  return (
    <div style={{ background: "#F3F4F6", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
      <div style={{ maxWidth: 430, margin: "0 auto", paddingBottom: 80 }}>

        {/* 헤더 */}
        <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "16px 20px", position: "sticky", top: 0, zIndex: 50 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 12 }}>고객 관리</h1>
          <input
            type="text"
            placeholder="이름 또는 전화번호로 검색"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 14, color: "#111827", outline: "none", boxSizing: "border-box", background: "#F9FAFB" }}
          />
        </div>

        {/* 고객 수 */}
        <div style={{ padding: "12px 20px" }}>
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>총 <strong style={{ color: BLUE }}>{filtered.length}명</strong></p>
        </div>

        {/* 고객 목록 */}
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF" }}>
              <p style={{ fontSize: 14 }}>고객이 없습니다.</p>
            </div>
          ) : (
            filtered.map(client => {
              const activeSpaces = client.spaces?.filter(s => s.status === "active").length ?? 0;
              return (
                <div key={client.id} style={{ background: "#fff", borderRadius: 16, padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 3 }}>{client.name ?? "이름 없음"}</p>
                      <p style={{ fontSize: 11, color: "#9CA3AF" }}>가입일: {fmtDate(client.created_at)}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: activeSpaces > 0 ? "#fff" : "#9CA3AF", background: activeSpaces > 0 ? BLUE : "#F3F4F6", padding: "4px 10px", borderRadius: 99 }}>
                      {activeSpaces > 0 ? `${activeSpaces} Grid 계약중` : "계약 없음"}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Phone size={13} color="#9CA3AF" />
                      <span style={{ fontSize: 13, color: client.contact_phone ? "#374151" : "#D1D5DB", fontWeight: client.contact_phone ? 600 : 400 }}>
                        {client.contact_phone ?? "전화번호 미등록"}
                      </span>
                    </div>
                    {client.contact_email && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>✉</span>
                        <span style={{ fontSize: 12, color: "#6B7280" }}>{client.contact_email}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    {client.contact_phone && (
                      <a href={`tel:${client.contact_phone.replace(/-/g, "")}`}
                        style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: `1.5px solid ${BLUE}`, background: "#EFF6FF", color: BLUE, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, textDecoration: "none" }}>
                        <Phone size={13} strokeWidth={2.5} />
                        전화하기
                      </a>
                    )}
                    <a href={KAKAO_CHAT_URL} target="_blank" rel="noreferrer"
                      style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1.5px solid #FEE500", background: "#FEE500", color: "#191600", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, textDecoration: "none" }}>
                      <MessageCircle size={13} strokeWidth={2.5} />
                      카카오 문의
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
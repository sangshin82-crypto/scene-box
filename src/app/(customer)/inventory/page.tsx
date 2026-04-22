'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Camera, Package, Box, Layers,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE  = "#2563EB";
const GREEN = "#10B981";

const ICON_MAP = [Package, Box, Layers, Package, Box];

type InventoryItem = {
  id: string;
  name: string;
  description: string | null;
  size_type: string | null;
  stored_at: string;
  status: string;
  grids: { grid_number: string; zone: string } | null;
};

const fmtDate = (d: string) => {
  const date = new Date(d);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

export default function InventoryPage() {
  const router = useRouter();

  const [items, setItems]           = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [query, setQuery]           = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    async function fetchItems() {
      const { data: { user } } = await supabase.auth.getUser();
      const clientId = user?.id ?? "00000000-0000-0000-0000-000000000001";

      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, description, size_type, stored_at, status, grids(grid_number, zone)")
        .eq("client_id", clientId)
        .eq("status", "stored")
        .order("stored_at", { ascending: false });

      if (error) {
        console.error("보관함 로딩 실패:", error);
      } else {
        setItems((data ?? []) as unknown as InventoryItem[]);
      }
      setIsLoading(false);
    }
    fetchItems();
  }, []);

  const filtered = items.filter(it =>
    it.name.includes(query) ||
    (it.grids?.grid_number ?? "").includes(query) ||
    (it.description ?? "").includes(query)
  );

  const gridLabels = [...new Set(
    items.map(it => it.grids ? `${it.grids.zone}존 ${it.grids.grid_number}` : null).filter(Boolean)
  )] as string[];

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center" style={{ background: "#F0F7F4" }}>
        <p className="animate-pulse text-[14px] font-bold" style={{ color: "#94A3B8" }}>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#F0F7F4", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}
      className="relative w-full pb-[80px]">

      {/* 헤더 */}
      <header style={{ background: "#fff", borderBottom: "0.5px solid #D1E8DF" }}
        className="sticky top-0 z-50">
        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <button type="button" onClick={() => router.back()}
              style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0, padding: 4 }}>
              <ChevronLeft size={23} color="#374151" strokeWidth={1.8} />
            </button>
            <span style={{ flex: 1, textAlign: "center", fontSize: 19, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.5px" }}>
              내 보관함
            </span>
            <button type="button" onClick={() => setSearchOpen(p => !p)}
              style={{ padding: 6, background: searchOpen ? "#EFF6FF" : "none", border: "none", borderRadius: 10, cursor: "pointer", flexShrink: 0 }}>
              <Search size={21} color={searchOpen ? BLUE : "#374151"} strokeWidth={1.8} />
            </button>
          </div>

          {searchOpen && (
            <div style={{ paddingTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F0F7F4", borderRadius: 12, padding: "10px 14px", border: "1.5px solid #D1E8DF" }}>
                <Search size={14} color="#94A3B8" strokeWidth={1.8} />
                <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="물품명, 보관 위치로 검색"
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, color: "#0F172A" }} />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 전화번호 띠(32px) + 기존 패딩(16px) */}
      <div style={{ padding: "48px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* 요약 카드 */}
        <div style={{ background: `linear-gradient(120deg, ${BLUE} 0%, #3B82F6 100%)`, borderRadius: 20, padding: "20px 20px", boxShadow: `0 4px 20px ${BLUE}33` }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 4, fontWeight: 500 }}>현재 보관 현황</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 12, letterSpacing: "-0.5px", lineHeight: 1.4 }}>
            {filtered.length}개의 물품이 안전하게<br />보관 중입니다 🔒
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {gridLabels.length > 0 ? gridLabels.map(g => (
              <span key={g} style={{ fontSize: 12, fontWeight: 700, color: BLUE, background: "#fff", padding: "4px 12px", borderRadius: 99 }}>
                {g}
              </span>
            )) : (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>보관 중인 물품 없음</span>
            )}
          </div>
        </div>

        {/* 필터 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 2 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8" }}>
            {query ? `"${query}" 검색 결과 ${filtered.length}건` : `전체 ${items.length}건`}
          </p>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>입고일 최신순</span>
        </div>

        {/* 목록 */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#94A3B8" }}>
            <Search size={36} color="#D1E8DF" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, fontWeight: 600 }}>
              {query ? "검색 결과가 없습니다" : "보관 중인 물품이 없습니다"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((item, i) => {
              const gridLabel = item.grids ? `${item.grids.zone}존 ${item.grids.grid_number}` : "—";
              return (
                <button key={item.id}
                  style={{ background: "#fff", borderRadius: 18, boxShadow: "0 1px 10px rgba(0,0,0,0.05)", border: "0.5px solid #D1E8DF", padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left", width: "100%" }}>
                  <div style={{ width: 68, height: 68, borderRadius: 14, background: "#F0F7F4", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, flexShrink: 0, border: "1px dashed #D1E8DF" }}>
                    <Camera size={18} color="#94A3B8" strokeWidth={1.5} />
                    <span style={{ fontSize: 9, color: "#94A3B8", fontWeight: 500 }}>사진 없음</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", lineHeight: 1.3 }}>{item.name}</p>
                      <span style={{ fontSize: 10, fontWeight: 700, color: GREEN, background: "#ECFDF5", padding: "3px 8px", borderRadius: 99, whiteSpace: "nowrap", marginLeft: 8, flexShrink: 0 }}>
                        보관 중
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 8 }}>{item.description ?? "—"}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: BLUE, background: "#EFF6FF", padding: "3px 8px", borderRadius: 99 }}>{gridLabel}</span>
                      <span style={{ fontSize: 11, color: "#94A3B8", background: "#F0F7F4", padding: "3px 8px", borderRadius: 99 }}>입고 {fmtDate(item.stored_at)}</span>
                      {item.size_type && (
                        <span style={{ fontSize: 11, color: "#94A3B8", background: "#F0F7F4", padding: "3px 8px", borderRadius: 99 }}>{item.size_type}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={15} color="#CBD5E1" strokeWidth={1.5} style={{ flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
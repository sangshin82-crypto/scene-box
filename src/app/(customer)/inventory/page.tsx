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

  const [items, setItems]         = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery]         = useState("");
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
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
        <p className="animate-pulse text-[14px] font-bold text-gray-500">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-gray-50 pb-[80px]">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-gray-200">
        <div className="bg-white px-4 py-3">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <button type="button" className="p-1" onClick={() => router.back()}
              style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
              <ChevronLeft size={24} color="#374151" />
            </button>
            <span style={{ flex: 1, textAlign: "center", fontSize: 20, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>
              내 보관함
            </span>
            <button type="button" onClick={() => setSearchOpen(p => !p)}
              style={{ padding: 6, background: searchOpen ? "#EFF6FF" : "none", border: "none", borderRadius: 10, cursor: "pointer", flexShrink: 0 }}>
              <Search size={22} color={searchOpen ? BLUE : "#374151"} strokeWidth={2} />
            </button>
          </div>

          {searchOpen && (
            <div style={{ padding: "0 16px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F3F4F6", borderRadius: 12, padding: "10px 14px", border: "1.5px solid #E5E7EB" }}>
                <Search size={15} color="#9CA3AF" />
                <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="물품명, 보관 위치로 검색"
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, color: "#111827" }} />
              </div>
            </div>
          )}
        </div>
      </header>

      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* SUMMARY CARD */}
        <div style={{ background: `linear-gradient(120deg, ${BLUE} 0%, #3B82F6 100%)`, borderRadius: 16, padding: "18px 20px", boxShadow: `0 4px 16px ${BLUE}44` }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 4 }}>현재 보관 현황</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 10, letterSpacing: "-0.5px" }}>
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

        {/* FILTER ROW */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#6B7280" }}>
            {query ? `"${query}" 검색 결과 ${filtered.length}건` : `전체 ${items.length}건`}
          </p>
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>입고일 최신순</span>
        </div>

        {/* ITEM LIST */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
            <Search size={36} color="#D1D5DB" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, fontWeight: 600 }}>
              {query ? "검색 결과가 없습니다" : "보관 중인 물품이 없습니다"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((item, i) => {
              const Icon = ICON_MAP[i % ICON_MAP.length];
              const gridLabel = item.grids ? `${item.grids.zone}존 ${item.grids.grid_number}` : "—";
              return (
                <button key={item.id}
                  style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: "1.5px solid #F3F4F6", padding: "14px 14px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left", width: "100%" }}>
                  <div style={{ width: 72, height: 72, borderRadius: 12, background: "#F3F4F6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, flexShrink: 0, border: "1px dashed #D1D5DB" }}>
                    <Camera size={20} color="#C4C4C4" strokeWidth={1.5} />
                    <span style={{ fontSize: 9, color: "#C4C4C4", fontWeight: 500 }}>사진 없음</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>{item.name}</p>
                      <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, background: "#ECFDF5", padding: "3px 8px", borderRadius: 99, whiteSpace: "nowrap", marginLeft: 8, flexShrink: 0 }}>
                        보관 중
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>{item.description ?? "—"}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: BLUE, background: "#EFF6FF", padding: "3px 8px", borderRadius: 99 }}>{gridLabel}</span>
                      <span style={{ fontSize: 11, color: "#9CA3AF", background: "#F3F4F6", padding: "3px 8px", borderRadius: 99 }}>입고 {fmtDate(item.stored_at)}</span>
                      {item.size_type && (
                        <span style={{ fontSize: 11, color: "#9CA3AF", background: "#F3F4F6", padding: "3px 8px", borderRadius: 99 }}>{item.size_type}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} color="#D1D5DB" style={{ flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
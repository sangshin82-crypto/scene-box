'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE   = "#2563EB";
const GREEN  = "#10B981";
const ORANGE = "#F97316";

type GridInfo = {
  id: string;
  zone: string;
  grid_number: string;
  status: string;
  client_name?: string;
  end_date?: string;
};

type ContractRow = {
  client_id: string;
  client_name: string;
  grids: string[];
  zones: string[];
  end_date: string;
  dday: number;
};

const getDday = (endDate: string) =>
  Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

const fmtDate = (d: string) => {
  const date = new Date(d);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

function GridCell({ info }: { info: GridInfo }) {
  const isOccupied = info.status === "occupied";
  const isExpiring = isOccupied && info.end_date
    ? getDday(info.end_date) <= 7
    : false;

  if (!isOccupied) {
    return (
      <div style={{
        flex: 1, height: 52, borderRadius: 8,
        border: "1.5px dashed #D1D5DB", background: "#FAFAFA",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 9, color: "#D1D5DB", fontWeight: 500 }}>{info.grid_number}</span>
      </div>
    );
  }

  const shortName = info.client_name
    ? info.client_name.slice(0, 3)
    : "—";

  return (
    <div style={{
      flex: 1, height: 52, borderRadius: 8,
      background: isExpiring ? "#FFF7ED" : "#EFF6FF",
      border: `1.5px solid ${isExpiring ? "#FED7AA" : "#BFDBFE"}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 2, position: "relative", overflow: "hidden",
    }}>
      {isExpiring && info.end_date && (
        <span style={{
          position: "absolute", top: 2, right: 2,
          fontSize: 8, fontWeight: 800, color: "#fff",
          background: ORANGE, padding: "1px 4px", borderRadius: 4,
        }}>
          D-{getDday(info.end_date)}
        </span>
      )}
      <span style={{ fontSize: 9, color: isExpiring ? ORANGE : "#93C5FD", fontWeight: 600 }}>
        {info.grid_number}
      </span>
      <span style={{ fontSize: 10, fontWeight: 800, color: isExpiring ? "#C2410C" : BLUE, textAlign: "center", lineHeight: 1.2 }}>
        {shortName}
      </span>
    </div>
  );
}

export default function ReservationPage() {
  const router = useRouter();

  const [gridMap, setGridMap]       = useState<Record<string, Record<string, GridInfo>>>({});
  const [contracts, setContracts]   = useState<ContractRow[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [selected, setSelected]     = useState<string | null>(null);

  const totalGrids    = Object.values(gridMap).flatMap(Object.values).length;
  const occupiedGrids = Object.values(gridMap).flatMap(Object.values).filter(g => g.status === "occupied").length;
  const emptyGrids    = totalGrids - occupiedGrids;

  useEffect(() => {
    async function fetchData() {
      // 1. 전체 그리드 조회
      const { data: gridsData } = await supabase
        .from("grids")
        .select("id, zone, grid_number, status")
        .order("zone")
        .order("grid_number");

      // 2. 활성 계약 조회 (고객명 + 그리드 + 종료일)
      const { data: spacesData } = await supabase
        .from("spaces")
        .select("client_id, end_date, grids(id, grid_number, zone), clients(name)")
        .eq("status", "active");

      // 그리드별 고객명 + 종료일 맵
      const gridClientMap: Record<string, { client_name: string; end_date: string }> = {};
      spacesData?.forEach((s: any) => {
        const gridId = s.grids?.id;
        if (gridId) {
          gridClientMap[gridId] = {
            client_name: s.clients?.name ?? "—",
            end_date: s.end_date,
          };
        }
      });

      // 그리드 맵 구성 (zone → grid_number → GridInfo)
      const map: Record<string, Record<string, GridInfo>> = {};
      gridsData?.forEach((g: any) => {
        if (!map[g.zone]) map[g.zone] = {};
        const clientInfo = gridClientMap[g.id];
        map[g.zone][g.grid_number] = {
          id: g.id,
          zone: g.zone,
          grid_number: g.grid_number,
          status: clientInfo ? "occupied" : g.status,
          client_name: clientInfo?.client_name,
          end_date: clientInfo?.end_date,
        };
      });
      setGridMap(map);

      // 계약 현황 구성 (고객별 그룹핑)
      const contractMap: Record<string, ContractRow> = {};
      spacesData?.forEach((s: any) => {
        const clientId   = s.client_id;
        const clientName = s.clients?.name ?? "—";
        const gridNum    = s.grids?.grid_number ?? "";
        const zone       = s.grids?.zone ?? "";

        if (!contractMap[clientId]) {
          contractMap[clientId] = {
            client_id:   clientId,
            client_name: clientName,
            grids:       [],
            zones:       [],
            end_date:    s.end_date,
            dday:        getDday(s.end_date),
          };
        }
        if (gridNum) contractMap[clientId].grids.push(gridNum);
        if (zone && !contractMap[clientId].zones.includes(zone)) {
          contractMap[clientId].zones.push(zone);
        }
        // 가장 빠른 종료일로
        if (getDday(s.end_date) < contractMap[clientId].dday) {
          contractMap[clientId].end_date = s.end_date;
          contractMap[clientId].dday = getDday(s.end_date);
        }
      });

      setContracts(Object.values(contractMap));
      setIsLoading(false);
    }
    fetchData();
  }, []);

  if (isLoading) return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
      <p className="animate-pulse text-[14px] font-bold text-gray-500">불러오는 중...</p>
    </div>
  );

  // 존별 그리드 번호 행 구성
  const ZONE_ROWS: Record<string, string[][]> = {};
  Object.entries(gridMap).forEach(([zone, grids]) => {
    const nums = Object.keys(grids).sort((a, b) => {
      const na = parseInt(a.slice(1));
      const nb = parseInt(b.slice(1));
      return na - nb;
    });
    const rows: string[][] = [];
    for (let i = 0; i < nums.length; i += 5) {
      rows.push(nums.slice(i, i + 5));
    }
    ZONE_ROWS[zone] = rows;
  });

  return (
    <div style={{
      background: "#F3F4F6", minHeight: "100vh",
      fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif",
      display: "flex", justifyContent: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100vh", paddingBottom: 90 }}>

        {/* 헤더 */}
        <header style={{ background: "#111827", position: "sticky", top: 0, zIndex: 50, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button type="button" onClick={() => router.back()}
              style={{ flexShrink: 0, padding: 4, background: "none", border: "none", cursor: "pointer" }}>
              <ChevronLeft size={22} color="#D1D5DB" />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>
                예약 및 공간 관리
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", background: "#374151", padding: "2px 8px", borderRadius: 99 }}>
                ADMIN
              </span>
            </div>
          </div>
        </header>

        <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* 요약 카드 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "전체 Grid", value: totalGrids,    color: "#374151", bg: "#fff",    border: "#E5E7EB" },
              { label: "사용 중",   value: occupiedGrids, color: BLUE,      bg: "#EFF6FF", border: "#BFDBFE" },
              { label: "공실",      value: emptyGrids,    color: GREEN,     bg: "#ECFDF5", border: "#A7F3D0" },
            ].map(({ label, value, color, bg, border }) => (
              <div key={label} style={{
                background: bg, borderRadius: 12, padding: "12px 10px",
                border: `1.5px solid ${border}`, textAlign: "center",
                boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
              }}>
                <p style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: "-0.5px" }}>{value}</p>
                <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, marginTop: 2 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* 범례 */}
          <div style={{ display: "flex", gap: 12, paddingLeft: 2 }}>
            {[
              { color: "#BFDBFE", bg: "#EFF6FF", label: "사용 중",   dashed: false },
              { color: "#FED7AA", bg: "#FFF7ED", label: "퇴실 임박", dashed: false },
              { color: "#D1D5DB", bg: "#FAFAFA", label: "공실",      dashed: true  },
            ].map(({ color, bg, label, dashed }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: bg, border: `1.5px ${dashed ? "dashed" : "solid"} ${color}` }} />
                <span style={{ fontSize: 11, color: "#6B7280" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* 그리드 맵 */}
          <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", padding: "16px 14px" }}>
            {Object.entries(ZONE_ROWS).map(([zone, rows], zi) => (
              <div key={zone} style={{ marginBottom: zi < Object.keys(ZONE_ROWS).length - 1 ? 16 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 800, color: "#fff",
                    background: zone === "A" ? BLUE : "#7C3AED",
                    padding: "2px 10px", borderRadius: 99,
                  }}>
                    {zone}존
                  </span>
                  <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {rows.map((row, ri) => (
                    <div key={ri} style={{ display: "flex", gap: 6 }}>
                      {row.map(num => (
                        <GridCell key={num} info={gridMap[zone][num]} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 계약 현황 */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#6B7280", marginBottom: 10, paddingLeft: 2 }}>
              계약 현황 ({contracts.length}건)
            </p>
            {contracts.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 14, padding: "24px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#9CA3AF" }}>활성 계약이 없습니다.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {contracts.map(({ client_id, client_name, grids, zones, end_date, dday }) => {
                  const isExp = dday <= 7;
                  const zoneSummary = zones.map(z => `${z}존 (${grids.filter(g => g.startsWith(z)).join(", ")})`).join(" / ");
                  return (
                    <button key={client_id}
                      onClick={() => setSelected(selected === client_id ? null : client_id)}
                      style={{
                        background: "#fff", borderRadius: 14,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        border: `1.5px solid ${isExp ? "#FED7AA" : "#F3F4F6"}`,
                        padding: "14px 16px", display: "flex", alignItems: "center",
                        gap: 12, cursor: "pointer", textAlign: "left", width: "100%",
                      }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: isExp ? "#FFF7ED" : "#EFF6FF",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 15, fontWeight: 900, color: isExp ? ORANGE : BLUE }}>
                          {client_name[0]}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{client_name}</p>
                          {isExp && (
                            <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: ORANGE, padding: "2px 6px", borderRadius: 99, flexShrink: 0 }}>
                              D-{dday}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 2 }}>{zoneSummary}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {isExp
                            ? <AlertTriangle size={11} color={ORANGE} />
                            : <CheckCircle2 size={11} color={GREEN} />
                          }
                          <span style={{ fontSize: 11, fontWeight: 600, color: isExp ? ORANGE : "#9CA3AF" }}>
                            계약 종료: {fmtDate(end_date)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} color="#D1D5DB" style={{
                        flexShrink: 0,
                        transform: selected === client_id ? "rotate(90deg)" : "none",
                        transition: "transform 0.2s",
                      }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
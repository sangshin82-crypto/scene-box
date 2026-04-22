'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarClock,
  Receipt,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const BLUE = "#2563EB";
const GREEN = "#10B981";
const ORANGE = "#F97316";

const navItems = [
  { id: "dash", icon: LayoutDashboard, label: "대시보드" },
  { id: "reserve", icon: CalendarClock, label: "예약 관리" },
  { id: "billing", icon: Receipt, label: "정산·청구" },
  { id: "setting", icon: Settings, label: "설정" },
];

// Grid map data
const ZONES: Record<string, string[][]> = {
  A: [
    ["A1", "A2", "A3", "A4", "A5"],
    ["A6", "A7", "A8", "A9", "A10"],
    ["A11", "A12", "A13", "A14", "A15"],
  ],
  B: [
    ["B1", "B2", "B3", "B4", "B5"],
    ["B6", "B7", "B8", "B9", "B10"],
  ],
};

type GridStatus = {
  status: "stable" | "expiring";
  client: string;
  clientShort: string;
  dday?: number;
};

// Grid status: 'empty' | 'stable' | 'expiring'
const GRID_STATUS: Record<string, GridStatus> = {
  A3: { status: "stable", client: "A프로덕션", clientShort: "A프로" },
  A4: { status: "stable", client: "A프로덕션", clientShort: "A프로" },
  A7: { status: "expiring", client: "C필름", clientShort: "C필름", dday: 3 },
  A9: { status: "stable", client: "D엔터", clientShort: "D엔터" },
  A10: { status: "stable", client: "D엔터", clientShort: "D엔터" },
  B1: { status: "stable", client: "B스튜디오", clientShort: "B스튜" },
  B2: { status: "stable", client: "B스튜디오", clientShort: "B스튜" },
  B3: { status: "stable", client: "B스튜디오", clientShort: "B스튜" },
  B5: { status: "stable", client: "B스튜디오", clientShort: "B스튜" },
  B6: { status: "stable", client: "E픽처스", clientShort: "E픽처" },
  B7: { status: "stable", client: "E픽처스", clientShort: "E픽처" },
  B9: { status: "stable", client: "F미술팀", clientShort: "F미술" },
  B10: { status: "stable", client: "F미술팀", clientShort: "F미술" },
  A1: { status: "stable", client: "G프로", clientShort: "G프로" },
  A2: { status: "stable", client: "G프로", clientShort: "G프로" },
};

type ClientStatus = "stable" | "expiring";
type ClientRow = {
  id: number;
  name: string;
  zone: string;
  end: string;
  status: ClientStatus;
  dday?: number;
};

const CLIENTS: ClientRow[] = [
  {
    id: 1,
    name: "A프로덕션 미술팀",
    zone: "A존 (A3, A4)",
    end: "2026.07.05",
    status: "stable",
  },
  {
    id: 2,
    name: "B스튜디오",
    zone: "B존 (B1, B2, B3)",
    end: "2026.06.30",
    status: "stable",
  },
  {
    id: 3,
    name: "C필름 미술팀",
    zone: "A존 (A7)",
    end: "2026.04.09",
    status: "expiring",
    dday: 3,
  },
  {
    id: 4,
    name: "D엔터테인먼트",
    zone: "A존 (A9, A10)",
    end: "2026.05.20",
    status: "stable",
  },
  {
    id: 5,
    name: "E픽처스",
    zone: "B존 (B5, B6)",
    end: "2026.06.01",
    status: "stable",
  },
  {
    id: 6,
    name: "F미술팀",
    zone: "B존 (B9, B10, B11)",
    end: "2026.08.15",
    status: "stable",
  },
  {
    id: 7,
    name: "G프로덕션",
    zone: "A존 (A1, A2)",
    end: "2026.05.31",
    status: "stable",
  },
];

const TOTAL = 20;
const USED = Object.keys(GRID_STATUS).length;
const EMPTY = TOTAL - USED;

function GridCell({ id }: { id: string }) {
  const info = GRID_STATUS[id];
  if (!info) {
    return (
      <div
        style={{
          flex: 1,
          height: 52,
          borderRadius: 8,
          border: "1.5px dashed #D1D5DB",
          background: "#FAFAFA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 9, color: "#D1D5DB", fontWeight: 500 }}>
          {id}
        </span>
      </div>
    );
  }
  const isExp = info.status === "expiring";
  return (
    <div
      style={{
        flex: 1,
        height: 52,
        borderRadius: 8,
        background: isExp ? "#FFF7ED" : "#EFF6FF",
        border: `1.5px solid ${isExp ? "#FED7AA" : "#BFDBFE"}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isExp && (
        <span
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            fontSize: 8,
            fontWeight: 800,
            color: "#fff",
            background: ORANGE,
            padding: "1px 4px",
            borderRadius: 4,
          }}
        >
          D-{info.dday}
        </span>
      )}
      <span
        style={{
          fontSize: 9,
          color: isExp ? ORANGE : "#93C5FD",
          fontWeight: 600,
        }}
      >
        {id}
      </span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: isExp ? "#C2410C" : BLUE,
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {info.clientShort}
      </span>
    </div>
  );
}

export default function ReservationPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("reserve");
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div
      style={{
        background: "#F3F4F6",
        minHeight: "100vh",
        fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100vh", paddingBottom: 90 }}>
        {/* HEADER */}
        <header
          style={{
            background: "#111827",
            position: "sticky",
            top: 0,
            zIndex: 50,
            padding: "16px 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                flexShrink: 0,
                padding: 4,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              aria-label="뒤로 가기"
            >
              <ChevronLeft size={22} color="#D1D5DB" />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: "#fff",
                  letterSpacing: "-0.5px",
                }}
              >
                예약 및 공간 관리
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#9CA3AF",
                  background: "#374151",
                  padding: "2px 8px",
                  borderRadius: 99,
                }}
              >
                ADMIN
              </span>
            </div>
          </div>
        </header>

        <div
          style={{
            padding: "16px 16px 0",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* SUMMARY */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              {
                label: "전체 Grid",
                value: TOTAL,
                color: "#374151",
                bg: "#fff",
                border: "#E5E7EB",
              },
              {
                label: "사용 중",
                value: USED,
                color: BLUE,
                bg: "#EFF6FF",
                border: "#BFDBFE",
              },
              {
                label: "공실",
                value: EMPTY,
                color: GREEN,
                bg: "#ECFDF5",
                border: "#A7F3D0",
              },
            ].map(({ label, value, color, bg, border }) => (
              <div
                key={label}
                style={{
                  background: bg,
                  borderRadius: 12,
                  padding: "12px 10px",
                  border: `1.5px solid ${border}`,
                  textAlign: "center",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                }}
              >
                <p style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: "-0.5px" }}>
                  {value}
                </p>
                <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, marginTop: 2 }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* LEGEND */}
          <div style={{ display: "flex", gap: 12, paddingLeft: 2 }}>
            {[
              { color: "#BFDBFE", bg: "#EFF6FF", label: "사용 중" },
              { color: "#FED7AA", bg: "#FFF7ED", label: "퇴실 임박" },
              { color: "#D1D5DB", bg: "#FAFAFA", label: "공실", dashed: true },
            ].map(({ color, bg, label, dashed }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    background: bg,
                    border: `1.5px ${dashed ? "dashed" : "solid"} ${color}`,
                  }}
                />
                <span style={{ fontSize: 11, color: "#6B7280" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* GRID MAP */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              padding: "16px 14px",
            }}
          >
            {Object.entries(ZONES).map(([zone, rows], zi) => (
              <div
                key={zone}
                style={{
                  marginBottom: zi < Object.keys(ZONES).length - 1 ? 16 : 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#fff",
                      background: zone === "A" ? BLUE : "#7C3AED",
                      padding: "2px 10px",
                      borderRadius: 99,
                    }}
                  >
                    {zone}존
                  </span>
                  <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {rows.map((row, ri) => (
                    <div key={ri} style={{ display: "flex", gap: 6 }}>
                      {row.map((id) => (
                        <GridCell key={id} id={id} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CLIENT LIST */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#6B7280", marginBottom: 10, paddingLeft: 2 }}>
              계약 현황 ({CLIENTS.length}건)
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {CLIENTS.map(({ id, name, zone, end, status, dday }) => {
                const isExp = status === "expiring";
                return (
                  <button
                    key={id}
                    onClick={() => setSelected(selected === id ? null : id)}
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      border: `1.5px solid ${isExp ? "#FED7AA" : "#F3F4F6"}`,
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                      transition: "all 0.15s",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: isExp ? "#FFF7ED" : "#EFF6FF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 900, color: isExp ? ORANGE : BLUE }}>
                        {name[0]}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{name}</p>
                        {isExp && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              color: "#fff",
                              background: ORANGE,
                              padding: "2px 6px",
                              borderRadius: 99,
                              flexShrink: 0,
                            }}
                          >
                            D-{dday}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 2 }}>{zone}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {isExp ? (
                          <AlertTriangle size={11} color={ORANGE} />
                        ) : (
                          <CheckCircle2 size={11} color={GREEN} />
                        )}
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: isExp ? ORANGE : "#9CA3AF",
                          }}
                        >
                          계약 종료: {end}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      color="#D1D5DB"
                      style={{
                        flexShrink: 0,
                        transform: selected === id ? "rotate(90deg)" : "none",
                        transition: "transform 0.2s",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM NAV */}
        <nav
          style={{
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: 430,
            background: "#fff",
            borderTop: "1px solid #E5E7EB",
            display: "flex",
            justifyContent: "space-around",
            padding: "10px 0 14px",
            zIndex: 100,
          }}
        >
          {navItems.map(({ id, icon: Icon, label }) => {
            const active = activeNav === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (id === "dash") {
                    setActiveNav("dash");
                    router.push("/admin");
                  } else if (id === "reserve") {
                    setActiveNav("reserve");
                    router.push("/reservation");
                  } else if (id === "billing") {
                    alert("관리자용 정산 내역 화면은 준비 중입니다.");
                  } else if (id === "setting") {
                    alert("준비 중인 기능입니다.");
                  }
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  minWidth: 60,
                }}
              >
                <Icon size={22} color={active ? BLUE : "#9CA3AF"} strokeWidth={active ? 2.2 : 1.8} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: active ? 700 : 400,
                    color: active ? BLUE : "#9CA3AF",
                  }}
                >
                  {label}
                </span>
                {active && <span style={{ width: 4, height: 4, borderRadius: "50%", background: BLUE, marginTop: -2 }} />}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}


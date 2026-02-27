import { getMyLedgerSummary, MeSummary } from "@/api/ledger.api";
import { useEffect, useState } from "react";

const fmt = (cents:number) =>
  (cents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" });

const AVATAR_COLORS = [
  "#7C3AED", "#9333EA", "#6366F1", "#0EA5E9", "#10B981",
];

function Avatar({ name, initials, index, size = 32 } : {name: string, initials: string, index: number, size: number}) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: size * 0.38,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        flexShrink: 0,
        letterSpacing: "0.01em",
      }}
    >
      {initials || name[0].toUpperCase()}
    </div>
  );
}

function CounterpartyRow({ person, index }: {person: any, index: number}) {
  const owesMe = person.netCents > 0;
  const isEven = person.netCents === 0;
  const netAbs = Math.abs(person.netCents);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 0",
        borderBottom: "1px solid #F1F0F5",
      }}
    >
      <Avatar name={person.name} initials={person.initials} index={index} size={30} />

      <span
        style={{
          flex: 1,
          fontSize: 13.5,
          fontWeight: 500,
          color: "#1A1523",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {person.name}
      </span>

      <div style={{ textAlign: "right" }}>
        {isEven ? (
          <span style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "'DM Sans', sans-serif" }}>
            settled up
          </span>
        ) : (
          <>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: owesMe ? "#059669" : "#DC2626",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {owesMe ? "+" : "-"}{fmt(netAbs)}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#9CA3AF",
                fontFamily: "'DM Sans', sans-serif",
                marginTop: 1,
              }}
            >
              {owesMe ? "owes you" : "you owe"}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function LedgerBalancePanel() {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<MeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyLedgerSummary()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-sm text-slate-400">Loading...</div>;
  if (!data) return null;

  const isNetPositive = data.netCents >= 0;
  const hasActivity = data.counterparties.length > 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        .balance-panel {
          background: #fff;
          border-radius: 14px;
          border: 1px solid #E5E4ED;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          width: 100%;
        }

        .panel-header {
          padding: 14px 16px 12px;
          cursor: pointer;
          user-select: none;
        }

        .panel-header:hover {
          background: #FAFAFA;
        }

        .net-bar {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }

        .bar-segment {
          height: 4px;
          border-radius: 99px;
          transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
        }

        .counterparties {
          padding: 0 16px 4px;
          animation: slideDown 0.2s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .chevron {
          transition: transform 0.2s ease;
        }
        .chevron.open {
          transform: rotate(180deg);
        }

        .stat-pill {
          display: flex;
          flex-direction: column;
          flex: 1;
          background: #F7F6FC;
          border-radius: 10px;
          padding: 9px 12px;
        }
      `}</style>

      <div className="balance-panel">
        {/* ── Header / Summary ── */}
        <div
          className="panel-header"
          onClick={() => setExpanded((v) => !v)}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#6B6880", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              My Balance
            </span>
            <svg
              className={`chevron ${expanded ? "open" : ""}`}
              width="16" height="16" viewBox="0 0 16 16" fill="none"
            >
              <path d="M4 6l4 4 4-4" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Net amount */}
          <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{
              fontSize: 26,
              fontWeight: 700,
              color: isNetPositive ? "#059669" : "#DC2626",
              letterSpacing: "-0.5px",
            }}>
              {isNetPositive ? "+" : ""}{fmt(data.netCents)}
            </span>
            <span style={{ fontSize: 12.5, color: "#9CA3AF" }}>
              {isNetPositive ? "net owed to you" : "net you owe"}
            </span>
          </div>

          {/* Owe / Owed pills */}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <div className="stat-pill">
              <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500, marginBottom: 2 }}>
                YOU OWE
              </span>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#DC2626" }}>
                {fmt(data.totalIOweCents)}
              </span>
            </div>
            <div className="stat-pill">
              <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500, marginBottom: 2 }}>
                OWED TO YOU
              </span>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#059669" }}>
                {fmt(data.totalOwedToMeCents)}
              </span>
            </div>
          </div>

          {/* Visual bar */}
          {hasActivity && (() => {
            const total = data.totalIOweCents + data.totalOwedToMeCents;
            const owePct = total > 0 ? (data.totalIOweCents / total) * 100 : 0;
            const owedPct = 100 - owePct;
            return (
              <div className="net-bar" style={{ marginTop: 10 }}>
                {owePct > 0 && (
                  <div className="bar-segment" style={{ width: `${owePct}%`, background: "#FCA5A5" }} />
                )}
                {owedPct > 0 && (
                  <div className="bar-segment" style={{ width: `${owedPct}%`, background: "#6EE7B7" }} />
                )}
              </div>
            );
          })()}
        </div>

        {/* ── Expanded counterparty list ── */}
        {expanded && (
          <div className="counterparties">
            {data.counterparties.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9CA3AF", padding: "12px 0", textAlign: "center" }}>
                All settled up 🎉
              </p>
            ) : (
              data.counterparties.map((person, i) => (
                <CounterpartyRow key={person.userId} person={person} index={i} />
              ))
            )}
            <div style={{ height: 8 }} />
          </div>
        )}
      </div>
    </>
  );
}
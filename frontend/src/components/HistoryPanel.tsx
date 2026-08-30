import React from "react";
import type { AuditHistoryItem } from "../types";
import { History, Eye } from "lucide-react";

interface HistoryPanelProps {
  history: AuditHistoryItem[];
  onSelectAudit: (item: AuditHistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onSelectAudit,
  onClearHistory,
}) => {
  const getBadge = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return { bg: "#ef4444", text: "#ffffff" };
      case "HIGH":
        return { bg: "#f97316", text: "#ffffff" };
      case "MEDIUM":
        return { bg: "#f59e0b", text: "#ffffff" };
      case "LOW":
      default:
        return { bg: "#10b981", text: "#ffffff" };
    }
  };

  return (
    <div style={{
      backgroundColor: "#0f172a",
      border: "1px solid #1e293b",
      borderRadius: "12px",
      padding: "1.25rem",
      display: "flex",
      flexDirection: "column",
      gap: "1rem"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #1e293b",
        paddingBottom: "0.75rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <History size={18} color="#38bdf8" />
          <span style={{ fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            Session Audit Dossier Registry ({history.length})
          </span>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            style={{
              backgroundColor: "transparent",
              border: "1px solid #1e293b",
              borderRadius: "4px",
              padding: "3px 8px",
              fontSize: "0.725rem",
              color: "#94a3b8",
              cursor: "pointer"
            }}
          >
            Clear Session
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div style={{
          padding: "2rem 1rem",
          textAlign: "center",
          color: "#64748b",
          fontSize: "0.825rem"
        }}>
          No audits executed in this session yet. Run a live analysis to populate this registry.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {history.map((item) => {
            const badge = getBadge(item.response.risk_level);
            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: "#131d33",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "0.85rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className="font-mono" style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>
                      {item.request.project_id}
                    </span>
                    <span style={{
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      backgroundColor: badge.bg,
                      color: badge.text,
                      padding: "2px 6px",
                      borderRadius: "3px"
                    }}>
                      {item.response.risk_level} ({item.response.overall_risk_score}/100)
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    {item.request.district} • {item.request.work_category} • ₹{item.request.sanctioned_amount_inr.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                    {item.response.alerts.length} Alert(s) Flagged • {item.analyzedAt}
                  </div>
                </div>

                <button
                  onClick={() => onSelectAudit(item)}
                  style={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "6px",
                    padding: "0.45rem 0.85rem",
                    color: "#38bdf8",
                    fontSize: "0.775rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem"
                  }}
                >
                  <Eye size={14} />
                  Inspect Dossier
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

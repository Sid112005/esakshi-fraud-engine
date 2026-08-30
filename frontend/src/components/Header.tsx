import React from "react";
import { ShieldCheck, Activity, Radio, Database, Camera } from "lucide-react";

interface HeaderProps {
  serverStatus: "checking" | "online" | "offline";
  activeTab: "simulation" | "milestone" | "dashboard" | "history";
  onTabChange: (tab: "simulation" | "milestone" | "dashboard" | "history") => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  serverStatus,
  activeTab,
  onTabChange,
  historyCount,
}) => {
  return (
    <header style={{
      borderBottom: "1px solid #1e293b",
      backgroundColor: "rgba(15, 23, 42, 0.85)",
      backdropFilter: "blur(12px)",
      position: "sticky",
      top: 0,
      zIndex: 50,
      padding: "0.75rem 1.5rem"
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap"
      }}>
        {/* Logo & Government Identity */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 15px rgba(14, 165, 233, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.2)"
          }}>
            <ShieldCheck size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#f8fafc" }}>
                e-SAKSHI
              </span>
              <span style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                backgroundColor: "rgba(56, 189, 248, 0.15)",
                color: "#38bdf8",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                padding: "2px 6px",
                borderRadius: "4px"
              }}>
                SIH26102
              </span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 }}>
              Forensic Intelligence & Fraud Detection Engine • MoSPI / MPLADS
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Pipeline Sequence: Sanction -> Milestone -> Analytics -> Log) */}
        <nav style={{
          display: "flex",
          gap: "0.35rem",
          backgroundColor: "#0b1120",
          padding: "4px",
          borderRadius: "8px",
          border: "1px solid #1e293b",
          flexWrap: "wrap"
        }}>
          <button
            onClick={() => onTabChange("simulation")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.45rem 0.9rem",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "0.825rem",
              fontWeight: 600,
              transition: "all 0.15s ease",
              backgroundColor: activeTab === "simulation" ? "#0284c7" : "transparent",
              color: activeTab === "simulation" ? "#ffffff" : "#94a3b8"
            }}
          >
            <Activity size={15} />
            Live Forensic Audit
          </button>

          <button
            onClick={() => onTabChange("milestone")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.45rem 0.9rem",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "0.825rem",
              fontWeight: 600,
              transition: "all 0.15s ease",
              backgroundColor: activeTab === "milestone" ? "#0284c7" : "transparent",
              color: activeTab === "milestone" ? "#ffffff" : "#94a3b8"
            }}
          >
            <Camera size={15} />
            Milestone Verification
          </button>

          <button
            onClick={() => onTabChange("dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.45rem 0.9rem",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "0.825rem",
              fontWeight: 600,
              transition: "all 0.15s ease",
              backgroundColor: activeTab === "dashboard" ? "#0284c7" : "transparent",
              color: activeTab === "dashboard" ? "#ffffff" : "#94a3b8"
            }}
          >
            <Database size={15} />
            Scheme Analytics
          </button>

          <button
            onClick={() => onTabChange("history")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.45rem 0.9rem",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "0.825rem",
              fontWeight: 600,
              transition: "all 0.15s ease",
              backgroundColor: activeTab === "history" ? "#0284c7" : "transparent",
              color: activeTab === "history" ? "#ffffff" : "#94a3b8"
            }}
          >
            Audit Log ({historyCount})
          </button>
        </nav>

        {/* Live Server Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: "20px",
            backgroundColor:
              serverStatus === "online"
                ? "rgba(16, 185, 129, 0.12)"
                : serverStatus === "checking"
                ? "rgba(245, 158, 11, 0.12)"
                : "rgba(239, 68, 68, 0.12)",
            color:
              serverStatus === "online"
                ? "#34d399"
                : serverStatus === "checking"
                ? "#fbbf24"
                : "#f87171",
            border: `1px solid ${
              serverStatus === "online"
                ? "rgba(16, 185, 129, 0.3)"
                : serverStatus === "checking"
                ? "rgba(245, 158, 11, 0.3)"
                : "rgba(239, 68, 68, 0.3)"
            }`
          }}>
            <Radio size={13} />
            {serverStatus === "online" && "FastAPI Engine: Active (8000)"}
            {serverStatus === "checking" && "Connecting to Engine..."}
            {serverStatus === "offline" && "FastAPI Offline"}
          </div>
        </div>
      </div>
    </header>
  );
};

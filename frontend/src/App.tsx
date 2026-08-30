import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { DashboardHome } from "./components/DashboardHome";
import { SimulationForm } from "./components/SimulationForm";
import { MilestoneVerification } from "./components/MilestoneVerification";
import { HistoryPanel } from "./components/HistoryPanel";
import { RiskResultCard } from "./components/RiskResultCard";
import type {
  ProjectSanctionRequest,
  RiskAssessmentResponse,
  AuditHistoryItem,
} from "./types";
import { DEFAULT_API_BASE_URL } from "./config";
import { ArrowLeft } from "lucide-react";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"simulation" | "milestone" | "dashboard" | "history">("simulation");
  const [apiBaseUrl] = useState<string>(DEFAULT_API_BASE_URL);
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<AuditHistoryItem | null>(null);

  // Poll backend health status
  const checkServerHealth = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/`, { method: "GET" });
      if (res.ok) {
        setServerStatus("online");
      } else {
        setServerStatus("offline");
      }
    } catch {
      setServerStatus("offline");
    }
  };

  useEffect(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 10000);
    return () => clearInterval(interval);
  }, [apiBaseUrl]);

  const handleAuditComplete = (req: ProjectSanctionRequest, res: RiskAssessmentResponse) => {
    const newItem: AuditHistoryItem = {
      id: `${res.project_id}-${Date.now()}`,
      request: req,
      response: res,
      analyzedAt: new Date().toLocaleTimeString(),
    };

    setHistory((prev) => [newItem, ...prev.slice(0, 9)]); // Keep last 10
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navigation Header */}
      <Header
        serverStatus={serverStatus}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedHistoryItem(null);
        }}
        historyCount={history.length}
      />

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        maxWidth: "1400px",
        width: "100%",
        margin: "0 auto",
        padding: "1.75rem 1.5rem"
      }}>
        {activeTab === "simulation" && (
          <SimulationForm
            apiBaseUrl={apiBaseUrl}
            onAuditComplete={handleAuditComplete}
          />
        )}

        {activeTab === "milestone" && (
          <MilestoneVerification />
        )}

        {activeTab === "dashboard" && (
          <DashboardHome onGoToSimulation={() => setActiveTab("simulation")} />
        )}

        {activeTab === "history" && (
          <div>
            {selectedHistoryItem ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <button
                    onClick={() => setSelectedHistoryItem(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      backgroundColor: "#131d33",
                      border: "1px solid #1e293b",
                      borderRadius: "6px",
                      padding: "0.45rem 0.85rem",
                      color: "#38bdf8",
                      fontSize: "0.825rem",
                      cursor: "pointer"
                    }}
                  >
                    <ArrowLeft size={16} />
                    Back to History Log
                  </button>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    Audited at: {selectedHistoryItem.analyzedAt}
                  </span>
                </div>
                <RiskResultCard result={selectedHistoryItem.response} />
              </div>
            ) : (
              <HistoryPanel
                history={history}
                onSelectAudit={(item) => setSelectedHistoryItem(item)}
                onClearHistory={() => setHistory([])}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid #1e293b",
        backgroundColor: "#0b1120",
        padding: "1rem 1.5rem",
        textAlign: "center",
        fontSize: "0.75rem",
        color: "#64748b"
      }}>
        e-SAKSHI Forensic Intelligence Engine • Smart India Hackathon (SIH26102) • Ministry of Statistics and Programme Implementation (MoSPI)
      </footer>
    </div>
  );
};

export default App;

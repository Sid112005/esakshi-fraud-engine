import React, { useState } from "react";
import type {
  ProjectSanctionRequest,
  RiskAssessmentResponse,
} from "../types";
import { WORK_CATEGORIES, KNOWN_DISTRICTS } from "../config";
import { DEMO_SCENARIOS } from "../data/mockScenarios";
import type { DemoScenario } from "../data/mockScenarios";
import { RiskResultCard } from "./RiskResultCard";
import {
  Sparkles,
  Send,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  AlertCircle
} from "lucide-react";

interface SimulationFormProps {
  apiBaseUrl: string;
  onAuditComplete: (req: ProjectSanctionRequest, res: RiskAssessmentResponse) => void;
}

export const SimulationForm: React.FC<SimulationFormProps> = ({
  apiBaseUrl,
  onAuditComplete,
}) => {
  const [formData, setFormData] = useState<ProjectSanctionRequest>({
    project_id: "MPLAD-2026-1045",
    mp_name: "AASHTIKAR PATIL NAGESH BAPURAO",
    district: "Thane",
    work_category: "Solar Street Light",
    project_description: "Installation of 20 high-mast solar lights in Sector 4",
    sanctioned_amount_inr: 3750000.0,
    implementing_agency: "Apex Infra Pvt Ltd",
    sanction_date: new Date().toISOString().slice(0, 10),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<RiskAssessmentResponse | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "sanctioned_amount_inr" ? parseFloat(value) || 0 : value,
    }));
    setActiveScenarioId(null);
  };

  const loadScenario = (scenario: DemoScenario) => {
    setFormData({ ...scenario.payload });
    setActiveScenarioId(scenario.id);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/detect-fraud`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Engine returned HTTP ${response.status}: ${response.statusText}`);
      }

      const data: RiskAssessmentResponse = await response.json();
      setCurrentResult(data);
      onAuditComplete(formData, data);
    } catch (err: any) {
      console.error("Forensic Engine Request Failed:", err);
      setError(
        err?.message || "Failed to reach e-SAKSHI backend. Ensure uvicorn is running on http://127.0.0.1:8000"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* 1-Click Judge Presentation Presets */}
      <div style={{
        backgroundColor: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "12px",
        padding: "1.25rem"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.85rem",
          justifyContent: "space-between",
          flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Sparkles size={17} color="#38bdf8" />
            <span style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              1-Click Demo Scenarios for Pitch & Evaluation
            </span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
            Instant preloads matching verified backend test vectors
          </span>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "0.75rem"
        }}>
          {DEMO_SCENARIOS.map((sc) => {
            const isSelected = activeScenarioId === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => loadScenario(sc)}
                style={{
                  backgroundColor: isSelected ? "#1e293b" : "#131d33",
                  border: isSelected ? "1px solid #38bdf8" : "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "0.85rem",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 0 12px rgba(56, 189, 248, 0.2)" : "none"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.825rem", fontWeight: 700, color: "#f8fafc" }}>
                    {sc.name}
                  </span>
                </div>
                <div style={{ fontSize: "0.725rem", color: "#94a3b8", lineHeight: 1.4 }}>
                  {sc.description}
                </div>
                <div style={{
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  color: isSelected ? "#38bdf8" : "#64748b",
                  marginTop: "2px"
                }}>
                  {sc.expectedOutcome}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Form Left, Results Right */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
        gap: "1.5rem",
        alignItems: "start"
      }}>
        
        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: "12px",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.1rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1e293b", paddingBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <SlidersHorizontal size={17} color="#38bdf8" />
              <span style={{ fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Project Sanction Payload
              </span>
            </div>
            <span style={{ fontSize: "0.725rem", color: "#64748b" }}>POST /api/v1/detect-fraud</span>
          </div>

          {/* Row 1: Project ID & Date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>
                Project ID
              </label>
              <input
                type="text"
                name="project_id"
                value={formData.project_id}
                onChange={handleInputChange}
                required
                className="font-mono"
                style={{
                  width: "100%",
                  backgroundColor: "#131d33",
                  border: "1px solid #1e293b",
                  borderRadius: "6px",
                  padding: "0.55rem 0.75rem",
                  color: "#f8fafc",
                  outline: "none"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>
                Sanction Date
              </label>
              <input
                type="date"
                name="sanction_date"
                value={formData.sanction_date}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  backgroundColor: "#131d33",
                  border: "1px solid #1e293b",
                  borderRadius: "6px",
                  padding: "0.55rem 0.75rem",
                  color: "#f8fafc",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* Row 2: MP Name & District */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>
                Hon'ble MP Name (MoSPI Verified)
              </label>
              <input
                type="text"
                name="mp_name"
                value={formData.mp_name}
                onChange={handleInputChange}
                required
                placeholder="e.g. AASHTIKAR PATIL NAGESH BAPURAO"
                style={{
                  width: "100%",
                  backgroundColor: "#131d33",
                  border: "1px solid #1e293b",
                  borderRadius: "6px",
                  padding: "0.55rem 0.75rem",
                  color: "#f8fafc",
                  outline: "none"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>
                District
              </label>
              <select
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  backgroundColor: "#131d33",
                  border: "1px solid #1e293b",
                  borderRadius: "6px",
                  padding: "0.55rem 0.75rem",
                  color: "#f8fafc",
                  outline: "none"
                }}
              >
                {KNOWN_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Work Category & Amount */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>
                Work Category
              </label>
              <select
                name="work_category"
                value={formData.work_category}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  backgroundColor: "#131d33",
                  border: "1px solid #1e293b",
                  borderRadius: "6px",
                  padding: "0.55rem 0.75rem",
                  color: "#f8fafc",
                  outline: "none"
                }}
              >
                {WORK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>
                Sanction Amount (₹ INR)
              </label>
              <input
                type="number"
                name="sanctioned_amount_inr"
                value={formData.sanctioned_amount_inr}
                onChange={handleInputChange}
                required
                step="1000"
                className="font-mono"
                style={{
                  width: "100%",
                  backgroundColor: "#131d33",
                  border: "1px solid #1e293b",
                  borderRadius: "6px",
                  padding: "0.55rem 0.75rem",
                  color: "#38bdf8",
                  fontWeight: 600,
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* Row 4: Implementing Agency */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>
              Implementing Agency / Contractor
            </label>
            <input
              type="text"
              name="implementing_agency"
              value={formData.implementing_agency}
              onChange={handleInputChange}
              required
              placeholder="e.g. Apex Infra Pvt Ltd or Contractor_37"
              style={{
                width: "100%",
                backgroundColor: "#131d33",
                border: "1px solid #1e293b",
                borderRadius: "6px",
                padding: "0.55rem 0.75rem",
                color: "#f8fafc",
                outline: "none"
              }}
            />
          </div>

          {/* Row 5: Project Description */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>
              Detailed Project Description (Sentence-BERT Semantic Matching)
            </label>
            <textarea
              name="project_description"
              value={formData.project_description}
              onChange={handleInputChange}
              required
              rows={3}
              placeholder="Enter comprehensive scope of work sentence..."
              style={{
                width: "100%",
                backgroundColor: "#131d33",
                border: "1px solid #1e293b",
                borderRadius: "6px",
                padding: "0.55rem 0.75rem",
                color: "#f8fafc",
                outline: "none",
                resize: "vertical",
                lineHeight: 1.5
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: "#0284c7",
                border: "none",
                borderRadius: "6px",
                padding: "0.75rem 1.25rem",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: "0 0 15px rgba(2, 132, 199, 0.35)",
                transition: "background-color 0.15s ease"
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Running 5 AI Forensic Modules...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Execute Forensic Fraud Audit
                </>
              )}
            </button>
          </div>
        </form>

        {/* Results Container */}
        <div>
          {error && (
            <div style={{
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid #ef4444",
              borderRadius: "10px",
              padding: "1.25rem",
              color: "#fca5a5",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              marginBottom: "1rem"
            }}>
              <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "4px" }}>
                  Backend Execution Failure
                </div>
                <div style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>
                  {error}
                </div>
              </div>
            </div>
          )}

          {currentResult ? (
            <RiskResultCard result={currentResult} />
          ) : (
            <div style={{
              backgroundColor: "#0f172a",
              border: "1px dashed #1e293b",
              borderRadius: "12px",
              padding: "3rem 2rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              color: "#64748b"
            }}>
              <Layers size={36} color="#334155" />
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#94a3b8" }}>
                Awaiting Audit Execution
              </div>
              <div style={{ fontSize: "0.8rem", maxWidth: "340px", lineHeight: 1.5 }}>
                Select a 1-click scenario preset above or customize the project payload and click <strong>"Execute Forensic Fraud Audit"</strong>.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from "react";
import type {
  ProjectSanctionRequest,
  RiskAssessmentResponse,
} from "../types";
import { WORK_CATEGORIES, STATE_DISTRICTS, STATES } from "../config";
import { DEMO_SCENARIOS } from "../data/mockScenarios";
import type { DemoScenario } from "../data/mockScenarios";
import { RiskResultCard } from "./RiskResultCard";
import {
  Sparkles,
  Send,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  AlertCircle,
  Calendar,
  MapPin,
  Search,
  CheckCircle2
} from "lucide-react";

interface MPRecord {
  id: string;
  mp_name: string;
  constituency: string;
  state: string;
  allocated_amount_inr: number;
}

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
    state: "Maharashtra",
    district: "Thane",
    work_category: "Solar Street Light",
    project_description: "Installation of 20 high-mast solar lights in Sector 4",
    sanctioned_amount_inr: 3750000.0,
    implementing_agency: "Apex Infra Pvt Ltd",
    sanction_date: new Date().toISOString().slice(0, 10),
    expected_completion_date: "",
    actual_completion_date: "",
  });

  const [mpList, setMpList] = useState<MPRecord[]>([]);
  const [mpSearchQuery, setMpSearchQuery] = useState<string>("AASHTIKAR PATIL NAGESH BAPURAO");
  const [isMpDropdownOpen, setIsMpDropdownOpen] = useState(false);
  const mpDropdownRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<RiskAssessmentResponse | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  // Fetch official MoSPI verified MP list on component mount
  useEffect(() => {
    const fetchMps = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/v1/mp-list`);
        if (res.ok) {
          const data = await res.json();
          if (data.mps && Array.isArray(data.mps)) {
            setMpList(data.mps);
          }
        }
      } catch (err) {
        console.error("Failed to load MP list:", err);
      }
    };
    fetchMps();
  }, [apiBaseUrl]);

  // Close MP dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mpDropdownRef.current && !mpDropdownRef.current.contains(event.target as Node)) {
        setIsMpDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    const availableDistricts = STATE_DISTRICTS[newState] || ["General"];
    setFormData((prev) => ({
      ...prev,
      state: newState,
      district: availableDistricts[0],
    }));
    setActiveScenarioId(null);
  };

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

  const handleSelectMp = (mp: MPRecord) => {
    setFormData((prev) => {
      const matchState = Object.keys(STATE_DISTRICTS).find(
        (s) => s.toLowerCase() === mp.state.toLowerCase()
      ) || prev.state || "Maharashtra";
      const availableDistricts = STATE_DISTRICTS[matchState] || ["General"];
      return {
        ...prev,
        mp_name: mp.mp_name,
        state: matchState,
        district: availableDistricts[0],
      };
    });
    setMpSearchQuery(mp.mp_name);
    setIsMpDropdownOpen(false);
    setActiveScenarioId(null);
  };

  const loadScenario = (scenario: DemoScenario) => {
    setFormData({ ...scenario.payload });
    setMpSearchQuery(scenario.payload.mp_name);
    setActiveScenarioId(scenario.id);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        expected_completion_date: formData.expected_completion_date?.trim() || null,
        actual_completion_date: formData.actual_completion_date?.trim() || null,
      };

      const response = await fetch(`${apiBaseUrl}/api/v1/detect-fraud`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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

  const filteredMps = mpList.filter((mp) => {
    const query = mpSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      mp.mp_name.toLowerCase().includes(query) ||
      mp.constituency.toLowerCase().includes(query) ||
      mp.state.toLowerCase().includes(query)
    );
  }).slice(0, 8); // Top 8 suggestions

  const currentDistricts = formData.state && STATE_DISTRICTS[formData.state]
    ? STATE_DISTRICTS[formData.state]
    : STATE_DISTRICTS["Maharashtra"];

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
            National test vectors across Maharashtra, J&K, Bihar, etc.
          </span>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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

          {/* Row 1: Project ID & Sanction Date */}
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

          {/* Row 2: MP Name Searchable Combobox & Work Category */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1rem" }}>
            <div ref={mpDropdownRef} style={{ position: "relative" }}>
              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 600, color: "#38bdf8", marginBottom: "4px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Search size={12} />
                  Hon'ble MP Name (MoSPI Verified)
                </span>
                <span style={{ fontSize: "0.68rem", color: "#64748b" }}>{mpList.length} Verified MPs</span>
              </label>
              
              <input
                type="text"
                value={mpSearchQuery}
                onFocus={() => setIsMpDropdownOpen(true)}
                onChange={(e) => {
                  setMpSearchQuery(e.target.value);
                  setFormData((prev) => ({ ...prev, mp_name: e.target.value }));
                  setIsMpDropdownOpen(true);
                  setActiveScenarioId(null);
                }}
                required
                placeholder="Type MP Name or Constituency..."
                style={{
                  width: "100%",
                  backgroundColor: "#131d33",
                  border: "1px solid #38bdf8",
                  borderRadius: "6px",
                  padding: "0.55rem 0.75rem",
                  color: "#f8fafc",
                  outline: "none",
                  fontWeight: 600
                }}
              />

              {/* Suggestions Dropdown */}
              {isMpDropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "#0f172a",
                  border: "1px solid #38bdf8",
                  borderRadius: "6px",
                  marginTop: "4px",
                  maxHeight: "220px",
                  overflowY: "auto",
                  zIndex: 60,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.6)"
                }}>
                  {filteredMps.length > 0 ? (
                    filteredMps.map((mp) => (
                      <div
                        key={mp.id}
                        onClick={() => handleSelectMp(mp)}
                        style={{
                          padding: "0.5rem 0.75rem",
                          borderBottom: "1px solid #1e293b",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: "0.775rem",
                          transition: "background-color 0.12s ease"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e293b")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: "#f8fafc" }}>
                            {mp.mp_name}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                            {mp.constituency} • {mp.state}
                          </div>
                        </div>
                        <CheckCircle2 size={13} color="#38bdf8" />
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "0.75rem", fontSize: "0.75rem", color: "#64748b", textAlign: "center" }}>
                      No exact MoSPI match found.
                    </div>
                  )}
                </div>
              )}
            </div>

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
          </div>

          {/* Row 3: Cascading State & District Dropdowns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", fontWeight: 600, color: "#38bdf8", marginBottom: "4px" }}>
                <MapPin size={13} />
                State (National Pool)
              </label>
              <select
                name="state"
                value={formData.state || "Maharashtra"}
                onChange={handleStateChange}
                required
                style={{
                  width: "100%",
                  backgroundColor: "#131d33",
                  border: "1px solid #38bdf8",
                  borderRadius: "6px",
                  padding: "0.55rem 0.75rem",
                  color: "#f8fafc",
                  outline: "none"
                }}
              >
                {STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>
                District (Cascading)
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
                {currentDistricts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Amount & Implementing Agency */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
                placeholder="e.g. Apex Infra Pvt Ltd or Contractor_11"
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

          {/* Row 5: Optional Timeline & Delay Audit Dates */}
          <div style={{
            backgroundColor: "rgba(11, 17, 32, 0.6)",
            border: "1px solid #1e293b",
            borderRadius: "8px",
            padding: "0.85rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", fontWeight: 700, color: "#fbbf24" }}>
              <Calendar size={14} />
              Project Execution Timeline & Delay Audit (Optional)
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.7rem", color: "#94a3b8", marginBottom: "3px" }}>
                  Expected Completion Date
                </label>
                <input
                  type="date"
                  name="expected_completion_date"
                  value={formData.expected_completion_date || ""}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    backgroundColor: "#131d33",
                    border: "1px solid #1e293b",
                    borderRadius: "6px",
                    padding: "0.45rem 0.65rem",
                    color: "#f8fafc",
                    outline: "none",
                    fontSize: "0.8rem"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.7rem", color: "#94a3b8", marginBottom: "3px" }}>
                  Actual Completion Date (or leave blank if ongoing)
                </label>
                <input
                  type="date"
                  name="actual_completion_date"
                  value={formData.actual_completion_date || ""}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    backgroundColor: "#131d33",
                    border: "1px solid #1e293b",
                    borderRadius: "6px",
                    padding: "0.45rem 0.65rem",
                    color: "#f8fafc",
                    outline: "none",
                    fontSize: "0.8rem"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Row 6: Project Description */}
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
                  Running 6 AI Forensic Modules...
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

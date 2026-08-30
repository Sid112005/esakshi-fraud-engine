import React, { useState, useEffect } from "react";
import { DEFAULT_API_BASE_URL, type UserRole } from "../config";
import type { SchemeTrendsResponse, PredictiveAlert } from "../types";
import {
  Coins,
  MapPin,
  ArrowRight,
  TrendingUp,
  Clock,
  RefreshCw,
  ShieldAlert,
  BarChart3
} from "lucide-react";

interface DashboardHomeProps {
  onGoToSimulation: () => void;
  userRole: UserRole;
  selectedState: string;
  selectedDistrict: string;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  onGoToSimulation,
  userRole,
  selectedState,
  selectedDistrict,
}) => {
  const [trends, setTrends] = useState<SchemeTrendsResponse | null>(null);
  const [predictiveAlerts, setPredictiveAlerts] = useState<PredictiveAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      let queryParams = "";
      if (userRole === "STATE_NODAL") {
        queryParams = `?state=${encodeURIComponent(selectedState)}`;
      } else if (userRole === "DISTRICT_AUTHORITY") {
        queryParams = `?state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}`;
      }

      const [trendsRes, predRes] = await Promise.all([
        fetch(`${DEFAULT_API_BASE_URL}/api/v1/scheme-trends${queryParams}`),
        fetch(`${DEFAULT_API_BASE_URL}/api/v1/predictive-alerts${queryParams}`)
      ]);

      if (!trendsRes.ok || !predRes.ok) {
        throw new Error("Failed to load scheme analytics data.");
      }

      const trendsData: SchemeTrendsResponse = await trendsRes.json();
      const predData = await predRes.json();

      setTrends(trendsData);
      setPredictiveAlerts(predData.predictive_alerts || []);
    } catch (err: any) {
      console.error("Analytics fetch error:", err);
      setError(err?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [userRole, selectedState, selectedDistrict]);

  const formatINR = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const getScopeLabel = () => {
    if (userRole === "MINISTRY") return "National Dashboard • Ministry of Statistics & Programme Implementation (MoSPI)";
    if (userRole === "STATE_NODAL") return `State Nodal Jurisdiction: ${selectedState} State`;
    if (userRole === "DISTRICT_AUTHORITY") return `District Authority Jurisdiction: ${selectedDistrict} (${selectedState})`;
    return "MP Constituency Office Overview";
  };

  const maxMonthly = trends?.monthly_trends?.reduce((max, m) => Math.max(max, m.total_sanctioned), 0) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      
      {/* Top Banner with Dynamic Role Context */}
      <div style={{
        backgroundColor: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "14px",
        padding: "1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1.25rem",
        background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(19, 29, 51, 0.95))"
      }}>
        <div style={{ maxWidth: "700px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "6px" }}>
            <span style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              backgroundColor: "rgba(56, 189, 248, 0.15)",
              color: "#38bdf8",
              padding: "2px 8px",
              borderRadius: "4px",
              border: "1px solid rgba(56, 189, 248, 0.3)"
            }}>
              {userRole.replace("_", " ")}
            </span>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
              {getScopeLabel()}
            </span>
          </div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#f8fafc", marginBottom: "6px", letterSpacing: "-0.02em" }}>
            National Scheme Analytics & Early Warning
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
            Multi-tier dashboard providing linear trend forecasting, spend velocity monitoring, and milestone execution oversight across states and districts.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={fetchAnalytics}
            style={{
              backgroundColor: "#131d33",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              color: "#94a3b8",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={onGoToSimulation}
            style={{
              backgroundColor: "#0284c7",
              border: "none",
              borderRadius: "8px",
              padding: "0.75rem 1.25rem",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "0 0 15px rgba(2, 132, 199, 0.4)"
            }}
          >
            Launch Forensic Audit
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          border: "1px solid #ef4444",
          borderRadius: "8px",
          padding: "0.85rem 1rem",
          color: "#fca5a5",
          fontSize: "0.825rem"
        }}>
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1rem"
      }}>
        <div style={{
          backgroundColor: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "10px",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.725rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>
              Total Sanctioned Outlay
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", backgroundColor: "rgba(56, 189, 248, 0.1)" }}>
              <Coins size={20} color="#38bdf8" />
            </div>
          </div>
          <div style={{ fontSize: "1.55rem", fontWeight: 800, color: "#f8fafc" }}>
            {trends ? formatINR(trends.total_sanctioned_inr) : "—"}
          </div>
          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
            Across {trends?.total_projects || 0} Total Works
          </div>
        </div>

        <div style={{
          backgroundColor: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "10px",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.725rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>
              Delayed Works Intercepted
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
              <Clock size={20} color="#fbbf24" />
            </div>
          </div>
          <div style={{ fontSize: "1.55rem", fontWeight: 800, color: "#fbbf24" }}>
            {trends?.delayed_projects_count || 0} Works
          </div>
          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
            Overdue past target completion date
          </div>
        </div>

        <div style={{
          backgroundColor: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "10px",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.725rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>
              Total Fraud Flags
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
              <ShieldAlert size={20} color="#f87171" />
            </div>
          </div>
          <div style={{ fontSize: "1.55rem", fontWeight: 800, color: "#f87171" }}>
            {trends?.fraud_cases_count || 0} Flags
          </div>
          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
            Cost, Split-Tender & Delay Outliers
          </div>
        </div>

        <div style={{
          backgroundColor: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "10px",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.725rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>
              Early-Warning Overrun Risks
            </span>
            <div style={{ padding: "6px", borderRadius: "8px", backgroundColor: "rgba(249, 115, 22, 0.1)" }}>
              <TrendingUp size={20} color="#f97316" />
            </div>
          </div>
          <div style={{ fontSize: "1.55rem", fontWeight: 800, color: "#fb923c" }}>
            {predictiveAlerts.length} Entities
          </div>
          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
            Projected allocation cap breach
          </div>
        </div>
      </div>

      {/* Main Charts & Early Warning Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))",
        gap: "1.5rem",
        alignItems: "start"
      }}>
        
        {/* Monthly Spend-Over-Time Chart */}
        <div style={{
          backgroundColor: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "12px",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BarChart3 size={18} color="#38bdf8" />
              <span style={{ fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Monthly Spend Velocity (Spend-Over-Time)
              </span>
            </div>
            <span style={{ fontSize: "0.7rem", color: "#64748b" }}>2025 Calendar Horizon</span>
          </div>

          {trends?.monthly_trends && trends.monthly_trends.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{
                height: "180px",
                display: "flex",
                alignItems: "flex-end",
                gap: "8px",
                paddingTop: "1rem",
                borderBottom: "1px solid #1e293b"
              }}>
                {trends.monthly_trends.map((item, idx) => {
                  const heightPct = Math.max(10, Math.round((item.total_sanctioned / maxMonthly) * 100));
                  return (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        height: "100%",
                        justifyContent: "flex-end"
                      }}
                      title={`${item.month}: ${formatINR(item.total_sanctioned)} (${item.project_count} projects)`}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: `${heightPct}%`,
                          backgroundColor: "#0284c7",
                          borderRadius: "4px 4px 0 0",
                          transition: "all 0.3s ease",
                          cursor: "pointer"
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Month Labels */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "#64748b" }}>
                {trends.monthly_trends.map((item, idx) => (
                  <span key={idx} style={{ flex: 1, textAlign: "center" }}>
                    {item.month.slice(5)}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.8rem" }}>
              No monthly data available for this scope.
            </div>
          )}
        </div>

        {/* Predictive Early-Warning Panel (Task 4) */}
        <div style={{
          backgroundColor: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "12px",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <TrendingUp size={18} color="#f97316" />
              <span style={{ fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Predictive Allocation Overrun Radar ({predictiveAlerts.length})
              </span>
            </div>
            <span style={{ fontSize: "0.7rem", color: "#fb923c", fontWeight: 600 }}>Linear Trend Extrapolation</span>
          </div>

          {predictiveAlerts.length === 0 ? (
            <div style={{
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: "8px",
              padding: "1.5rem",
              textAlign: "center",
              color: "#a7f3d0",
              fontSize: "0.825rem"
            }}>
              No runaway expenditure acceleration or projected budget overruns detected for this jurisdiction.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", maxHeight: "280px", overflowY: "auto" }}>
              {predictiveAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "#131d33",
                    border: `1px solid ${alert.severity === "HIGH" ? "rgba(239, 68, 68, 0.4)" : "rgba(249, 115, 22, 0.4)"}`,
                    borderRadius: "8px",
                    padding: "0.85rem 1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.35rem"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>
                      {alert.entity}
                    </span>
                    <span style={{
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: "3px",
                      backgroundColor: alert.severity === "HIGH" ? "#ef4444" : "#f97316",
                      color: "#ffffff"
                    }}>
                      {alert.alert_type}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: "0.75rem", color: "#cbd5e1", lineHeight: 1.4 }}>
                    {alert.explanation}
                  </div>

                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.7rem", color: "#94a3b8", marginTop: "2px" }}>
                    <span>Current: <strong className="font-mono" style={{ color: "#f8fafc" }}>{formatINR(alert.current_spend_inr)}</strong></span>
                    <span>Cap: <strong className="font-mono" style={{ color: "#f8fafc" }}>{formatINR(alert.allocated_ceiling_inr)}</strong></span>
                    <span>Overrun: <strong className="font-mono" style={{ color: "#f87171" }}>+{formatINR(alert.projected_overrun_inr)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* State / District Jurisdiction Breakdown Table */}
      <div style={{
        backgroundColor: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "12px",
        padding: "1.25rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <MapPin size={18} color="#38bdf8" />
          <span style={{ fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            {userRole === "MINISTRY" ? "State-Wise Allocation & Anomaly Distribution" : "District-Wise Allocation & Anomaly Distribution"}
          </span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.825rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1e293b", color: "#64748b", textAlign: "left" }}>
              <th style={{ padding: "8px 6px", fontWeight: 600 }}>Jurisdiction Entity</th>
              <th style={{ padding: "8px 6px", fontWeight: 600 }}>Audited Works</th>
              <th style={{ padding: "8px 6px", fontWeight: 600 }}>Total Sanctioned</th>
              <th style={{ padding: "8px 6px", fontWeight: 600 }}>Fraud Anomalies</th>
              <th style={{ padding: "8px 6px", fontWeight: 600 }}>Risk Status</th>
            </tr>
          </thead>
          <tbody>
            {(userRole === "MINISTRY" ? trends?.state_breakdown : trends?.district_breakdown)?.map((row: any, i: number) => {
              const name = row.state || row.district;
              const isHigh = row.fraud_count >= 15;
              return (
                <tr key={i} style={{ borderBottom: "1px solid #131d33" }}>
                  <td style={{ padding: "10px 6px", fontWeight: 700, color: "#f8fafc" }}>
                    {name} {row.district && `(${row.state})`}
                  </td>
                  <td style={{ padding: "10px 6px", color: "#94a3b8" }} className="font-mono">
                    {row.project_count}
                  </td>
                  <td style={{ padding: "10px 6px", color: "#38bdf8", fontWeight: 700 }} className="font-mono">
                    {formatINR(row.total_sanctioned)}
                  </td>
                  <td style={{ padding: "10px 6px", color: isHigh ? "#f87171" : "#fbbf24", fontWeight: 700 }} className="font-mono">
                    {row.fraud_count}
                  </td>
                  <td style={{ padding: "10px 6px" }}>
                    <span style={{
                      backgroundColor: isHigh ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                      color: isHigh ? "#f87171" : "#34d399",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontWeight: 700,
                      fontSize: "0.725rem"
                    }}>
                      {isHigh ? "ELEVATED RISK" : "NORMAL"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React, { useState, useRef } from "react";
import { DEFAULT_API_BASE_URL } from "../config";
import {
  Camera,
  Upload,
  AlertOctagon,
  CheckCircle2,
  FileSearch,
  Sparkles,
  RefreshCw,
  Hash,
  Clock,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";

interface VerificationResponse {
  project_id: string;
  is_duplicate: boolean;
  matched_project_id: string | null;
  hamming_distance: number | null;
  similarity_pct: number;
  computed_hash: string;
  explanation: string;
  registered: boolean;
  filename: string;
  timestamp: string;
}

export const MilestoneVerification: React.FC = () => {
  const [projectId, setProjectId] = useState("MPLAD-2026-CLAIM-88");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const loadDemoScenario = async (type: "duplicate" | "authentic") => {
    setError(null);
    setResult(null);

    if (type === "duplicate") {
      setProjectId("MPLAD-2026-CLAIM-99");
      // Create a test canvas image matching seeded school building hash or sample
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = "#FFD700";
        ctx.fillRect(50, 50, 300, 200);
        ctx.fillStyle = "#000000";
        ctx.font = "20px monospace";
        ctx.fillText("COMPLETION PROOF: SCHOOL", 70, 150);
      }
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "school_completion_proof_mod.jpg", { type: "image/jpeg" });
          handleFileChange(file);
        }
      }, "image/jpeg", 0.8);
    } else {
      setProjectId("MPLAD-2026-CLEAN-01");
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#1E3A8A";
        ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = "#10B981";
        ctx.beginPath();
        ctx.arc(200, 150, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "18px monospace";
        ctx.fillText("NEW SITE VERIFIED", 120, 155);
      }
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "unique_site_authentic.jpg", { type: "image/jpeg" });
          handleFileChange(file);
        }
      }, "image/jpeg", 0.95);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select or upload a milestone completion photograph.");
      return;
    }
    if (!projectId.trim()) {
      setError("Please specify a valid MPLADS Project ID.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("project_id", projectId.trim());
      formData.append("file", selectedFile);

      const response = await fetch(`${DEFAULT_API_BASE_URL}/api/v1/verify-milestone-photo`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned HTTP ${response.status}`);
      }

      const data: VerificationResponse = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error("Milestone verification error:", err);
      setError(err?.message || "Failed to communicate with photo verification service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Pipeline Stage Banner */}
      <div style={{
        backgroundColor: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "14px",
        padding: "1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(19, 29, 51, 0.95))"
      }}>
        <div style={{ maxWidth: "750px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
            MPLADS AI Check 3 • Milestone & Invoicing Verification
          </div>
          <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#f8fafc", marginBottom: "6px" }}>
            Photo-Based Milestone Completion Verification
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
            Perceptual hashing (pHash) analysis designed to catch rogue contractors recycling identical completion photographs across multiple project invoices to claim fraudulent disbursements.
          </p>
        </div>

        <div style={{
          backgroundColor: "#131d33",
          border: "1px solid #1e293b",
          borderRadius: "8px",
          padding: "0.75rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem"
        }}>
          <Camera size={24} color="#38bdf8" />
          <div>
            <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600 }}>PERCEPTUAL ALGORITHM</div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>64-Bit pHash Hamming Matrix</div>
          </div>
        </div>
      </div>

      {/* 1-Click Demo Scenarios */}
      <div style={{
        backgroundColor: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: "12px",
        padding: "1rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Sparkles size={16} color="#38bdf8" />
          <span style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Quick Pitch Test Presets:
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => loadDemoScenario("duplicate")}
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              borderRadius: "6px",
              padding: "0.5rem 1rem",
              color: "#fca5a5",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <AlertTriangle size={15} color="#ef4444" />
            Load Sample Photo Claim
          </button>

          <button
            type="button"
            onClick={() => loadDemoScenario("authentic")}
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              borderRadius: "6px",
              padding: "0.5rem 1rem",
              color: "#6ee7b7",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <ShieldCheck size={15} color="#10b981" />
            Load Unique Site Photo
          </button>
        </div>
      </div>

      {/* Main Grid: Upload Form Left, Verification Results Right */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
        gap: "1.5rem",
        alignItems: "start"
      }}>
        
        {/* Upload Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: "12px",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem"
          }}
        >
          <div style={{ borderBottom: "1px solid #1e293b", paddingBottom: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Milestone Claim Submission
            </span>
            <span style={{ fontSize: "0.725rem", color: "#64748b" }}>POST /api/v1/verify-milestone-photo</span>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>
              Project ID Claiming Disbursement
            </label>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              className="font-mono"
              placeholder="e.g. MPLAD-2026-CLAIM-88"
              style={{
                width: "100%",
                backgroundColor: "#131d33",
                border: "1px solid #1e293b",
                borderRadius: "6px",
                padding: "0.6rem 0.75rem",
                color: "#f8fafc",
                outline: "none"
              }}
            />
          </div>

          {/* Drag & Drop Box */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", marginBottom: "6px" }}>
              Upload Work Completion Photograph
            </label>
            
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed #334155",
                borderRadius: "10px",
                padding: "1.5rem",
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: "#131d33",
                transition: "all 0.15s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <Upload size={32} color="#38bdf8" />
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f8fafc" }}>
                {selectedFile ? selectedFile.name : "Drag & drop site photo here, or click to browse"}
              </div>
              <div style={{ fontSize: "0.725rem", color: "#64748b" }}>
                Supports JPG, PNG, WEBP • Perceptual Hash computed instantly
              </div>
            </div>
          </div>

          {/* Image Thumbnail Preview */}
          {previewUrl && (
            <div style={{
              backgroundColor: "#131d33",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              padding: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem"
            }}>
              <img
                src={previewUrl}
                alt="Site Preview"
                style={{
                  width: "90px",
                  height: "70px",
                  objectFit: "cover",
                  borderRadius: "6px",
                  border: "1px solid #334155"
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f8fafc" }}>
                  {selectedFile?.name}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                  Size: {selectedFile ? (selectedFile.size / 1024).toFixed(1) : 0} KB
                </div>
                <div style={{ fontSize: "0.68rem", color: "#34d399", fontWeight: 600, marginTop: "2px" }}>
                  Ready for Perceptual Hash Extraction
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid #ef4444",
              borderRadius: "6px",
              padding: "0.75rem",
              color: "#fca5a5",
              fontSize: "0.8rem"
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedFile}
            style={{
              backgroundColor: "#0284c7",
              border: "none",
              borderRadius: "6px",
              padding: "0.75rem 1.25rem",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: loading || !selectedFile ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              boxShadow: "0 0 15px rgba(2, 132, 199, 0.35)",
              opacity: !selectedFile ? 0.6 : 1
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Extracting pHash & Checking Registry...
              </>
            ) : (
              <>
                <Camera size={16} />
                Verify Milestone Photo Hash
              </>
            )}
          </button>
        </form>

        {/* Results Card */}
        <div>
          {result ? (
            <div style={{
              backgroundColor: "#0f172a",
              border: `1px solid ${result.is_duplicate ? "#ef4444" : "#10b981"}`,
              borderRadius: "14px",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              boxShadow: result.is_duplicate
                ? "0 0 25px -4px rgba(239, 68, 68, 0.4)"
                : "0 0 25px -4px rgba(16, 185, 129, 0.35)"
            }}>
              
              {/* Header Badge */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #1e293b",
                paddingBottom: "0.85rem",
                flexWrap: "wrap",
                gap: "0.5rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>TARGET PROJECT:</span>
                  <span className="font-mono" style={{ fontSize: "1rem", fontWeight: 700, color: "#f8fafc" }}>
                    {result.project_id}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#64748b" }}>
                  <Clock size={13} />
                  <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Status Banner */}
              {result.is_duplicate ? (
                <div style={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid #ef4444",
                  borderRadius: "10px",
                  padding: "1.25rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.85rem"
                }}>
                  <AlertOctagon size={28} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#f87171", marginBottom: "4px" }}>
                      DUPLICATE COMPLETION PHOTO DETECTED
                    </div>
                    <div style={{ fontSize: "0.825rem", color: "#fca5a5", lineHeight: 1.5 }}>
                      This photograph was previously submitted and verified as completion proof for historical project <strong className="font-mono" style={{ color: "#ffffff", textDecoration: "underline" }}>{result.matched_project_id}</strong>.
                    </div>
                    <div style={{
                      marginTop: "8px",
                      display: "inline-block",
                      backgroundColor: "#ef4444",
                      color: "#ffffff",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      padding: "3px 8px",
                      borderRadius: "4px"
                    }}>
                      FLAGGED: RECYCLED INVOICE CLAIM
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid #10b981",
                  borderRadius: "10px",
                  padding: "1.25rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.85rem"
                }}>
                  <CheckCircle2 size={28} color="#10b981" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#34d399", marginBottom: "4px" }}>
                      AUTHENTIC WORK PHOTO VERIFIED
                    </div>
                    <div style={{ fontSize: "0.825rem", color: "#a7f3d0", lineHeight: 1.5 }}>
                      No perceptual duplicates found across historical MPLADS registry. Unique image hash has been recorded and locked to this project.
                    </div>
                    <div style={{
                      marginTop: "8px",
                      display: "inline-block",
                      backgroundColor: "#10b981",
                      color: "#ffffff",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      padding: "3px 8px",
                      borderRadius: "4px"
                    }}>
                      MILESTONE CLEARED FOR DISBURSEMENT
                    </div>
                  </div>
                </div>
              )}

              {/* Forensic Metrics Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.85rem"
              }}>
                <div style={{
                  backgroundColor: "#131d33",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "0.85rem"
                }}>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600 }}>HAMMING DISTANCE</div>
                  <div className="font-mono" style={{ fontSize: "1.25rem", fontWeight: 800, color: result.is_duplicate ? "#f87171" : "#38bdf8" }}>
                    {result.hamming_distance !== null ? `${result.hamming_distance} / 64` : "N/A"}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                    Threshold: &le; 8 indicates duplicate
                  </div>
                </div>

                <div style={{
                  backgroundColor: "#131d33",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "0.85rem"
                }}>
                  <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600 }}>PERCEPTUAL MATCH %</div>
                  <div className="font-mono" style={{ fontSize: "1.25rem", fontWeight: 800, color: result.is_duplicate ? "#f87171" : "#34d399" }}>
                    {result.similarity_pct}%
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                    Visual structural invariance
                  </div>
                </div>
              </div>

              {/* Hash Fingerprint */}
              <div style={{
                backgroundColor: "#131d33",
                border: "1px solid #1e293b",
                borderRadius: "8px",
                padding: "0.85rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Hash size={14} color="#38bdf8" />
                  <span style={{ fontSize: "0.725rem", color: "#94a3b8", fontWeight: 600 }}>
                    COMPUTED PERCEPTUAL HASH (pHash)
                  </span>
                </div>
                <div className="font-mono" style={{ fontSize: "0.85rem", color: "#f8fafc", wordBreak: "break-all" }}>
                  {result.computed_hash}
                </div>
              </div>

              {/* Explanation Note */}
              <div style={{ fontSize: "0.775rem", color: "#94a3b8", lineHeight: 1.5, backgroundColor: "rgba(11, 17, 32, 0.4)", padding: "0.75rem", borderRadius: "6px" }}>
                {result.explanation}
              </div>

            </div>
          ) : (
            <div style={{
              backgroundColor: "#0f172a",
              border: "1px dashed #1e293b",
              borderRadius: "12px",
              padding: "3.5rem 2rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              color: "#64748b"
            }}>
              <FileSearch size={38} color="#334155" />
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#94a3b8" }}>
                Awaiting Milestone Photograph
              </div>
              <div style={{ fontSize: "0.8rem", maxWidth: "320px", lineHeight: 1.5 }}>
                Select a test preset above or upload an invoice completion photo to verify against the historical registry.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

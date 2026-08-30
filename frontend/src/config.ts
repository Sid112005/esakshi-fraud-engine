export const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const STATE_DISTRICTS: Record<string, string[]> = {
  "Maharashtra": ["Thane", "Pune", "Nagpur", "Nashik", "Palghar", "Mumbai Suburban", "Aurangabad", "Hingoli"],
  "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Aurangabad_BR"],
  "Uttar Pradesh": ["Lucknow", "Varanasi", "Kanpur", "Agra"],
  "West Bengal": ["Kolkata", "Tamluk", "Howrah", "Darjeeling"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Trichy"],
  "Karnataka": ["Bengaluru Urban", "Mysuru", "Belagavi"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur"],
  "Jammu And Kashmir": ["Srinagar", "Baramulla", "Jammu"],
  "Assam": ["Guwahati", "Dibrugarh", "Silchar"]
};

export const STATES = Object.keys(STATE_DISTRICTS);

export const WORK_CATEGORIES = [
  "Solar Street Light",
  "Community Hall",
  "Drinking Water Plant",
  "School Boundary Wall",
  "Road Repair",
] as const;

export type UserRole = "MINISTRY" | "STATE_NODAL" | "DISTRICT_AUTHORITY" | "MP_OFFICE";

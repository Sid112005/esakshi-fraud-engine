export const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const WORK_CATEGORIES = [
  "Solar Street Light",
  "Community Hall",
  "Drinking Water Plant",
  "School Boundary Wall",
  "Road Repair",
] as const;

export const KNOWN_DISTRICTS = [
  "Thane",
  "Pune",
  "Nagpur",
  "Nashik",
  "Palghar",
  "Hingoli",
  "Aurangabad",
  "Mumbai Suburban",
] as const;

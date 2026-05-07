import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeMac(mac: string) {
  return (mac || "").toLowerCase().replace(/[^a-f0-9]/g, "");
}

export function rateToColor(rate: number) {
  if (rate < 20) return "#ef4444"; // red-500
  if (rate < 40) return "#f97316"; // orange-500
  if (rate < 60) return "#eab308"; // yellow-500
  if (rate < 80) return "#84cc16"; // lime-500
  return "#22c55e"; // green-500
}

export function formatDisplayName(name: string) {
  if (!name) return "";
  const parts = name.split('-');
  // If it follows the pattern TYPE-ID-NAME (at least 3 parts)
  if (parts.length >= 3) {
    return parts.slice(2).join(' ');
  }
  // Fallback for names with only one hyphen or none
  return name.replace(/-/g, ' ');
}

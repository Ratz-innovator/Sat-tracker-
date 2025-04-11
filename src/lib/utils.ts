import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind CSS classes with other class values
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 
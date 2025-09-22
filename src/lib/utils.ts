import { type ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts text to proper case (first letter uppercase, rest lowercase)
 * Example: "NEHA" -> "Neha", "john" -> "John", "mary JANE" -> "Mary Jane"
 */
export function toProperCase(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

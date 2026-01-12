import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number to 1 decimal place if it has more than 1 decimal digit
 */
export function formatDecimal(value: number): string {
  const decimalStr = value.toString();
  const decimalIndex = decimalStr.indexOf('.');
  if (decimalIndex !== -1 && decimalStr.length - decimalIndex - 1 > 1) {
    return value.toFixed(1);
  }
  return decimalStr;
}

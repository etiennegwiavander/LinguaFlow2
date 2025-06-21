import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Debounce utility function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function safeGetString(obj: any, key: string, defaultValue: string = ''): string {
  if (obj && typeof obj === 'object' && typeof obj[key] === 'string') {
    return obj[key];
  }
  return defaultValue;
}

export function safeGetArray(obj: any, key: string, defaultValue: any[] = []): any[] {
  if (obj && typeof obj === 'object' && Array.isArray(obj[key])) {
    return obj[key];
  }
  return defaultValue;
}

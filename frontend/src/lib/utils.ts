import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function calculateDiscount(price: number, discountType: 'percent' | 'fixed', discountValue: number): number {
  if (!discountValue || discountValue <= 0) return price;
  if (discountType === 'percent') {
    return price - (price * (discountValue / 100));
  }
  return Math.max(0, price - discountValue);
}

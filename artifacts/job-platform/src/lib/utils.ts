import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAvatarUrl(dbAvatarUrl: string | null | undefined, clerkAvatarUrl: string | null | undefined): string | null | undefined {
  if (dbAvatarUrl) return dbAvatarUrl;
  if (clerkAvatarUrl) return clerkAvatarUrl;
  return undefined;
}

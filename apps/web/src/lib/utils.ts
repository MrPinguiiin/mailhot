import { clsx } from "clsx";

export const cn = clsx;

// biome-ignore lint/suspicious/noExplicitAny: shadcn-svelte components use specific HTML attribute types
export type WithElementRef<T extends Record<string, any>> = T & {
  ref?: HTMLElement | null;
};

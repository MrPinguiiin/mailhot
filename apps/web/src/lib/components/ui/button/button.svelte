<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  export let variant: "default" | "outline" | "ghost" | "secondary" = "default";
  export let size: "default" | "sm" | "lg" = "default";
  let className = "";
  export { className as class };
  export let href: string | undefined = undefined;
  export let disabled = false;
  export let onclick: (() => void) | undefined = undefined;
  export let type: HTMLButtonAttributes["type"] = "button";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline:
      "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  };
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
  };
</script>

{#if href}<a
    class={`${variants[variant]} ${sizes[size]} inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 ${className}`}
    {href}
    aria-disabled={disabled}><slot /></a
  >
{:else}<button
    class={`${variants[variant]} ${sizes[size]} inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 ${className}`}
    {type}
    {disabled}
    {onclick}><slot /></button
  >{/if}

<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cn } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    class: className,
    value = $bindable(""),
    type = "text",
    placeholder = "",
    disabled = false,
    id,
    name,
    "aria-invalid": ariaInvalid,
    oninput,
    onblur,
  }: {
    ref?: HTMLInputElement | null;
    class?: string;
    value?: string | number | readonly string[] | undefined;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
    id?: string;
    name?: string;
    "aria-invalid"?: boolean | undefined;
    oninput?: (e: Event) => void;
    onblur?: (e: Event) => void;
  } = $props();
</script>

<input
  bind:this={ref}
  bind:value
  {type}
  {placeholder}
  {disabled}
  {id}
  {name}
  aria-invalid={ariaInvalid}
  {oninput}
  {onblur}
  class={cn(
    "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
    className,
  )}
/>

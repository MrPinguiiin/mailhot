<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  export let className = "";
  export { className as class };
  export let value: HTMLInputAttributes["value"] = undefined;
  export let type: HTMLInputAttributes["type"] = "text";
  export let placeholder = "";
  export let disabled = false;
</script>
<input bind:value {type} {placeholder} {disabled} class={`flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`} />

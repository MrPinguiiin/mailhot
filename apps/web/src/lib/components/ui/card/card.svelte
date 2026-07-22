<script lang="ts">
  export let className = "";
  export { className as class };
</script>
<section class={`rounded-xl border border-border bg-card text-card-foreground shadow-sm ${className}`}><slot /></section>

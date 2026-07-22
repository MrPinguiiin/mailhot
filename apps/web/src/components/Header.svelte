<script lang="ts">
  import UserMenu from "./UserMenu.svelte";
</script>

<div class="border-b border-border bg-surface-low">
  <div class="flex h-14 items-center justify-between px-4 md:px-6">
    <nav class="flex items-center gap-6 text-sm">
      <a
        href="/"
        class="font-display text-lg uppercase tracking-[0.04em] text-primary transition-colors hover:text-gold-soft"
        >MailHog</a
      >
      <a
        href="/dashboard"
        class="text-muted-foreground transition-colors hover:text-foreground"
        >Dashboard</a
      >
    </nav>
    <div class="flex items-center gap-2">
      <UserMenu />
    </div>
  </div>
</div>

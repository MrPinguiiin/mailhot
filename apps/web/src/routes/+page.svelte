<script lang="ts">
  import { Button } from "$lib/components/ui/button";
</script>

<svelte:head><title>MailHog | Disposable inboxes</title></svelte:head>

<div
  class="mx-auto grid min-h-full max-w-6xl gap-16 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
>
  <section>
    <p class="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-gold">
      Private mail infrastructure
    </p>
    <h1
      class="max-w-3xl text-5xl font-semibold tracking-tight text-foreground sm:text-7xl"
    >
      Disposable inboxes, provisioned in minutes.
    </h1>
    <p class="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">
      A focused temp mail platform for teams that own their domains. Cloudflare
      setup stays behind one secure workflow.
    </p>
    <div class="mt-10 flex gap-4">
      <Button href="/dashboard" size="lg">Open owner console</Button><Button
        href="/login"
        variant="outline"
        size="lg">Sign in</Button
      >
    </div>
  </section>
  <section
    class="rounded-[2rem] border border-border bg-card p-8 shadow-2xl shadow-black/40"
  >
    <p class="text-sm text-muted-foreground">One control plane</p>
    <h2 class="mt-3 text-2xl font-semibold text-foreground">
      Your domains. Your inboxes. Less plumbing.
    </h2>
    <div class="mt-8 grid gap-3">
      {#each ["Create a client space", "Verify a Cloudflare domain", "Start receiving mail"] as step, i}<div
          class="flex items-center gap-4 rounded-2xl bg-surface-low p-4"
        >
          <span
            class="grid h-8 w-8 place-items-center rounded-full bg-primary font-bold text-primary-foreground"
            >{i + 1}</span
          ><span class="text-foreground">{step}</span>
        </div>{/each}
    </div>
  </section>
</div>

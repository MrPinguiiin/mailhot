<script lang="ts">
  import {
    ArrowRight,
    Code2,
    Network,
    Mail,
    Radio,
    Route,
    ShieldCheck,
  } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button";
  import { Card } from "$lib/components/ui/card";
</script>

<svelte:head>
  <title>MailHog - Disposable inboxes</title>
  <meta
    name="description"
    content="Secure, isolated email reception endpoints for privacy-first routing."
  />
</svelte:head>

<div class="min-h-full overflow-x-hidden bg-background text-foreground">
  <main
    class="mx-auto grid min-h-[calc(100vh-57px)] max-w-[1440px] blueprint-grid lg:grid-cols-2"
  >
    <section
      class="relative flex min-h-[calc(100vh-57px)] flex-col justify-center border-b border-border px-6 py-16 lg:border-b-0 lg:border-r lg:px-12 lg:py-20"
    >
      <div class="relative z-10 max-w-xl">
        <div
          class="mb-8 inline-flex items-center gap-2 border border-primary bg-primary/10 px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-primary"
        >
          <ShieldCheck size={14} aria-hidden="true" />
          Private mail infrastructure
        </div>
        <h1
          class="font-display text-6xl font-normal uppercase leading-[0.9] tracking-[0.02em] text-foreground sm:text-7xl lg:text-[80px]"
        >
          Disposable inboxes,
          <span class="block text-muted-foreground"
            >provisioned in minutes.</span
          >
        </h1>
        <p
          class="mt-8 max-w-md text-base leading-7 text-muted-foreground sm:text-lg"
        >
          Secure, isolated email reception endpoints designed for automated
          testing, temporary communications, and privacy-first routing.
        </p>
        <div class="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button href="/dashboard" size="lg">
            Open owner console
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
          <Button href="/login" variant="outline" size="lg">
            <Code2 data-icon="inline-start" aria-hidden="true" />
            Sign in
          </Button>
        </div>
      </div>
      <div
        class="absolute bottom-8 left-6 hidden items-center gap-5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground lg:flex lg:left-12"
      >
        <span class="flex items-center gap-2"
          ><span class="size-2 rounded-full bg-primary"></span>Sys.status:
          online</span
        >
        <span>Latency: 12ms</span>
        <span>Region: edge</span>
      </div>
    </section>

    <section
      class="relative flex min-h-[calc(100vh-57px)] flex-col justify-center overflow-hidden bg-surface-low px-6 py-16 lg:px-12 lg:py-20"
    >
      <Network
        class="pointer-events-none absolute right-[-5rem] top-1/2 size-[28rem] -translate-y-1/2 text-primary opacity-[0.035]"
        strokeWidth={1}
        aria-hidden="true"
      />
      <div class="relative z-10 mx-auto flex w-full max-w-md flex-col gap-5">
        <div class="mb-2 flex items-center gap-3">
          <Route class="text-primary" size={20} aria-hidden="true" />
          <h2
            class="font-display text-2xl font-normal uppercase tracking-[0.03em] text-foreground"
          >
            Operational pipeline
          </h2>
        </div>

        {#each [{ number: "01", title: "Create client", description: "Initialize an isolated client space and generate a public inbox endpoint.", detail: "POST /rpc/createClient" }, { number: "02", title: "Verify Cloudflare", description: "Validate the domain and configure Email Routing automatically through the Cloudflare API.", detail: "ZONE + ROUTING READY" }, { number: "03", title: "Receive email", description: "Inbound messages are parsed, sanitized, and delivered to the tenant inbox through the edge Worker.", detail: "LISTENING /api/inbound/email" }] as step, index}
          <div class="flex flex-col gap-5">
            <Card
              class="group rounded-lg border-border bg-surface-high p-6 transition-colors hover:border-primary/60"
            >
              <div class="flex items-start gap-4">
                <span class="font-mono text-sm font-medium text-primary"
                  >{step.number}</span
                >
                <div class="min-w-0 flex-1">
                  <h3
                    class="font-mono text-sm font-semibold uppercase tracking-wider text-foreground"
                  >
                    {step.title}
                  </h3>
                  <p class="mt-2 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                  <div
                    class="mt-4 flex items-center gap-2 overflow-x-auto border border-border/70 bg-surface-lowest px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
                  >
                    {#if index === 2}<Radio
                        class="shrink-0 text-primary"
                        size={13}
                        aria-hidden="true"
                      />{/if}
                    <code>{step.detail}</code>
                  </div>
                </div>
              </div>
            </Card>
            {#if index < 2}<div class="ml-8 h-5 w-px bg-border"></div>{/if}
          </div>
        {/each}

        <div
          class="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-primary"
        >
          <Mail size={14} aria-hidden="true" />
          Edge delivery, tenant isolated
        </div>
      </div>
    </section>
  </main>
</div>

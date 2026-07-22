<script lang="ts">
  import { goto } from "$app/navigation";
  import { authClient } from "$lib/auth-client";
  import { orpc } from "$lib/orpc";
  import { createMutation, createQuery } from "@tanstack/svelte-query";
  import { Button } from "$lib/components/ui/button";
  import { Card } from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import {
    Building2,
    Check,
    CircleAlert,
    ExternalLink,
    Loader2,
    LogOut,
    Mail,
    Plus,
    User,
  } from "@lucide/svelte";

  const sessionQuery = authClient.useSession();
  const dashboard = createQuery(() => orpc.ownerDashboard.queryOptions());
  let clientName = $state("");
  const createClient = createMutation(() =>
    orpc.createClient.mutationOptions({
      onSuccess: () => {
        clientName = "";
        dashboard.refetch();
      },
    }),
  );

  $effect(() => {
    if (!$sessionQuery.isPending && !$sessionQuery.data) goto("/login");
  });

  function signOut() {
    authClient.signOut().then(() => goto("/"));
  }

  const steps = [
    { key: "validating_cloudflare", label: "Validate domain" },
    { key: "configuring_email_routing", label: "Configure routing" },
    { key: "email_routing_configured", label: "Ready" },
  ];

  function stepIndex(currentStep: string) {
    return steps.findIndex((s) => s.key === currentStep);
  }

  function isClientBusy(client: {
    setupJobs: Array<{ currentStep: string; status: string }>;
  }) {
    return client.setupJobs?.some((j) => j.status === "running");
  }
</script>

<svelte:head>
  <title>Control Center - MailHog</title>
</svelte:head>

{#if $sessionQuery.isPending}
  <div
    class="flex min-h-screen items-center justify-center gap-3 font-mono text-xs uppercase tracking-wider text-muted-foreground"
  >
    <Loader2 class="animate-spin" aria-hidden="true" /> Loading console...
  </div>
{:else if !$sessionQuery.data}
  <div
    class="flex min-h-screen items-center justify-center font-mono text-xs uppercase tracking-wider text-muted-foreground"
  >
    Redirecting to login...
  </div>
{:else}
  {@const user = $sessionQuery.data.user}
  <div class="flex min-h-screen bg-background">
    <aside
      class="hidden w-64 shrink-0 flex-col border-r border-border bg-surface-low md:flex"
    >
      <div class="flex h-16 items-center gap-3 border-b border-border px-6">
        <span
          class="font-display text-xl uppercase tracking-[0.04em] text-primary"
          >MailHog</span
        >
      </div>
      <div class="flex flex-1 flex-col justify-between px-4 py-8">
        <div class="flex flex-col items-center gap-4">
          <div
            class="flex size-16 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary"
          >
            {user.name?.charAt(0).toUpperCase() ??
              user.email.charAt(0).toUpperCase()}
          </div>
          <div class="text-center">
            <p class="text-sm font-semibold text-foreground">{user.name}</p>
            <p class="mt-1 text-xs text-muted-foreground">{user.email}</p>
          </div>
          <span class="tag">Owner</span>
        </div>
        <Button variant="ghost" onclick={signOut}>
          <LogOut data-icon="inline-start" aria-hidden="true" /> Sign out
        </Button>
      </div>
    </aside>

    <div class="flex min-h-screen flex-1 flex-col">
      <header
        class="flex h-16 items-center justify-between border-b border-border bg-surface-low px-6 md:px-10"
      >
        <div class="flex items-center gap-4 md:hidden">
          <span
            class="font-display text-xl uppercase tracking-[0.04em] text-primary"
            >MailHog</span
          >
        </div>
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.3em] text-gold">
            Control Center
          </p>
        </div>
        <div class="flex items-center gap-3 md:hidden">
          <div
            class="flex size-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary"
          >
            {user.name?.charAt(0).toUpperCase() ??
              user.email.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto px-6 py-10 md:px-10">
        {#if dashboard.isPending}
          <div
            class="flex items-center justify-center py-24 font-mono text-xs uppercase tracking-wider text-muted-foreground"
          >
            Loading telemetry...
          </div>
        {:else}
          <div class="mx-auto max-w-5xl">
            <div class="grid gap-4 sm:grid-cols-2">
              <Card class="relative overflow-hidden p-6">
                <Building2
                  class="absolute right-4 top-4 text-primary/20"
                  size={32}
                  aria-hidden="true"
                />
                <p class="text-sm text-muted-foreground">Active instances</p>
                <p class="mt-3 text-4xl font-semibold text-foreground">
                  {dashboard.data?.clients.length ?? 0}
                </p>
              </Card>
              <Card class="relative overflow-hidden p-6">
                <Mail
                  class="absolute right-4 top-4 text-primary/20"
                  size={32}
                  aria-hidden="true"
                />
                <p class="text-sm text-muted-foreground">Messages received</p>
                <p class="mt-3 text-4xl font-semibold text-foreground">
                  {dashboard.data?.emailCount ?? 0}
                </p>
              </Card>
            </div>

            <Card class="mt-8 p-6">
              <div class="flex items-center gap-3">
                <Plus class="text-primary" size={20} aria-hidden="true" />
                <h2
                  class="font-display text-2xl uppercase tracking-[0.03em] text-foreground"
                >
                  Initialize client space
                </h2>
              </div>
              <form
                class="mt-5 flex flex-col gap-3 sm:flex-row"
                onsubmit={(e) => {
                  e.preventDefault();
                  if (clientName) createClient.mutate({ name: clientName });
                }}
              >
                <Input
                  class="flex-1"
                  bind:value={clientName}
                  placeholder="Client name, e.g. Acme Corp"
                />
                <Button disabled={createClient.isPending}>
                  {#if createClient.isPending}
                    <Loader2 class="animate-spin" aria-hidden="true" />
                  {:else}
                    <Plus aria-hidden="true" />
                  {/if}
                  Create instance
                </Button>
              </form>
            </Card>

            {#if !dashboard.data?.clients.length}
              <div class="mt-16 flex flex-col items-center gap-4 text-center">
                <Building2
                  class="text-muted-foreground/40"
                  size={48}
                  aria-hidden="true"
                />
                <p
                  class="font-mono text-xs uppercase tracking-wider text-muted-foreground"
                >
                  No instances yet. Create your first one above.
                </p>
              </div>
            {:else}
              <h3
                class="mt-10 mb-5 font-display text-xl uppercase tracking-[0.03em] text-foreground"
              >
                Active instances
              </h3>
              <div class="grid gap-4">
                {#each dashboard.data!.clients as client}
                  <Card class="overflow-hidden p-6">
                    <div
                      class="flex flex-wrap items-start justify-between gap-4"
                    >
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-3">
                          <h4 class="text-xl font-semibold text-foreground">
                            {client.name}
                          </h4>
                          <span class="tag">{client.status}</span>
                          {#if isClientBusy(client)}
                            <span
                              class="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-wider text-primary"
                            >
                              <Loader2
                                class="size-3 animate-spin"
                                aria-hidden="true"
                              /> Provisioning
                            </span>
                          {/if}
                        </div>
                        <p class="mt-1 text-sm text-primary">/{client.slug}</p>
                      </div>
                      <div class="flex shrink-0 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          href={`/client/${client.slug}`}
                        >
                          <ExternalLink aria-hidden="true" /> Open
                        </Button>
                      </div>
                    </div>

                    {#if client.domains.length}
                      <div class="mt-6 space-y-4">
                        {#each client.domains as domain}
                          {@const job = client.setupJobs?.find(
                            (j) => j.domainId === domain.id,
                          )}
                          <div
                            class="rounded-lg border border-border bg-surface-low p-4"
                          >
                            <div
                              class="flex flex-wrap items-center justify-between gap-3"
                            >
                              <div class="flex items-center gap-3">
                                <span class="font-mono text-sm text-foreground"
                                  >{domain.hostname}</span
                                >
                                <span class="tag">{domain.status}</span>
                              </div>
                            </div>

                            {#if job}
                              <div class="mt-4 flex items-center gap-1">
                                {#each steps as step, i}
                                  {@const idx = stepIndex(job.currentStep)}
                                  {@const isDone =
                                    job.status === "completed" ||
                                    (idx >= i && job.status !== "failed") ||
                                    (job.status === "running" && idx > i)}
                                  {@const isCurrent =
                                    job.status === "running" && idx === i}
                                  {@const isFailed =
                                    job.currentStep === "provisioning_failed" ||
                                    (step.key === job.currentStep &&
                                      job.status === "failed")}
                                  <div class="flex items-center gap-1">
                                    {#if isFailed}
                                      <CircleAlert
                                        class="size-4 text-destructive"
                                        aria-hidden="true"
                                      />
                                    {:else if isDone}
                                      <Check
                                        class="size-4 text-primary"
                                        aria-hidden="true"
                                      />
                                    {:else if isCurrent}
                                      <Loader2
                                        class="size-4 animate-spin text-primary"
                                        aria-hidden="true"
                                      />
                                    {:else}
                                      <div
                                        class="size-4 rounded-full border-2 border-border"
                                      ></div>
                                    {/if}
                                    <span
                                      class="font-mono text-[10px] uppercase tracking-wider {isDone
                                        ? 'text-primary'
                                        : isCurrent
                                          ? 'text-foreground'
                                          : isFailed
                                            ? 'text-destructive'
                                            : 'text-muted-foreground'}"
                                    >
                                      {step.label}
                                    </span>
                                  </div>
                                  {#if i < steps.length - 1}
                                    <div
                                      class="mx-2 h-px flex-1 bg-border"
                                    ></div>
                                  {/if}
                                {/each}
                              </div>
                              {#if job.errorMessage}
                                <p
                                  class="mt-2 font-mono text-[10px] text-destructive"
                                >
                                  {job.errorMessage}
                                </p>
                              {/if}
                            {/if}
                          </div>
                        {/each}
                      </div>
                    {:else}
                      <p
                        class="mt-4 font-mono text-xs uppercase tracking-wider text-muted-foreground"
                      >
                        No domains configured. Use the setup form to add one.
                      </p>
                    {/if}
                  </Card>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </main>
    </div>
  </div>
{/if}

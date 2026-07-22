<script lang="ts">
  import { goto } from "$app/navigation";
  import { authClient } from "$lib/auth-client";
  import { orpc } from "$lib/orpc";
  import { PUBLIC_SERVER_URL } from "$env/static/public";
  import { createMutation, createQuery } from "@tanstack/svelte-query";
  import { Button } from "$lib/components/ui/button";
  import { Card } from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import { Badge } from "$lib/components/ui/badge";
  import { Separator } from "$lib/components/ui/separator";
  import { toast } from "svelte-sonner";
  import {
    Building2,
    Check,
    CircleAlert,
    ChevronLeft,
    ExternalLink,
    Globe,
    Loader2,
    LogOut,
    Mail,
    Plus,
    ShieldCheck,
  } from "@lucide/svelte";

  const sessionQuery = authClient.useSession();
  const dashboard = createQuery(() => orpc.ownerDashboard.queryOptions());

  $effect(() => {
    if (!$sessionQuery.isPending && !$sessionQuery.data) goto("/login");
  });

  function signOut() {
    authClient.signOut().then(() => goto("/"));
  }

  let step = $state<"name" | "token" | "select" | "provisioning">("name");
  let clientName = $state("");
  let createdClientId = $state("");
  let createdClientSlug = $state("");
  let cloudflareToken = $state("");
  let zones = $state<Array<{ id: string; name: string; status: string }>>([]);
  let selectedZoneIds = $state<Set<string>>(new Set());
  let provisioningResults = $state<
    Array<{
      hostname: string;
      status: "running" | "done" | "failed";
      error?: string;
    }>
  >([]);
  let isFetchingZones = $state(false);
  let zoneError = $state("");

  const createClient = createMutation(() =>
    orpc.createClient.mutationOptions({
      onSuccess: (data) => {
        createdClientId = data.id;
        createdClientSlug = data.slug;
        step = "token";
        toast.success("Client created. Now add your Cloudflare token.");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create client");
      },
    }),
  );

  const fetchZonesMutation = createMutation(() =>
    orpc.listCloudflareZones.mutationOptions(),
  );

  const setupClientMut = createMutation(() =>
    orpc.setupClient.mutationOptions({
      onError: (error) => {
        toast.error(error.message || "Provisioning failed");
      },
    }),
  );

  const deleteClientMut = createMutation(() =>
    orpc.deleteClient.mutationOptions({
      onSuccess: () => {
        dashboard.refetch();
        toast.success("Instance deleted");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete instance");
      },
    }),
  );

  async function handleFetchZones(e: Event) {
    e.preventDefault();
    zoneError = "";
    isFetchingZones = true;
    try {
      const res = await fetch(`${PUBLIC_SERVER_URL}/api/cloudflare/zones`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: cloudflareToken }),
      });
      const body = await res.json();
      if (!res.ok) {
        zoneError = body.error || "Failed to fetch domains";
        return;
      }
      zones = (body.zones || []).filter(
        (z: { status: string }) => z.status === "active",
      );
      if (zones.length === 0) {
        zoneError = "No active domains found on this Cloudflare account.";
        return;
      }
      step = "select";
    } catch (err) {
      console.error("Fetch zones error:", err);
      zoneError = "Network error. Is the server running?";
    } finally {
      isFetchingZones = false;
    }
  }

  function toggleZone(id: string) {
    const next = new Set(selectedZoneIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selectedZoneIds = next;
  }

  async function handleProvision() {
    if (selectedZoneIds.size === 0) return;
    step = "provisioning";
    const selected = zones.filter((z) => selectedZoneIds.has(z.id));
    provisioningResults = selected.map((z) => ({
      hostname: z.name,
      status: "running" as const,
    }));

    for (let i = 0; i < selected.length; i++) {
      const zone = selected[i];
      try {
        await setupClientMut.mutateAsync({
          clientId: createdClientId,
          domain: zone.name,
          cloudflareToken,
        });
        provisioningResults[i] = { hostname: zone.name, status: "done" };
      } catch (err) {
        provisioningResults[i] = {
          hostname: zone.name,
          status: "failed",
          error: err instanceof Error ? err.message : "Provisioning failed",
        };
      }
    }

    dashboard.refetch();
    toast.success(
      provisioningResults.every((r) => r.status === "done")
        ? "All domains provisioned successfully"
        : "Some domains failed to provision",
    );
  }

  function resetForm() {
    step = "name";
    clientName = "";
    createdClientId = "";
    createdClientSlug = "";
    cloudflareToken = "";
    zones = [];
    selectedZoneIds = new Set();
    provisioningResults = [];
    zoneError = "";
    fetchZonesMutation.reset();
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
          <Badge variant="secondary">Owner</Badge>
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

            <Card class="mt-8 overflow-hidden">
              {#if step === "provisioning"}
                <div class="p-6">
                  <div class="flex items-center gap-3">
                    <Loader2
                      class="size-5 animate-spin text-primary"
                      aria-hidden="true"
                    />
                    <h2
                      class="font-display text-2xl uppercase tracking-[0.03em] text-foreground"
                    >
                      Provisioning domains
                    </h2>
                  </div>
                  <div class="mt-6 space-y-3">
                    {#each provisioningResults as result}
                      <div
                        class="flex items-center gap-3 rounded-lg border border-border bg-surface-low p-4"
                      >
                        {#if result.status === "running"}
                          <Loader2
                            class="size-5 animate-spin text-primary"
                            aria-hidden="true"
                          />
                        {:else if result.status === "done"}
                          <Check
                            class="size-5 text-primary"
                            aria-hidden="true"
                          />
                        {:else}
                          <CircleAlert
                            class="size-5 text-destructive"
                            aria-hidden="true"
                          />
                        {/if}
                        <div class="min-w-0 flex-1">
                          <p class="font-mono text-sm text-foreground">
                            {result.hostname}
                          </p>
                          {#if result.error}
                            <p class="mt-1 text-xs text-destructive">
                              {result.error}
                            </p>
                          {/if}
                        </div>
                        <Badge
                          variant={result.status === "done"
                            ? "default"
                            : result.status === "running"
                              ? "outline"
                              : "destructive"}
                        >
                          {result.status}
                        </Badge>
                      </div>
                    {/each}
                  </div>
                  {#if provisioningResults.every((r) => r.status !== "running")}
                    <div class="mt-6 flex gap-3">
                      <Button onclick={resetForm}>
                        <Plus data-icon="inline-start" aria-hidden="true" /> New instance
                      </Button>
                      <Button
                        variant="outline"
                        href={`/client/${createdClientSlug}`}
                      >
                        <ExternalLink
                          data-icon="inline-start"
                          aria-hidden="true"
                        /> Open instance
                      </Button>
                    </div>
                  {/if}
                </div>
              {:else}
                <div class="p-6">
                  <div class="flex items-center gap-3">
                    <Plus class="text-primary" size={20} aria-hidden="true" />
                    <h2
                      class="font-display text-2xl uppercase tracking-[0.03em] text-foreground"
                    >
                      Initialize client space
                    </h2>
                  </div>

                  <div
                    class="mt-6 flex items-center gap-2 font-mono text-xs uppercase tracking-wider"
                  >
                    <span
                      class="text-{step === 'name'
                        ? 'primary'
                        : 'muted-foreground'}">Name</span
                    >
                    <span class="text-border">→</span>
                    <span
                      class="text-{step === 'name'
                        ? 'muted-foreground'
                        : 'primary'}">Token</span
                    >
                    <span class="text-border">→</span>
                    <span
                      class="text-{step === 'select'
                        ? 'primary'
                        : 'muted-foreground'}">Domains</span
                    >
                  </div>
                  <Separator class="mt-4" />

                  {#if step === "name"}
                    <form
                      class="mt-5 flex flex-col gap-3 sm:flex-row"
                      onsubmit={(e) => {
                        e.preventDefault();
                        if (clientName)
                          createClient.mutate({ name: clientName });
                      }}
                    >
                      <Input
                        class="flex-1"
                        bind:value={clientName}
                        placeholder="Client name, e.g. Acme Corp"
                      />
                      <Button disabled={createClient.isPending}>
                        {#if createClient.isPending}
                          <Loader2
                            class="animate-spin"
                            data-icon="inline-start"
                            aria-hidden="true"
                          />
                        {/if}
                        Next
                      </Button>
                    </form>
                  {/if}

                  {#if step === "token"}
                    <form
                      class="mt-5 flex flex-col gap-4"
                      onsubmit={handleFetchZones}
                    >
                      <div
                        class="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3"
                      >
                        <ShieldCheck
                          class="size-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <p class="text-xs text-muted-foreground">
                          Token needs <span
                            class="font-semibold text-foreground"
                            >Zone:Read</span
                          >
                          and
                          <span class="font-semibold text-foreground"
                            >Email Routing:Edit</span
                          > permissions.
                        </p>
                      </div>
                      <div class="flex flex-col gap-3 sm:flex-row">
                        <Input
                          class="flex-1 font-mono"
                          type="password"
                          bind:value={cloudflareToken}
                          placeholder="Cloudflare API token"
                        />
                        <Button disabled={isFetchingZones}>
                          {#if isFetchingZones}
                            <Loader2
                              class="animate-spin"
                              data-icon="inline-start"
                              aria-hidden="true"
                            />
                          {/if}
                          Fetch domains
                        </Button>
                      </div>
                      {#if zoneError}
                        <p class="text-sm text-destructive">{zoneError}</p>
                      {/if}
                    </form>
                    <div class="mt-3">
                      <Button variant="ghost" size="sm" onclick={resetForm}>
                        <ChevronLeft
                          data-icon="inline-start"
                          aria-hidden="true"
                        /> Back
                      </Button>
                    </div>
                  {/if}

                  {#if step === "select"}
                    <div class="mt-5">
                      <p class="mb-4 text-sm text-muted-foreground">
                        Select domains to provision:
                      </p>
                      <div class="grid gap-2">
                        {#each zones as zone}
                          <button
                            type="button"
                            class={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors ${selectedZoneIds.has(zone.id) ? "border-primary bg-primary/10" : "border-border bg-surface-low hover:border-primary/50"}`}
                            onclick={() => toggleZone(zone.id)}
                          >
                            <div
                              class={`flex size-5 shrink-0 items-center justify-center rounded border ${selectedZoneIds.has(zone.id) ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
                            >
                              {#if selectedZoneIds.has(zone.id)}
                                <Check class="size-3" aria-hidden="true" />
                              {/if}
                            </div>
                            <Globe
                              class="size-4 shrink-0 text-muted-foreground"
                              aria-hidden="true"
                            />
                            <span class="font-mono text-sm text-foreground"
                              >{zone.name}</span
                            >
                            <Badge variant="secondary" class="ml-auto"
                              >{zone.status}</Badge
                            >
                          </button>
                        {/each}
                      </div>
                      <div class="mt-6 flex gap-3">
                        <Button
                          onclick={handleProvision}
                          disabled={selectedZoneIds.size === 0 ||
                            setupClientMut.isPending}
                        >
                          {#if setupClientMut.isPending}
                            <Loader2
                              class="animate-spin"
                              data-icon="inline-start"
                              aria-hidden="true"
                            />
                          {/if}
                          Provision {selectedZoneIds.size} domain{selectedZoneIds.size !==
                          1
                            ? "s"
                            : ""}
                        </Button>
                        <Button
                          variant="ghost"
                          onclick={() => {
                            step = "token";
                            selectedZoneIds = new Set();
                          }}
                        >
                          <ChevronLeft
                            data-icon="inline-start"
                            aria-hidden="true"
                          /> Back
                        </Button>
                      </div>
                    </div>
                  {/if}
                </div>
              {/if}
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
                          <Badge
                            variant={client.status === "ready"
                              ? "default"
                              : "secondary"}>{client.status}</Badge
                          >
                          {#if isClientBusy(client)}
                            <Badge variant="outline" class="gap-1.5">
                              <Loader2
                                class="size-3 animate-spin"
                                aria-hidden="true"
                              /> Provisioning
                            </Badge>
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
                          <ExternalLink
                            data-icon="inline-start"
                            aria-hidden="true"
                          /> Open
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
                                <Badge
                                  variant={domain.status === "ready"
                                    ? "default"
                                    : "secondary"}>{domain.status}</Badge
                                >
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
                                      >{step.label}</span
                                    >
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
                        No domains configured.
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

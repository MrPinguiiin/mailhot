<script lang="ts">
  import { goto } from '$app/navigation';
  import { authClient } from '$lib/auth-client';
  import { orpc } from '$lib/orpc';
  import { createMutation, createQuery } from '@tanstack/svelte-query';
  import { Button } from '$lib/components/ui/button';
  import { Card } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';

  const sessionQuery = authClient.useSession();
  const dashboard = createQuery(() => orpc.ownerDashboard.queryOptions());
  let clientName = $state('');
  let domain = $state('');
  let token = $state('');
  const createClient = createMutation(() => orpc.createClient.mutationOptions({ onSuccess: () => { clientName = ''; dashboard.refetch(); } }));
  const setupClient = createMutation(() => orpc.setupClient.mutationOptions({ onSuccess: () => { token = ''; dashboard.refetch(); } }));

  $effect(() => { if (!$sessionQuery.isPending && !$sessionQuery.data) goto('/login'); });
</script>

{#if $sessionQuery.isPending}<div class="p-12 text-slate-400">Loading owner console...</div>
{:else if !$sessionQuery.data}<div class="p-12 text-slate-400">Redirecting to login...</div>
{:else}<div class="mx-auto max-w-6xl px-6 py-12">
  <p class="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">Owner console</p><h1 class="mt-3 text-4xl font-semibold text-white">Provision client spaces</h1>
  <div class="mt-10 grid gap-4 sm:grid-cols-2"><Card class="p-6"><p class="text-sm text-muted-foreground">Clients</p><p class="mt-3 text-4xl font-semibold">{dashboard.data?.clients.length ?? 0}</p></Card><Card class="p-6"><p class="text-sm text-muted-foreground">Messages received</p><p class="mt-3 text-4xl font-semibold">{dashboard.data?.emailCount ?? 0}</p></Card></div>
  <Card class="mt-8 p-6"><h2 class="text-xl font-semibold">New client</h2><form class="mt-4 flex flex-col gap-3 sm:flex-row" onsubmit={(e) => { e.preventDefault(); if (clientName) createClient.mutate({ name: clientName }); }}><Input class="flex-1" bind:value={clientName} placeholder="Client name" /><Button disabled={createClient.isPending}>Create client</Button></form></Card>
  <div class="mt-8 grid gap-4">{#each dashboard.data?.clients ?? [] as client}<Card class="p-6"><div class="flex flex-wrap justify-between gap-3"><div><h2 class="text-xl font-semibold">{client.name}</h2><p class="mt-1 text-sm text-primary">/{client.slug}</p></div><span class="tag">{client.status}</span></div><form class="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]" onsubmit={(e) => { e.preventDefault(); setupClient.mutate({ clientId: client.id, domain, cloudflareToken: token }); }}><Input bind:value={domain} placeholder="example.com" /><Input type="password" bind:value={token} placeholder="Cloudflare API token" /><Button disabled={setupClient.isPending}>Verify & setup</Button></form>{#each client.domains as item}<p class="mt-4 text-sm text-muted-foreground">{item.hostname} <span class="text-primary">{item.status}</span> <a class="ml-2 underline" href={`/client/${client.slug}`}>Open page</a></p>{/each}</Card>{/each}</div>
</div>{/if}

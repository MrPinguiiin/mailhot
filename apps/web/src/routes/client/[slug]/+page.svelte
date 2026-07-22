<script lang="ts">
  import { page } from "$app/state";
  import {
    ArrowLeft,
    Bell,
    Check,
    Clipboard,
    Copy,
    Mail,
    RefreshCw,
    Search,
    Trash2,
    UserCircle,
  } from "@lucide/svelte";
  import { createMutation, createQuery } from "@tanstack/svelte-query";
  import { Button } from "$lib/components/ui/button";
  import { Card } from "$lib/components/ui/card";
  import { orpc } from "$lib/orpc";

  const slug = $derived(page.params.slug ?? "");
  let address = $state("");
  let selectedEmailId = $state("");
  let copied = $state(false);

  const client = createQuery(() =>
    orpc.clientPage.queryOptions({ input: { slug } }),
  );
  const inbox = createQuery(() =>
    orpc.inbox.queryOptions({ input: { slug, address } }),
  );
  const deleteEmail = createMutation(() =>
    orpc.deleteEmail.mutationOptions({
      onSuccess: async () => {
        await inbox.refetch();
        selectedEmailId = "";
      },
    }),
  );

  $effect(() => {
    if (!selectedEmailId && inbox.data?.length) {
      selectedEmailId = inbox.data[0].id;
    }
  });

  function generate(domain: string) {
    address = `${Math.random().toString(36).slice(2, 12)}@${domain}`;
    selectedEmailId = "";
  }

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    copied = true;
    window.setTimeout(() => (copied = false), 1600);
  }

  function refreshInbox() {
    void inbox.refetch();
  }

  function removeEmail(emailId: string) {
    if (!address) return;
    deleteEmail.mutate({ slug, emailId, address });
  }

  const selectedEmail = $derived(
    inbox.data?.find((email) => email.id === selectedEmailId) ?? null,
  );
</script>

<svelte:head>
  <title>{client.data?.name ?? "Inbox"} - MailHog</title>
</svelte:head>

{#if client.data}
  <div class="min-h-full bg-background text-foreground">
    <header class="border-b border-border bg-surface-low">
      <div
        class="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 md:px-8"
      >
        <div class="flex min-w-0 items-center gap-4">
          <a
            class="text-primary transition-colors hover:text-gold-soft"
            href="/"
            aria-label="Back to MailHog home"
          >
            <ArrowLeft aria-hidden="true" />
          </a>
          <div class="flex items-center gap-4">
            <span
              class="font-display text-3xl uppercase tracking-[0.04em] text-primary"
              >MailHog</span
            >
            <span
              class="hidden border-l border-border pl-4 font-display text-xl uppercase tracking-[0.03em] text-muted-foreground sm:inline"
              >{client.data.name}</span
            >
          </div>
        </div>
        <nav
          class="hidden items-center gap-6 font-mono text-xs uppercase tracking-wider text-muted-foreground md:flex"
        >
          <a
            class="transition-colors hover:text-primary"
            href={`/client/${client.data.slug}`}>Inbox</a
          >
          <a class="transition-colors hover:text-primary" href="/"
            >Documentation</a
          >
        </nav>
        <div class="flex items-center gap-1 text-muted-foreground">
          <span
            class="hidden items-center gap-2 rounded-full border border-border bg-surface-high px-3 py-1 font-mono text-[10px] uppercase tracking-wider lg:flex"
            ><span class="size-2 rounded-full bg-primary"
            ></span>{client.data.domains.find(
              (domain) => domain.status === "ready",
            )?.hostname ?? "offline"}</span
          >
          <Button variant="ghost" size="icon" ariaLabel="Search"
            ><Search aria-hidden="true" /></Button
          >
          <Button variant="ghost" size="icon" ariaLabel="Notifications"
            ><Bell aria-hidden="true" /></Button
          >
          <Button variant="ghost" size="icon" ariaLabel="Account"
            ><UserCircle aria-hidden="true" /></Button
          >
        </div>
      </div>
    </header>

    <main
      class="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[1440px] flex-col gap-5 overflow-hidden px-4 py-5 md:px-8"
    >
      <Card
        class="relative flex shrink-0 flex-col justify-between gap-5 overflow-hidden border-border bg-surface-low p-6 sm:flex-row sm:items-center"
      >
        <div class="relative z-10 flex min-w-0 flex-col gap-2">
          <span
            class="font-display text-2xl uppercase tracking-[0.03em] text-muted-foreground"
            >Active endpoint</span
          >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            {#if address}
              <div
                class="flex min-w-0 items-center gap-3 border border-primary/30 bg-surface-lowest px-4 py-3 font-mono text-sm text-primary"
              >
                <span class="truncate">{address}</span>
              </div>
              <Button size="lg" onclick={copyAddress}
                >{#if copied}<Check
                    data-icon="inline-start"
                    aria-hidden="true"
                  />Copied{:else}<Copy
                    data-icon="inline-start"
                    aria-hidden="true"
                  />Copy{/if}</Button
              >
            {:else}
              <span class="font-mono text-sm text-muted-foreground"
                >Select a ready domain to generate an address.</span
              >
            {/if}
          </div>
        </div>
        <div class="relative z-10 flex flex-wrap gap-2">
          {#each client.data.domains.filter((domain) => domain.status === "ready") as domain}
            <Button
              variant="outline"
              size="lg"
              onclick={() => generate(domain.hostname)}
              ><RefreshCw data-icon="inline-start" aria-hidden="true" />Generate
              new</Button
            >
          {/each}
        </div>
        <div
          class="pointer-events-none absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-primary/10 to-transparent"
        ></div>
      </Card>

      <section class="flex min-h-0 flex-1 flex-col gap-5 lg:flex-row">
        <Card
          class="flex min-h-[22rem] w-full shrink-0 flex-col overflow-hidden border-border bg-surface-low lg:w-1/3"
        >
          <div
            class="flex items-center justify-between gap-3 border-b border-border bg-surface-high p-4"
          >
            <h2
              class="font-display text-2xl uppercase tracking-[0.03em] text-foreground"
            >
              Incoming flow
            </h2>
            <button
              class="rounded border border-border bg-surface-low px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
              onclick={refreshInbox}>Auto-refresh: on</button
            >
          </div>
          <div class="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
            {#if !address}
              <div
                class="flex h-full min-h-64 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground"
              >
                <Mail aria-hidden="true" />
                <p class="font-mono text-xs uppercase tracking-wider">
                  No active endpoint
                </p>
              </div>
            {:else if inbox.isLoading}
              <div
                class="flex h-full min-h-64 items-center justify-center p-8 font-mono text-xs uppercase tracking-wider text-muted-foreground"
              >
                Loading incoming flow...
              </div>
            {:else if !inbox.data?.length}
              <div
                class="flex h-full min-h-64 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground"
              >
                <Mail aria-hidden="true" />
                <p class="font-mono text-xs uppercase tracking-wider">
                  Waiting for incoming mail...
                </p>
              </div>
            {:else}
              {#each inbox.data as email}
                {@const isSelected = email.id === selectedEmailId}
                <button
                  class={`relative flex w-full flex-col gap-1 border-b border-border p-4 text-left transition-colors ${isSelected ? "border-l-2 border-l-primary bg-secondary/20" : "bg-surface hover:bg-surface-high"}`}
                  onclick={() => (selectedEmailId = email.id)}
                >
                  <div class="flex items-start justify-between gap-3">
                    <span
                      class={`truncate font-mono text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
                      >{email.fromAddress}</span
                    ><span
                      class="shrink-0 font-mono text-[10px] text-muted-foreground"
                      >{new Date(email.receivedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}</span
                    >
                  </div>
                  <span
                    class={`truncate text-sm ${isSelected ? "text-primary" : "text-foreground"}`}
                    >{email.subject || "(no subject)"}</span
                  >
                  <span class="truncate text-xs text-muted-foreground"
                    >{email.textContent || "HTML message received..."}</span
                  >
                  {#if !email.isRead}<span
                      class="absolute left-2 top-5 size-1.5 rounded-full bg-primary"
                    ></span>{/if}
                </button>
              {/each}
            {/if}
          </div>
        </Card>

        <Card
          class="flex min-h-[28rem] w-full min-w-0 flex-col overflow-hidden border-border bg-surface-low lg:w-2/3"
        >
          {#if selectedEmail}
            <div
              class="flex flex-col gap-4 border-b border-border bg-surface-high p-5 md:p-6"
            >
              <div class="flex items-start justify-between gap-4">
                <h2
                  class="min-w-0 font-display text-2xl uppercase tracking-[0.03em] text-foreground"
                >
                  {selectedEmail.subject || "(no subject)"}
                </h2>
                <div class="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    ariaLabel="Delete email"
                    onclick={() => removeEmail(selectedEmail.id)}
                    ><Trash2
                      class="text-destructive"
                      aria-hidden="true"
                    /></Button
                  >
                </div>
              </div>
              <div
                class="flex flex-col gap-2 font-mono text-[10px] uppercase tracking-wider"
              >
                <div class="flex gap-2">
                  <span class="w-10 text-muted-foreground">From:</span><span
                    class="truncate text-primary"
                    >{selectedEmail.fromAddress}</span
                  >
                </div>
                <div class="flex gap-2">
                  <span class="w-10 text-muted-foreground">To:</span><span
                    class="truncate text-foreground"
                    >{selectedEmail.toAddress}</span
                  >
                </div>
                <div class="flex gap-2">
                  <span class="w-10 text-muted-foreground">Date:</span><span
                    class="text-muted-foreground"
                    >{new Date(selectedEmail.receivedAt).toLocaleString()}</span
                  >
                </div>
              </div>
            </div>
            <div
              class="custom-scrollbar min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap bg-surface-lowest p-5 font-mono text-xs leading-7 text-muted-foreground md:p-6"
            >
              {selectedEmail.textContent ||
                "HTML email received. Open it in a secure viewer."}
            </div>
          {:else}
            <div
              class="flex min-h-[28rem] flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground"
            >
              <Clipboard aria-hidden="true" />
              <p class="font-mono text-xs uppercase tracking-wider">
                Select a message to inspect its payload
              </p>
            </div>
          {/if}
        </Card>
      </section>
    </main>
  </div>
{:else}
  <div
    class="flex min-h-full items-center justify-center p-12 font-mono text-xs uppercase tracking-wider text-muted-foreground"
  >
    Client space unavailable
  </div>
{/if}

<script lang="ts">
  import { page } from "$app/state";
  import { orpc } from "$lib/orpc";
  import { createQuery } from "@tanstack/svelte-query";
  import { Button } from "$lib/components/ui/button";
  import { Card } from "$lib/components/ui/card";
  const slug = $derived(page.params.slug ?? "");
  let address = $state("");
  const client = createQuery(() =>
    orpc.clientPage.queryOptions({ input: { slug } }),
  );
  const inbox = createQuery(() =>
    orpc.inbox.queryOptions({ input: { slug, address } }),
  );
  function generate(domain: string) {
    address = `${Math.random().toString(36).slice(2, 12)}@${domain}`;
  }
</script>

<div class="mx-auto max-w-5xl px-6 py-16">
  <p class="text-xs font-bold uppercase tracking-[0.3em] text-gold">
    Client inbox
  </p>
  {#if client.data}<h1 class="mt-4 text-5xl font-semibold">
      {client.data.name}
    </h1>
    <p class="mt-3 text-muted-foreground">
      Private disposable mail for your domain.
    </p>
    <div class="mt-10 flex flex-wrap gap-3">
      {#each client.data.domains as domain}<Button
          onclick={() => generate(domain.hostname)}>{domain.hostname}</Button
        >{/each}
    </div>
    {#if address}<Card class="mt-8 border-primary/30 bg-primary/10 p-6"
        ><p class="text-sm text-primary-foreground/80">
          Your temporary address
        </p>
        <p class="mt-2 break-all text-2xl font-semibold">{address}</p></Card
      >
      <div class="mt-8 grid gap-3">
        {#each inbox.data ?? [] as email}<Card class="p-5"
            ><p class="font-semibold">{email.subject || "(no subject)"}</p>
            <p class="mt-1 text-sm text-primary">
              {email.fromName || email.fromAddress}
            </p>
            <p
              class="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground"
            >
              {email.textContent ||
                "HTML email received. Open it in the secure viewer."}
            </p></Card
          >{:else}<div
            class="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground"
          >
            Waiting for incoming mail...
          </div>{/each}
      </div>{/if}{:else}<p class="mt-10 text-muted-foreground">
      This client space is not available.
    </p>{/if}
</div>

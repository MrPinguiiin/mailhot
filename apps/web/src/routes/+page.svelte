<script lang="ts">
  import { Button } from "$lib/components/ui/button";
</script>
<svelte:head><title>MailHog | Disposable inboxes</title></svelte:head>

<div class="mx-auto grid min-h-full max-w-6xl gap-16 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
  <section>
    <p class="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">Private mail infrastructure</p>
    <h1 class="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-7xl">Disposable inboxes, provisioned in minutes.</h1>
    <p class="mt-7 max-w-xl text-lg leading-8 text-slate-400">A focused temp mail platform for teams that own their domains. Cloudflare setup stays behind one secure workflow.</p>
    <div class="mt-10 flex gap-4"><Button href="/dashboard" size="lg">Open owner console</Button><Button href="/login" variant="outline" size="lg">Sign in</Button></div>
  </section>
  <section class="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-cyan-950/30">
    <p class="text-sm text-slate-400">One control plane</p><h2 class="mt-3 text-2xl font-semibold text-white">Your domains. Your inboxes. Less plumbing.</h2>
    <div class="mt-8 grid gap-3">{#each ['Create a client space', 'Verify a Cloudflare domain', 'Start receiving mail'] as step, i}<div class="flex items-center gap-4 rounded-2xl bg-black/20 p-4"><span class="grid h-8 w-8 place-items-center rounded-full bg-cyan-300 font-bold text-slate-950">{i + 1}</span><span class="text-slate-200">{step}</span></div>{/each}</div>
  </section>
</div>

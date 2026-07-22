<script lang="ts">
  import { goto } from "$app/navigation";
  import { ShieldCheck, Mail, Route, Network } from "@lucide/svelte";
  import SignInForm from "../../components/SignInForm.svelte";
  import SignUpForm from "../../components/SignUpForm.svelte";
  import { authClient } from "$lib/auth-client";

  const sessionQuery = authClient.useSession();

  $effect(() => {
    if (!$sessionQuery.isPending && $sessionQuery.data) goto("/dashboard");
  });

  let showSignIn = $state(true);
</script>

<svelte:head>
  <title>{showSignIn ? "Sign In" : "Sign Up"} - MailHog</title>
</svelte:head>

<div class="flex min-h-full bg-background">
  <section
    class="relative hidden w-1/2 flex-col justify-center overflow-hidden border-r border-border bg-surface-low p-12 lg:flex"
  >
    <div class="relative z-10 max-w-lg">
      <div
        class="mb-8 inline-flex items-center gap-2 border border-primary bg-primary/10 px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-primary"
      >
        <ShieldCheck size={14} aria-hidden="true" />
        Private mail infrastructure
      </div>
      <h1
        class="font-display text-5xl font-normal uppercase leading-[0.9] tracking-[0.02em] text-foreground"
      >
        Disposable inboxes,<br />
        <span class="text-muted-foreground">provisioned in minutes.</span>
      </h1>
      <p class="mt-6 max-w-md text-base leading-7 text-muted-foreground">
        Secure, isolated email reception endpoints designed for automated
        testing, temporary communications, and privacy-first routing.
      </p>
      <div class="mt-10 flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div
            class="flex size-8 items-center justify-center rounded-full bg-primary/20"
          >
            <Mail class="text-primary" size={16} aria-hidden="true" />
          </div>
          <span
            class="font-mono text-xs uppercase tracking-wider text-foreground"
            >Edge delivery, tenant isolated</span
          >
        </div>
        <div class="flex items-center gap-3">
          <div
            class="flex size-8 items-center justify-center rounded-full bg-primary/20"
          >
            <Route class="text-primary" size={16} aria-hidden="true" />
          </div>
          <span
            class="font-mono text-xs uppercase tracking-wider text-foreground"
            >Automated Cloudflare provisioning</span
          >
        </div>
        <div class="flex items-center gap-3">
          <div
            class="flex size-8 items-center justify-center rounded-full bg-primary/20"
          >
            <Network class="text-primary" size={16} aria-hidden="true" />
          </div>
          <span
            class="font-mono text-xs uppercase tracking-wider text-foreground"
            >Multi-tenant control center</span
          >
        </div>
      </div>
    </div>
    <Network
      class="pointer-events-none absolute right-[-6rem] top-1/2 size-[26rem] -translate-y-1/2 text-primary opacity-[0.03]"
      strokeWidth={1}
      aria-hidden="true"
    />
  </section>

  <section class="flex w-full items-center justify-center p-6 lg:w-1/2">
    <div class="w-full max-w-sm">
      <div class="mb-8 flex items-center gap-3 lg:hidden">
        <span
          class="font-display text-2xl uppercase tracking-[0.04em] text-primary"
          >MailHog</span
        >
      </div>
      {#if showSignIn}
        <SignInForm switchToSignUp={() => (showSignIn = false)} />
      {:else}
        <SignUpForm switchToSignIn={() => (showSignIn = true)} />
      {/if}
    </div>
  </section>
</div>

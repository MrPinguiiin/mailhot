<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Card } from "$lib/components/ui/card";
  import * as Field from "$lib/components/ui/field";
  import { Loader2 } from "@lucide/svelte";
  import { toast } from "svelte-sonner";

  let { switchToSignUp } = $props<{ switchToSignUp: () => void }>();

  let email = $state("");
  let password = $state("");
  let isSubmitting = $state(false);
  let errors = $state<{ email?: string; password?: string }>({});

  function validate() {
    const next: typeof errors = {};
    if (!email) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+$/.test(email))
      next.email = "Invalid email address";
    if (!password) next.password = "Password is required";
    errors = next;
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!validate()) return;
    isSubmitting = true;
    await authClient.signIn.email(
      { email, password },
      {
        onSuccess: () => {
          toast.success("Signed in successfully");
          goto("/dashboard");
        },
        onError: (error) => {
          toast.error(
            error.error.message || "Sign in failed. Please try again.",
          );
        },
      },
    );
    isSubmitting = false;
  }
</script>

<Card class="p-8">
  <div class="mb-6">
    <h1
      class="font-display text-3xl uppercase tracking-[0.03em] text-foreground"
    >
      Welcome back
    </h1>
    <p class="mt-2 text-sm text-muted-foreground">
      Sign in to access the control center.
    </p>
  </div>

  <form onsubmit={handleSubmit}>
    <Field.FieldGroup>
      <Field.Field data-invalid={!!errors.email}>
        <Field.FieldLabel for="email">Email</Field.FieldLabel>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          bind:value={email}
          aria-invalid={!!errors.email}
          oninput={() => (errors.email = undefined)}
        />
        {#if errors.email}
          <Field.FieldError>{errors.email}</Field.FieldError>
        {/if}
      </Field.Field>

      <Field.Field data-invalid={!!errors.password}>
        <Field.FieldLabel for="password">Password</Field.FieldLabel>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          bind:value={password}
          aria-invalid={!!errors.password}
          oninput={() => (errors.password = undefined)}
        />
        {#if errors.password}
          <Field.FieldError>{errors.password}</Field.FieldError>
        {/if}
      </Field.Field>
    </Field.FieldGroup>

    <Button class="mt-6 w-full" type="submit" disabled={isSubmitting}>
      {#if isSubmitting}
        <Loader2
          class="animate-spin"
          data-icon="inline-start"
          aria-hidden="true"
        />
      {/if}
      {isSubmitting ? "Signing in..." : "Sign In"}
    </Button>
  </form>

  <p class="mt-6 text-center text-sm text-muted-foreground">
    <button
      type="button"
      class="font-semibold text-primary hover:text-gold-soft transition-colors"
      onclick={switchToSignUp}
    >
      Don't have an account? Sign up
    </button>
  </p>
</Card>

<script lang="ts">
  import { QueryClientProvider } from "@tanstack/svelte-query";
  import { SvelteQueryDevtools } from "@tanstack/svelte-query-devtools";
  import "../app.css";
  import { queryClient } from "$lib/orpc";
  import Header from "../components/Header.svelte";
  import { Toaster } from "$lib/components/ui/sonner";

  const { children } = $props();
</script>

<QueryClientProvider client={queryClient}>
  <div class="grid h-svh grid-rows-[auto_1fr]">
    <Header />
    <main class="overflow-y-auto">
      {@render children()}
    </main>
  </div>
  <Toaster position="top-center" richColors />
  <SvelteQueryDevtools />
</QueryClientProvider>

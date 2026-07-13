<script lang="ts">
  import '../app.css';
  import type { LayoutData } from './$types';
  import Navbar from '$lib/components/Navbar.svelte';

  let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
</script>

<svelte:head>
  <title>UniClear — Student Clearance System</title>
</svelte:head>

{#if data.user}
  <Navbar user={data.user} />
{/if}

<main class="min-h-screen" class:pt-16={!!data.user}>
  {@render children()}
</main>

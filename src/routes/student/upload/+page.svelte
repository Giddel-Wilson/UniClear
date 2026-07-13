<script lang="ts">
  import type { Department } from '$lib/types';
  import { DEPARTMENT_LABELS, ALL_DEPARTMENTS } from '$lib/types';
  import UploadModal from '$lib/components/UploadModal.svelte';
  import { Upload, ChevronDown } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let selectedDept = $state<Department | ''>('');
  let modalOpen = $state(false);

  function startUpload() {
    if (selectedDept) modalOpen = true;
  }

  function handleSuccess() {
    modalOpen = false;
    goto('/student/dashboard');
  }
</script>

<svelte:head><title>Upload Documents — UniClear</title></svelte:head>

<div class="max-w-2xl mx-auto px-4 py-10 page-enter">
  <div class="text-center mb-8">
    <div
      class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
      style="background: var(--color-primary-light); color: var(--color-primary);"
    >
      <Upload size={26} />
    </div>
    <h1 class="text-2xl font-bold mb-1" style="color: var(--color-text); font-family: var(--font-display);">
      Upload Clearance Documents
    </h1>
    <p class="text-sm" style="color: var(--color-text-muted);">
      Choose a department, then upload the required documents for review.
    </p>
  </div>

  <div class="card p-6">
    <label for="dept-select" class="block text-sm font-medium mb-1.5" style="color: var(--color-text);">
      Department
    </label>
    <div class="relative mb-5">
      <select id="dept-select" bind:value={selectedDept} class="input pr-8 appearance-none">
        <option value="">Select a department…</option>
        {#each ALL_DEPARTMENTS as dept}
          <option value={dept}>{DEPARTMENT_LABELS[dept]}</option>
        {/each}
      </select>
      <ChevronDown size={14} class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--color-text-muted);" />
    </div>

    <button class="btn btn-primary w-full" disabled={!selectedDept} onclick={startUpload}>
      <Upload size={16} /> Continue to Upload
    </button>
  </div>

  <p class="text-xs text-center mt-4" style="color: var(--color-text-subtle);">
    You can also upload directly from a department card on your
    <a href="/student/dashboard" style="color: var(--color-primary); font-weight: 500;">dashboard</a>.
  </p>
</div>

{#if modalOpen && selectedDept}
  <UploadModal
    department={selectedDept}
    onclose={() => (modalOpen = false)}
    onsuccess={handleSuccess}
  />
{/if}

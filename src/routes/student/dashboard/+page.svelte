<script lang="ts">
  import type { PageData } from './$types';
  import type { Department } from '$lib/types';
  import ClearanceStatusCard from '$lib/components/ClearanceStatusCard.svelte';
  import UploadModal from '$lib/components/UploadModal.svelte';
  import { CheckCircle, GraduationCap, Award } from 'lucide-svelte';
  import { invalidateAll } from '$app/navigation';

  let { data }: { data: PageData } = $props();

  let uploadDept = $state<Department | null>(null);

  function openUpload(dept: Department) {
    uploadDept = dept;
  }

  async function handleUploadSuccess() {
    uploadDept = null;
    await invalidateAll();
  }

  const isComplete = $derived(data.progress === 100);
</script>

<svelte:head><title>Dashboard — UniClear</title></svelte:head>

<div class="max-w-5xl mx-auto px-4 py-8 page-enter">
  <!-- Hero stats -->
  <div class="mb-8">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div>
        <p class="text-sm font-medium mb-1" style="color: var(--color-text-muted);">{data.currentSession} Academic Session</p>
        <h1 class="text-2xl font-bold" style="color: var(--color-text); font-family: var(--font-display);">
          {isComplete ? '🎓 Clearance Complete!' : 'My Clearance Progress'}
        </h1>
      </div>

      {#if isComplete}
        <div
          class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
          style="background: var(--color-success-light); color: var(--color-success);"
        >
          <Award size={16} />
          All departments cleared
        </div>
      {/if}
    </div>

    <!-- Progress card -->
    <div class="card p-6 mb-6" style="background: {isComplete ? 'var(--color-success-light)' : 'var(--color-surface)'};">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-medium" style="color: var(--color-text-muted);">
          {data.approved} of {data.total} departments cleared
        </span>
        <span class="text-2xl font-bold" style="color: {isComplete ? 'var(--color-success)' : 'var(--color-primary)'};">
          {data.progress}%
        </span>
      </div>
      <div class="h-3 rounded-full overflow-hidden" style="background: var(--color-surface-3);">
        <div
          class="h-full rounded-full transition-all duration-700"
          style="width: {data.progress}%; background: {isComplete ? 'var(--color-success)' : 'var(--color-primary)'}; transition: width 700ms cubic-bezier(0.23, 1, 0.32, 1);"
          role="progressbar"
          aria-valuenow={data.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Clearance progress"
        ></div>
      </div>

      <!-- Stat pills -->
      <div class="flex flex-wrap gap-3 mt-4">
        {#each [
          { label: 'Approved', count: data.request.clearances.filter(c => c.status === 'approved').length, color: 'var(--color-success)', bg: 'var(--color-success-light)' },
          { label: 'Pending Review', count: data.request.clearances.filter(c => c.status === 'pending').length, color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
          { label: 'Rejected', count: data.request.clearances.filter(c => c.status === 'rejected').length, color: 'var(--color-danger)', bg: 'var(--color-danger-light)' },
          { label: 'Not Submitted', count: data.request.clearances.filter(c => c.status === 'not_submitted').length, color: 'var(--color-text-muted)', bg: 'var(--color-surface-3)' },
        ] as stat}
          <div
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style="background: {stat.bg}; color: {stat.color};"
          >
            <span class="font-bold text-sm">{stat.count}</span>
            {stat.label}
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Clearance grid -->
  <h2 class="text-base font-semibold mb-4" style="color: var(--color-text);">Department Clearances</h2>
  <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
    {#each data.request.clearances as item}
      <div class="group">
        <ClearanceStatusCard {item} showDocuments={true} />
        {#if item.status === 'not_submitted' || item.status === 'rejected'}
          <button
            class="btn btn-ghost w-full mt-2 text-xs"
            onclick={() => openUpload(item.department as Department)}
            style="min-height: 36px;"
          >
            {item.status === 'rejected' ? 'Re-upload Documents' : 'Upload Documents'}
          </button>
        {/if}
      </div>
    {/each}
  </div>
</div>

<!-- Upload modal -->
{#if uploadDept}
  <UploadModal
    department={uploadDept}
    onclose={() => (uploadDept = null)}
    onsuccess={handleUploadSuccess}
  />
{/if}

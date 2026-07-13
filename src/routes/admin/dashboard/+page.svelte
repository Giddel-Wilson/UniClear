<script lang="ts">
  import type { PageData } from './$types';
  import { DEPARTMENT_LABELS } from '$lib/types';
  import { ClipboardList, CheckCircle, Clock, User, ChevronRight } from 'lucide-svelte';

  let { data }: { data: PageData } = $props();

  function statusColor(status: string) {
    return { approved: 'var(--color-success)', rejected: 'var(--color-danger)', pending: 'var(--color-warning)', not_submitted: 'var(--color-text-subtle)' }[status] ?? 'var(--color-text-muted)';
  }
</script>

<svelte:head><title>Admin Dashboard — UniClear</title></svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8 page-enter">
  <!-- Header -->
  <div class="mb-8">
    <p class="text-sm font-medium mb-1" style="color: var(--color-text-muted);">
      {data.adminDept ? DEPARTMENT_LABELS[data.adminDept] : 'All Departments'}
    </p>
    <h1 class="text-2xl font-bold" style="color: var(--color-text); font-family: var(--font-display);">
      Clearance Review Dashboard
    </h1>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-3 gap-4 mb-8 stagger-children">
    {#each [
      { label: 'Total Requests', count: data.stats.total, icon: ClipboardList, color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
      { label: 'Pending Review', count: data.stats.pending, icon: Clock, color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
      { label: 'Fully Cleared', count: data.stats.approved, icon: CheckCircle, color: 'var(--color-success)', bg: 'var(--color-success-light)' },
    ] as stat}
      <div class="card p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background: {stat.bg}; color: {stat.color};">
            <stat.icon size={18} />
          </div>
          <span class="text-sm font-medium" style="color: var(--color-text-muted);">{stat.label}</span>
        </div>
        <p class="text-3xl font-bold" style="color: var(--color-text);">{stat.count}</p>
      </div>
    {/each}
  </div>

  <!-- Requests table -->
  <div class="card overflow-hidden">
    <div class="px-6 py-4" style="border-bottom: 1px solid var(--color-border);">
      <h2 class="font-semibold" style="color: var(--color-text);">Student Requests</h2>
    </div>

    {#if data.requests.length === 0}
      <div class="text-center py-16">
        <ClipboardList size={40} class="mx-auto mb-3" style="color: var(--color-text-subtle);" />
        <p class="font-medium" style="color: var(--color-text);">No requests yet</p>
        <p class="text-sm mt-1" style="color: var(--color-text-muted);">Students will appear here once they submit documents.</p>
      </div>
    {:else}
      <div class="divide-y" style="--tw-divide-opacity: 1;">
        {#each data.requests as req}
          <a
            href="/admin/review/{req._id}"
            class="flex items-center gap-4 px-6 py-4 transition-colors group"
            style="text-decoration: none; color: inherit;"
            onmouseenter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
            onmouseleave={(e) => (e.currentTarget.style.background = '')}
          >
            <!-- Avatar -->
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm"
              style="background: var(--color-primary-light); color: var(--color-primary);"
            >
              {req.student.name.charAt(0).toUpperCase()}
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate" style="color: var(--color-text);">{req.student.name}</p>
              <p class="text-xs mt-0.5 truncate" style="color: var(--color-text-muted);">
                {req.student.matricNumber} · {req.student.programme}
              </p>
            </div>

            <!-- Status mini-badges -->
            <div class="hidden sm:flex gap-1.5 flex-wrap justify-end max-w-48">
              {#each req.clearances.slice(0, 4) as c}
                <span
                  class="badge"
                  style="background: color-mix(in srgb, {statusColor(c.status)} 12%, transparent); color: {statusColor(c.status)}; font-size: 0.65rem; padding: 0.15rem 0.5rem;"
                >
                  {c.status === 'not_submitted' ? '—' : c.status}
                </span>
              {/each}
            </div>

            <ChevronRight size={18} style="color: var(--color-text-subtle); flex-shrink: 0;" />
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>

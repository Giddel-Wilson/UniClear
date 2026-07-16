<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import { DEPARTMENT_LABELS } from '$lib/types';
  import { ArrowLeft, ClipboardList, ChevronRight, Clock, CheckCircle, XCircle, FileQuestion, Search, X } from 'lucide-svelte';

  let { data }: { data: PageData } = $props();

  let searchInput = $state(data.searchQuery ?? '');
  let searchTimeout: ReturnType<typeof setTimeout>;

  const tabs = [
    { key: 'pending', label: 'Pending', icon: Clock, color: 'var(--color-warning)' },
    { key: 'approved', label: 'Approved', icon: CheckCircle, color: 'var(--color-success)' },
    { key: 'rejected', label: 'Rejected', icon: XCircle, color: 'var(--color-danger)' },
    { key: 'not_submitted', label: 'Not Submitted', icon: FileQuestion, color: 'var(--color-text-muted)' },
    { key: 'all', label: 'All', icon: ClipboardList, color: 'var(--color-primary)' },
  ] as const;

  function setFilter(key: string) {
    const url = new URL($page.url);
    url.searchParams.set('status', key);
    goto(url.toString(), { keepFocus: true, noScroll: true });
  }

  function handleSearchInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const url = new URL($page.url);
      if (searchInput.trim()) {
        url.searchParams.set('search', searchInput.trim());
      } else {
        url.searchParams.delete('search');
      }
      goto(url.toString(), { keepFocus: true, noScroll: true });
    }, 350);
  }

  function clearSearch() {
    searchInput = '';
    const url = new URL($page.url);
    url.searchParams.delete('search');
    goto(url.toString(), { keepFocus: true, noScroll: true });
  }

  function statusColor(status: string) {
    return {
      approved: 'var(--color-success)',
      rejected: 'var(--color-danger)',
      pending: 'var(--color-warning)',
      not_submitted: 'var(--color-text-subtle)',
    }[status] ?? 'var(--color-text-muted)';
  }
</script>

<svelte:head><title>Review Requests — UniClear</title></svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8 page-enter">
  <div class="mb-6">
    <p class="text-sm font-medium mb-1" style="color: var(--color-text-muted);">
      {data.adminDept ? DEPARTMENT_LABELS[data.adminDept] : 'All Departments'}
    </p>
    <h1 class="text-2xl font-bold" style="color: var(--color-text); font-family: var(--font-display);">
      Review Requests
    </h1>
  </div>

  <!-- Search bar -->
  <div class="relative mb-4 input">
    <Search size={16} class="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--color-text-subtle);" />
    <input
      type="text"
      bind:value={searchInput}
      oninput={handleSearchInput}
      placeholder="Search by name, email, matric number, faculty, or programme..."
      class="pl-10 pr-10 outline-none w-full"
    />
    {#if searchInput}
      <button
        onclick={clearSearch}
        class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
        style="color: var(--color-text-muted);"
        aria-label="Clear search"
      >
        <X size={15} />
      </button>
    {/if}
  </div>

  <!-- Filter tabs -->
  <div class="flex gap-2 mb-6 overflow-x-auto pb-1">
    {#each tabs as tab}
      {@const active = data.activeFilter === tab.key}
      <button
        onclick={() => setFilter(tab.key)}
        class="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0"
        style="background: {active ? tab.color : 'var(--color-surface)'}; color: {active ? 'white' : 'var(--color-text-muted)'}; border: 1px solid {active ? tab.color : 'var(--color-border)'};"
      >
        <tab.icon size={14} />
        {tab.label}
        <span
          class="ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold"
          style="background: {active ? 'rgba(255,255,255,0.25)' : 'var(--color-surface-3)'}; color: {active ? 'white' : 'var(--color-text-muted)'};"
        >
          {data.counts[tab.key]}
        </span>
      </button>
    {/each}
  </div>

  <!-- Requests list -->
  <div class="card overflow-hidden">
    {#if data.requests.length === 0}
      <div class="text-center py-16">
        <ClipboardList size={40} class="mx-auto mb-3" style="color: var(--color-text-subtle);" />
        <p class="font-medium" style="color: var(--color-text);">
          {data.searchQuery ? 'No matching requests' : 'No requests in this category'}
        </p>
        <p class="text-sm mt-1" style="color: var(--color-text-muted);">
          {data.searchQuery ? 'Try a different search term.' : 'Try a different filter above.'}
        </p>
      </div>
    {:else}
      <div class="divide-y">
        {#each data.requests as req}
          <a
            href="/admin/review/{req._id}"
            class="flex items-center gap-4 px-6 py-4 transition-colors"
            style="text-decoration: none; color: inherit;"
            onmouseenter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
            onmouseleave={(e) => (e.currentTarget.style.background = '')}
          >
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm"
              style="background: var(--color-primary-light); color: var(--color-primary);"
            >
              {req.student.name.charAt(0).toUpperCase()}
            </div>

            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate" style="color: var(--color-text);">{req.student.name}</p>
              <p class="text-xs mt-0.5 truncate" style="color: var(--color-text-muted);">
                {req.student.matricNumber} · {req.student.programme}
              </p>
            </div>

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

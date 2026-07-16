<script lang="ts">
  import type { ClearanceItem } from '$lib/types';
  import { DEPARTMENT_LABELS } from '$lib/types';
  import { CheckCircle, XCircle, Clock, FileQuestion, FileText } from 'lucide-svelte';

  let { item, showDocuments = false }: { item: ClearanceItem; showDocuments?: boolean } = $props();

  const statusConfig = {
    approved: {
      label: 'Approved',
      icon: CheckCircle,
      color: 'var(--color-success)',
      bg: 'var(--color-success-light)',
      badgeClass: 'badge-approved',
    },
    rejected: {
      label: 'Rejected',
      icon: XCircle,
      color: 'var(--color-danger)',
      bg: 'var(--color-danger-light)',
      badgeClass: 'badge-rejected',
    },
    pending: {
      label: 'Under Review',
      icon: Clock,
      color: 'var(--color-warning)',
      bg: 'var(--color-warning-light)',
      badgeClass: 'badge-pending',
    },
    not_submitted: {
      label: 'Not Submitted',
      icon: FileQuestion,
      color: 'var(--color-text-muted)',
      bg: 'var(--color-surface-3)',
      badgeClass: 'badge-not_submitted',
    },
  };

  const config = statusConfig[item.status];
</script>

<div
  class="card p-4 transition-all duration-200"
  style="border-left: 3px solid {config.color};"
>
  <div class="flex items-start justify-between gap-3">
    <div class="flex items-center gap-3 min-w-0">
      <div
        class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style="background: {config.bg}; color: {config.color};"
      >
        <config.icon size={18} />
      </div>
      <div class="min-w-0">
        <p class="font-semibold text-sm truncate" style="color: var(--color-text);">
          {DEPARTMENT_LABELS[item.department]}
        </p>
        {#if item.comment}
          <p class="text-xs mt-0.5 line-clamp-2" style="color: var(--color-text-muted);">
            {item.comment}
          </p>
        {/if}
      </div>
    </div>

    <span class="badge {config.badgeClass} flex-shrink-0">
      {config.label}
    </span>
  </div>

  {#if showDocuments && item.documents.length > 0}
    <div class="mt-3 pt-3 space-y-1.5" style="border-top: 1px solid var(--color-border);">
      {#each item.documents as doc}
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 text-xs rounded-md p-1.5 transition-colors"
          style="color: var(--color-primary);"
          aria-label="Open {doc.name} in new tab"
        >
          <FileText size={13} />
          <span class="truncate">{doc.name}</span>
          <span class="ml-auto flex-shrink-0" style="color: var(--color-text-subtle);">
            {(doc.size / 1024).toFixed(0)}KB
          </span>
        </a>
      {/each}
    </div>
  {/if}

  {#if item.reviewedAt}
    <p class="text-xs mt-2" style="color: var(--color-text-subtle);">
      Reviewed {new Date(item.reviewedAt).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}
    </p>
  {/if}
</div>

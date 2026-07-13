<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';
  import { DEPARTMENT_LABELS } from '$lib/types';
  import ClearanceStatusCard from '$lib/components/ClearanceStatusCard.svelte';
  import { CheckCircle, XCircle, ArrowLeft, FileText, AlertCircle, User } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let comment = $state('');
  let submitting = $state(false);

  // Only show items the admin can act on
  const reviewableItems = $derived(
    data.adminDept
      ? data.request.clearances.filter(c => c.department === data.adminDept && c.status === 'pending')
      : data.request.clearances.filter(c => c.status === 'pending')
  );

  const allItems = $derived(
    data.adminDept
      ? data.request.clearances.filter(c => c.department === data.adminDept)
      : data.request.clearances
  );
</script>

<svelte:head><title>Review Request — UniClear</title></svelte:head>

<div class="max-w-3xl mx-auto px-4 py-8 page-enter">
  <!-- Back nav -->
  <a href="/admin/dashboard" class="inline-flex items-center gap-1.5 text-sm mb-6 btn btn-ghost" style="min-height: 36px; padding: 0.375rem 0.75rem;">
    <ArrowLeft size={16} /> Back to Dashboard
  </a>

  <!-- Student info card -->
  <div class="card p-5 mb-6">
    <div class="flex items-center gap-4">
      <div
        class="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
        style="background: var(--color-primary-light); color: var(--color-primary);"
      >
        {data.request.student.name.charAt(0).toUpperCase()}
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="text-lg font-semibold truncate" style="color: var(--color-text);">{data.request.student.name}</h1>
        <div class="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
          <span class="text-sm" style="color: var(--color-text-muted);">{data.request.student.matricNumber}</span>
          <span class="text-sm" style="color: var(--color-text-muted);">{data.request.student.programme}</span>
          <span class="text-sm" style="color: var(--color-text-muted);">{data.request.student.faculty}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Success/error feedback -->
  {#if form?.success}
    <div
      class="flex items-center gap-2 p-3 rounded-lg text-sm mb-5"
      style="background: var(--color-success-light); color: var(--color-success);"
      role="status"
    >
      <CheckCircle size={16} />
      Clearance {form.action === 'approve' ? 'approved' : 'rejected'} successfully.
    </div>
  {/if}
  {#if form?.message && !form?.success}
    <div
      class="flex items-start gap-2 p-3 rounded-lg text-sm mb-5"
      style="background: var(--color-danger-light); color: var(--color-danger);"
      role="alert"
    >
      <AlertCircle size={16} class="flex-shrink-0 mt-0.5" />
      {form.message}
    </div>
  {/if}

  <!-- Items to review -->
  {#if reviewableItems.length > 0}
    <h2 class="text-base font-semibold mb-4" style="color: var(--color-text);">Pending Review</h2>
    <div class="space-y-4">
      {#each reviewableItems as item}
        <div class="card p-5">
          <div class="flex items-center gap-2 mb-4">
            <span class="font-semibold text-sm" style="color: var(--color-text);">
              {DEPARTMENT_LABELS[item.department]}
            </span>
            <span class="badge badge-pending">Pending</span>
          </div>

          <!-- Documents list -->
          {#if item.documents.length > 0}
            <div class="space-y-2 mb-4">
              <p class="text-xs font-medium uppercase tracking-wide" style="color: var(--color-text-muted);">
                Submitted Documents ({item.documents.length})
              </p>
              {#each item.documents as doc}
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2.5 p-3 rounded-lg transition-colors"
                  style="background: var(--color-surface-2); border: 1px solid var(--color-border); text-decoration: none;"
                  onmouseenter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onmouseleave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                >
                  <FileText size={16} style="color: var(--color-primary); flex-shrink: 0;" />
                  <span class="text-sm font-medium flex-1 truncate" style="color: var(--color-text);">{doc.name}</span>
                  <span class="text-xs flex-shrink-0" style="color: var(--color-text-subtle);">
                    {(doc.size / 1024).toFixed(0)} KB
                  </span>
                </a>
              {/each}
            </div>
          {:else}
            <p class="text-sm mb-4" style="color: var(--color-text-muted);">No documents uploaded.</p>
          {/if}

          <!-- Review form -->
          <form
            method="POST"
            action="?/review"
            use:enhance={() => {
              submitting = true;
              return async ({ update }) => {
                submitting = false;
                comment = '';
                await update();
              };
            }}
          >
            <input type="hidden" name="department" value={item.department} />

            <div class="mb-3">
              <label for="comment-{item.department}" class="block text-sm font-medium mb-1.5" style="color: var(--color-text);">
                Comment <span style="color: var(--color-text-subtle);">(optional)</span>
              </label>
              <textarea
                id="comment-{item.department}"
                name="comment"
                rows="2"
                maxlength="500"
                placeholder="Add a note for the student..."
                class="input resize-none"
                style="min-height: unset;"
              ></textarea>
            </div>

            <div class="flex gap-3">
              <button
                type="submit"
                name="action"
                value="reject"
                class="btn btn-danger flex-1"
                disabled={submitting}
              >
                <XCircle size={16} /> Reject
              </button>
              <button
                type="submit"
                name="action"
                value="approve"
                class="btn btn-success flex-1"
                disabled={submitting}
              >
                <CheckCircle size={16} /> Approve
              </button>
            </div>
          </form>
        </div>
      {/each}
    </div>
  {/if}

  <!-- All items overview -->
  {#if allItems.length > 0}
    <h2 class="text-base font-semibold mb-4 mt-8" style="color: var(--color-text);">All Items</h2>
    <div class="space-y-2">
      {#each allItems as item}
        <ClearanceStatusCard {item} showDocuments={true} />
      {/each}
    </div>
  {/if}
</div>

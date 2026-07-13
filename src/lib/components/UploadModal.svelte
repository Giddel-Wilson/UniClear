<script lang="ts">
  import type { Department } from '$lib/types';
  import { DEPARTMENT_LABELS, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '$lib/types';
  import { X, Upload, FileText, AlertCircle } from 'lucide-svelte';
  import { invalidateAll } from '$app/navigation';

  let {
    department,
    onclose,
    onsuccess,
  }: {
    department: Department;
    onclose: () => void;
    onsuccess: () => void;
  } = $props();

  let files = $state<File[]>([]);
  let dragOver = $state(false);
  let uploading = $state(false);
  let error = $state('');

  const MAX_FILES = 5;

  const EXTENSION_MIME_MAP: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };

  function resolveMimeType(file: File): string {
    if (file.type && file.type !== 'application/octet-stream') return file.type;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    return EXTENSION_MIME_MAP[ext] ?? file.type;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    const dropped = Array.from(e.dataTransfer?.files ?? []).filter(f => f.size > 0);
    if (dropped.length === 0) return;
    addFiles(dropped);
  }

  function handleFileInput(e: Event) {
    const target = e.target as HTMLInputElement;
    addFiles(Array.from(target.files ?? []).filter(f => f.size > 0));
  }

  function addFiles(incoming: File[]) {
    error = '';
    if (incoming.length === 0) return;
    for (const file of incoming) {
      const resolvedType = resolveMimeType(file);
      if (!ALLOWED_MIME_TYPES.includes(resolvedType)) {
        error = `"${file.name}" is not allowed. Only PDF, JPEG, PNG or WebP.`;
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        error = `"${file.name}" exceeds the 5 MB limit.`;
        return;
      }
    }
    files = [...files, ...incoming].slice(0, MAX_FILES);
  }

  function removeFile(index: number) {
    files = files.filter((_, i) => i !== index);
  }

  function formatSize(bytes: number) {
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(0)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose();
  }

  /**
   * Submit handler — builds FormData manually from the files state array
   * so dragged files (which never enter the <input> element) are included.
   * Uses fetch directly instead of native form submission.
   */
  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (files.length === 0 || uploading) return;

    uploading = true;
    error = '';

    const fd = new FormData();
    fd.append('department', department);
    for (const file of files) {
      fd.append('files', file, file.name);
    }

    try {
      const res = await fetch('/student/upload?/upload', {
        method: 'POST',
        body: fd,
        // Do NOT set Content-Type — browser sets it with the correct boundary
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json?.type === 'success') {
        await invalidateAll();
        onsuccess();
        onclose();
      } else {
        const msg = json?.data?.message ?? json?.error?.message ?? 'Upload failed. Please try again.';
        error = msg;
      }
    } catch (err) {
      console.error('Upload fetch error:', err);
      error = 'Network error. Please try again.';
    } finally {
      uploading = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="modal-overlay" onclick={(e) => e.target === e.currentTarget && onclose()} role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <div class="modal-panel p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      <div>
        <h2 id="modal-title" class="text-lg font-semibold" style="color: var(--color-text);">
          Upload Documents
        </h2>
        <p class="text-sm mt-0.5" style="color: var(--color-text-muted);">
          {DEPARTMENT_LABELS[department]}
        </p>
      </div>
      <button
        onclick={onclose}
        class="btn btn-ghost"
        style="padding: 0.5rem; min-width: 44px;"
        aria-label="Close modal"
      >
        <X size={20} />
      </button>
    </div>

    <form onsubmit={handleSubmit}>
      <!-- Drop zone -->
      <label
        class="block rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors duration-150"
        style="border-color: {dragOver ? 'var(--color-primary)' : 'var(--color-border-strong)'}; background: {dragOver ? 'var(--color-primary-light)' : 'var(--color-surface-2)'};"
        ondragover={(e) => { e.preventDefault(); dragOver = true; }}
        ondragleave={() => (dragOver = false)}
        ondrop={handleDrop}
        for="file-input"
      >
        <div
          class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors duration-150"
          style="background: {dragOver ? 'var(--color-primary-light)' : 'var(--color-surface-3)'}; color: {dragOver ? 'var(--color-primary)' : 'var(--color-text-muted)'};"
        >
          <Upload size={22} />
        </div>
        <p class="text-sm font-medium" style="color: var(--color-text);">
          Drop files here or <span style="color: var(--color-primary);">browse</span>
        </p>
        <p class="text-xs mt-1" style="color: var(--color-text-muted);">
          PDF, JPEG, PNG, WebP · Max 5 MB per file · Up to {MAX_FILES} files
        </p>
        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          class="sr-only"
          onchange={handleFileInput}
        />
      </label>

      <!-- File list -->
      {#if files.length > 0}
        <ul class="mt-4 space-y-2" role="list" aria-label="Selected files">
          {#each files as file, i}
            <li
              class="flex items-center gap-3 p-3 rounded-lg"
              style="background: var(--color-surface-2); border: 1px solid var(--color-border);"
            >
              <FileText size={18} style="color: var(--color-primary); flex-shrink: 0;" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium truncate" style="color: var(--color-text);">
                  {file.name}
                </p>
                <p class="text-xs" style="color: var(--color-text-muted);">{formatSize(file.size)}</p>
              </div>
              <button
                type="button"
                onclick={() => removeFile(i)}
                class="flex-shrink-0 p-1 rounded transition-colors"
                style="color: var(--color-text-muted);"
                aria-label="Remove {file.name}"
              >
                <X size={16} />
              </button>
            </li>
          {/each}
        </ul>
      {/if}

      <!-- Error -->
      {#if error}
        <div
          class="flex items-start gap-2 mt-4 p-3 rounded-lg text-sm"
          style="background: var(--color-danger-light); color: var(--color-danger);"
          role="alert"
        >
          <AlertCircle size={16} class="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      {/if}

      <!-- Actions -->
      <div class="flex gap-3 mt-5">
        <button type="button" class="btn btn-ghost flex-1" onclick={onclose} disabled={uploading}>
          Cancel
        </button>
        <button
          type="submit"
          class="btn btn-primary flex-1"
          disabled={uploading || files.length === 0}
          aria-busy={uploading}
        >
          {#if uploading}
            <span class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
            Uploading…
          {:else}
            <Upload size={16} />
            Upload {files.length > 1 ? `${files.length} Files` : 'File'}
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>
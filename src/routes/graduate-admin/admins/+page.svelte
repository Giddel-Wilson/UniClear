<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData, ActionData } from './$types';
  import { DEPARTMENT_LABELS, ALL_DEPARTMENTS } from '$lib/types';
  import type { Department } from '$lib/types';
  import {
    Plus, X, Pencil, Trash2, RefreshCw, ArrowLeftRight,
    CheckCircle, AlertCircle, ChevronDown, User,
  } from 'lucide-svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // ── Modal state ────────────────────────────────────────────────────────────
  type ModalMode = 'create' | 'edit' | 'resetPassword' | 'reassign' | 'delete' | null;
  let modalMode  = $state<ModalMode>(data.openAction === 'new' ? 'create' : null);
  let activeAdmin = $state<typeof data.admins[0] | null>(null);
  let submitting  = $state(false);
  let newPassword = $state('');

  function open(mode: ModalMode, admin?: typeof data.admins[0]) {
    modalMode   = mode;
    activeAdmin = admin ?? null;
    newPassword = '';
  }

  function close() { modalMode = null; activeAdmin = null; }

  function handleKeydown(e: KeyboardEvent) { if (e.key === 'Escape') close(); }

  // ── Filter ─────────────────────────────────────────────────────────────────
  let filterDept = $state<string>(data.filterDept ?? '');

  function applyFilter() {
    const u = new URL($page.url);
    if (filterDept) u.searchParams.set('dept', filterDept);
    else u.searchParams.delete('dept');
    goto(u.toString(), { replaceState: true });
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head><title>Manage Admins — UniClear</title></svelte:head>

<div class="max-w-5xl mx-auto px-4 py-8 page-enter">

  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <a href="/graduate-admin/dashboard" class="text-sm mb-1 inline-flex items-center gap-1" style="color: var(--color-text-muted);">
        ← Dashboard
      </a>
      <h1 class="text-2xl font-bold" style="color: var(--color-text); font-family: var(--font-display);">
        Department Admins
      </h1>
    </div>
    <button class="btn btn-primary gap-2" onclick={() => open('create')}>
      <Plus size={16} /> Add Admin
    </button>
  </div>

  <!-- Toast feedback -->
  {#if form?.success}
    <div class="flex items-center gap-2 p-3 rounded-lg text-sm mb-5" style="background: var(--color-success-light); color: var(--color-success);" role="status">
      <CheckCircle size={16} />{form.message}
    </div>
  {/if}
  {#if form?.message && !form?.success}
    <div class="flex items-start gap-2 p-3 rounded-lg text-sm mb-5" style="background: var(--color-danger-light); color: var(--color-danger);" role="alert">
      <AlertCircle size={16} class="flex-shrink-0 mt-0.5" />{form.message}
    </div>
  {/if}

  <!-- Uncovered departments warning -->
  {#if data.uncoveredDepts.length > 0}
    <div class="p-4 rounded-lg mb-6 text-sm" style="background: var(--color-warning-light); border: 1px solid color-mix(in srgb, var(--color-warning) 30%, transparent);">
      <p class="font-semibold mb-1" style="color: var(--color-warning);">
        ⚠ {data.uncoveredDepts.length} department{data.uncoveredDepts.length > 1 ? 's have' : ' has'} no admin assigned
      </p>
      <p style="color: var(--color-warning);">
        {data.uncoveredDepts.map(d => DEPARTMENT_LABELS[d]).join(' · ')}
      </p>
    </div>
  {/if}

  <!-- Filter bar -->
  <div class="flex gap-3 mb-5">
    <div class="relative flex-1 max-w-xs">
      <select
        bind:value={filterDept}
        onchange={applyFilter}
        class="input pr-8 appearance-none"
      >
        <option value="">All departments</option>
        {#each ALL_DEPARTMENTS as d}
          <option value={d}>{DEPARTMENT_LABELS[d]}</option>
        {/each}
      </select>
      <ChevronDown size={14} class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--color-text-muted);" />
    </div>
  </div>

  <!-- Admins table -->
  <div class="card overflow-hidden">
    {#if data.admins.length === 0}
      <div class="text-center py-14">
        <User size={36} class="mx-auto mb-3" style="color: var(--color-text-subtle);" />
        <p class="font-medium" style="color: var(--color-text);">No admins found</p>
        <p class="text-sm mt-1" style="color: var(--color-text-muted);">
          {filterDept ? 'No admins in this department.' : 'Add your first department admin to get started.'}
        </p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr style="border-bottom: 1px solid var(--color-border); background: var(--color-surface-2);">
              <th class="text-left px-5 py-3 font-medium" style="color: var(--color-text-muted);">Name</th>
              <th class="text-left px-5 py-3 font-medium" style="color: var(--color-text-muted);">Email</th>
              <th class="text-left px-5 py-3 font-medium" style="color: var(--color-text-muted);">Department</th>
              <th class="text-left px-5 py-3 font-medium" style="color: var(--color-text-muted);">Note</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {#each data.admins as admin}
              <tr
                class="transition-colors"
                style="border-bottom: 1px solid var(--color-border);"
                onmouseenter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                onmouseleave={(e) => (e.currentTarget.style.background = '')}
              >
                <td class="px-5 py-3.5 font-medium" style="color: var(--color-text);">
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style="background: var(--color-primary-light); color: var(--color-primary);">
                      {admin.name.charAt(0).toUpperCase()}
                    </div>
                    {admin.name}
                  </div>
                </td>
                <td class="px-5 py-3.5" style="color: var(--color-text-muted);">{admin.email}</td>
                <td class="px-5 py-3.5">
                  <span class="badge badge-not_submitted" style="font-size: 0.7rem;">
                    {DEPARTMENT_LABELS[admin.department as Department] ?? admin.department ?? '—'}
                  </span>
                </td>
                <td class="px-5 py-3.5 max-w-[180px]">
                  <span class="text-xs truncate block" style="color: var(--color-text-subtle);">
                    {admin.adminNote ?? '—'}
                  </span>
                </td>
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-1 justify-end">
                    <button title="Edit" class="btn btn-ghost" style="padding: 0.375rem; min-width: 34px; min-height: 34px;" onclick={() => open('edit', admin)}>
                      <Pencil size={14} />
                    </button>
                    <button title="Reassign department" class="btn btn-ghost" style="padding: 0.375rem; min-width: 34px; min-height: 34px;" onclick={() => open('reassign', admin)}>
                      <ArrowLeftRight size={14} />
                    </button>
                    <button title="Reset password" class="btn btn-ghost" style="padding: 0.375rem; min-width: 34px; min-height: 34px;" onclick={() => open('resetPassword', admin)}>
                      <RefreshCw size={14} />
                    </button>
                    <button title="Delete" class="btn btn-ghost" style="padding: 0.375rem; min-width: 34px; min-height: 34px; color: var(--color-danger);" onclick={() => open('delete', admin)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<!-- ── Modals ──────────────────────────────────────────────────────────────── -->
{#if modalMode}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="modal-overlay" onclick={(e) => e.target === e.currentTarget && close()} role="dialog" aria-modal="true">
    <div class="modal-panel p-6 w-full" style="max-width: 480px;">

      <!-- ── CREATE ──────────────────────────────────────────────────── -->
      {#if modalMode === 'create'}
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-semibold" style="color: var(--color-text);">Add Department Admin</h2>
          <button class="btn btn-ghost" style="padding: 0.5rem; min-width: 44px;" onclick={close}><X size={18} /></button>
        </div>
        <form
          method="POST"
          action="?/create"
          use:enhance={() => {
            submitting = true;
            return async ({ update }) => { submitting = false; close(); await update(); };
          }}
          class="space-y-4"
        >
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--color-text);">Full Name</label>
            <input name="name" type="text" required placeholder="Dr. Amaka Okonkwo" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--color-text);">Email Address</label>
            <input name="email" type="email" required placeholder="amaka@university.edu.ng" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--color-text);">Temporary Password</label>
            <input name="password" type="password" required placeholder="Min. 10 characters" minlength="10" class="input" />
            <p class="text-xs mt-1" style="color: var(--color-text-subtle);">Admin should change this on first login.</p>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--color-text);">Department</label>
            <div class="relative">
              <select name="department" required class="input pr-8 appearance-none">
                <option value="">Select department…</option>
                {#each ALL_DEPARTMENTS as d}
                  <option value={d}>{DEPARTMENT_LABELS[d]}</option>
                {/each}
              </select>
              <ChevronDown size={14} class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--color-text-muted);" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--color-text);">
              Note <span style="color: var(--color-text-subtle);">(optional)</span>
            </label>
            <input name="adminNote" type="text" placeholder="e.g. Acting HOD, Sciences Faculty" class="input" />
          </div>
          <div class="flex gap-3 pt-1">
            <button type="button" class="btn btn-ghost flex-1" onclick={close}>Cancel</button>
            <button type="submit" class="btn btn-primary flex-1" disabled={submitting}>
              {#if submitting}<span class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>{/if}
              Create Admin
            </button>
          </div>
        </form>

      <!-- ── EDIT ────────────────────────────────────────────────────── -->
      {:else if modalMode === 'edit' && activeAdmin}
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-semibold" style="color: var(--color-text);">Edit Admin</h2>
          <button class="btn btn-ghost" style="padding: 0.5rem; min-width: 44px;" onclick={close}><X size={18} /></button>
        </div>
        <form
          method="POST"
          action="?/update"
          use:enhance={() => {
            submitting = true;
            return async ({ update }) => { submitting = false; close(); await update(); };
          }}
          class="space-y-4"
        >
          <input type="hidden" name="adminId" value={activeAdmin._id} />
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--color-text);">Full Name</label>
            <input name="name" type="text" value={activeAdmin.name} required class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--color-text);">Note</label>
            <input name="adminNote" type="text" value={activeAdmin.adminNote ?? ''} class="input" />
          </div>
          <div class="flex gap-3 pt-1">
            <button type="button" class="btn btn-ghost flex-1" onclick={close}>Cancel</button>
            <button type="submit" class="btn btn-primary flex-1" disabled={submitting}>Save Changes</button>
          </div>
        </form>

      <!-- ── REASSIGN ────────────────────────────────────────────────── -->
      {:else if modalMode === 'reassign' && activeAdmin}
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-semibold" style="color: var(--color-text);">Reassign Department</h2>
          <button class="btn btn-ghost" style="padding: 0.5rem; min-width: 44px;" onclick={close}><X size={18} /></button>
        </div>
        <p class="text-sm mb-4" style="color: var(--color-text-muted);">
          Moving <strong style="color: var(--color-text);">{activeAdmin.name}</strong> from
          <strong style="color: var(--color-text);">{DEPARTMENT_LABELS[activeAdmin.department as Department] ?? activeAdmin.department}</strong>.
        </p>
        <form
          method="POST"
          action="?/reassign"
          use:enhance={() => {
            submitting = true;
            return async ({ update }) => { submitting = false; close(); await update(); };
          }}
          class="space-y-4"
        >
          <input type="hidden" name="adminId" value={activeAdmin._id} />
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--color-text);">New Department</label>
            <div class="relative">
              <select name="newDepartment" required class="input pr-8 appearance-none">
                <option value="">Select new department…</option>
                {#each ALL_DEPARTMENTS as d}
                  <option value={d} selected={d === activeAdmin.department}>{DEPARTMENT_LABELS[d]}</option>
                {/each}
              </select>
              <ChevronDown size={14} class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--color-text-muted);" />
            </div>
          </div>
          <div class="flex gap-3 pt-1">
            <button type="button" class="btn btn-ghost flex-1" onclick={close}>Cancel</button>
            <button type="submit" class="btn btn-primary flex-1" disabled={submitting}>Reassign</button>
          </div>
        </form>

      <!-- ── RESET PASSWORD ──────────────────────────────────────────── -->
      {:else if modalMode === 'resetPassword' && activeAdmin}
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-semibold" style="color: var(--color-text);">Reset Password</h2>
          <button class="btn btn-ghost" style="padding: 0.5rem; min-width: 44px;" onclick={close}><X size={18} /></button>
        </div>
        <p class="text-sm mb-4" style="color: var(--color-text-muted);">
          Set a new temporary password for <strong style="color: var(--color-text);">{activeAdmin.name}</strong>.
        </p>
        <form
          method="POST"
          action="?/resetPassword"
          use:enhance={() => {
            submitting = true;
            return async ({ update }) => { submitting = false; close(); await update(); };
          }}
          class="space-y-4"
        >
          <input type="hidden" name="adminId" value={activeAdmin._id} />
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color: var(--color-text);">New Password</label>
            <input
              name="newPassword"
              type="password"
              bind:value={newPassword}
              required
              minlength="10"
              placeholder="Min. 10 characters"
              class="input"
            />
            <p class="text-xs mt-1" style="color: var(--color-text-subtle);">
              Communicate this to the admin securely — it will not be shown again.
            </p>
          </div>
          <div class="flex gap-3 pt-1">
            <button type="button" class="btn btn-ghost flex-1" onclick={close}>Cancel</button>
            <button type="submit" class="btn btn-primary flex-1" disabled={submitting || newPassword.length < 10}>
              Reset Password
            </button>
          </div>
        </form>

      <!-- ── DELETE ──────────────────────────────────────────────────── -->
      {:else if modalMode === 'delete' && activeAdmin}
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-semibold" style="color: var(--color-danger);">Remove Admin</h2>
          <button class="btn btn-ghost" style="padding: 0.5rem; min-width: 44px;" onclick={close}><X size={18} /></button>
        </div>
        <p class="text-sm mb-2" style="color: var(--color-text);">
          Are you sure you want to remove <strong>{activeAdmin.name}</strong>?
        </p>
        <p class="text-sm mb-5" style="color: var(--color-text-muted);">
          Their account will be deleted. Any clearance items they have already approved or rejected will remain unchanged.
        </p>
        <form
          method="POST"
          action="?/delete"
          use:enhance={() => {
            submitting = true;
            return async ({ update }) => { submitting = false; close(); await update(); };
          }}
          class="flex gap-3"
        >
          <input type="hidden" name="adminId" value={activeAdmin._id} />
          <button type="button" class="btn btn-ghost flex-1" onclick={close}>Cancel</button>
          <button type="submit" class="btn btn-danger flex-1" disabled={submitting}>
            {#if submitting}<span class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>{/if}
            Yes, Remove
          </button>
        </form>
      {/if}

    </div>
  </div>
{/if}

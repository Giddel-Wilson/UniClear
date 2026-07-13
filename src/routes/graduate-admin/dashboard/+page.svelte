<script lang="ts">
  import type { PageData } from './$types';
  import { DEPARTMENT_LABELS } from '$lib/types';
  import {
    Users, UserCheck, ClipboardList, CheckCircle,
    Settings, Plus, ArrowRight,
  } from 'lucide-svelte';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Graduate Admin — UniClear</title></svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8 page-enter">

  <div class="mb-8">
    <p class="text-sm font-medium mb-1" style="color: var(--color-text-muted);">Graduate Programme Office</p>
    <h1 class="text-2xl font-bold" style="color: var(--color-text); font-family: var(--font-display);">
      Clearance Administration
    </h1>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
    {#each [
      { label: 'Total Students',      value: data.stats.totalStudents,  icon: Users,         color: 'var(--color-primary)',  bg: 'var(--color-primary-light)' },
      { label: 'Active Dept. Admins', value: data.stats.totalAdmins,    icon: UserCheck,     color: 'var(--color-success)',  bg: 'var(--color-success-light)' },
      { label: 'Cleared Students',    value: data.stats.completedCount, icon: CheckCircle,   color: 'var(--color-success)',  bg: 'var(--color-success-light)' },
      { label: 'In Progress',         value: data.stats.pendingCount,   icon: ClipboardList, color: 'var(--color-warning)',  bg: 'var(--color-warning-light)' },
    ] as s}
      <div class="card p-5">
        <div class="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style="background:{s.bg}; color:{s.color};">
          <s.icon size={18} />
        </div>
        <p class="text-2xl font-bold mb-0.5" style="color: var(--color-text);">{s.value}</p>
        <p class="text-xs" style="color: var(--color-text-muted);">{s.label}</p>
      </div>
    {/each}
  </div>

  <!-- Actions -->
  <div class="flex flex-wrap gap-3 mb-8">
    <a href="/graduate-admin/admins" class="btn btn-primary gap-2">
      <Settings size={16} /> Manage Admins
    </a>
    <a href="/graduate-admin/admins?action=new" class="btn btn-ghost gap-2">
      <Plus size={16} /> Add New Admin
    </a>
  </div>

  <!-- Department coverage -->
  <h2 class="text-base font-semibold mb-4" style="color: var(--color-text);">Department Coverage</h2>
  <div class="card overflow-hidden">
    {#if data.adminsByDept.length === 0}
      <div class="text-center py-12">
        <UserCheck size={36} class="mx-auto mb-3" style="color: var(--color-text-subtle);" />
        <p class="font-medium" style="color: var(--color-text);">No department admins yet</p>
        <p class="text-sm mt-1 mb-4" style="color: var(--color-text-muted);">
          Add admins for each clearance department.
        </p>
        <a href="/graduate-admin/admins?action=new" class="btn btn-primary">
          <Plus size={16} /> Add First Admin
        </a>
      </div>
    {:else}
      <div class="divide-y">
        {#each data.adminsByDept as dept}
          <div class="flex items-center gap-4 px-5 py-4">
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm" style="color: var(--color-text);">
                {DEPARTMENT_LABELS[dept._id as keyof typeof DEPARTMENT_LABELS] ?? dept._id}
              </p>
              <p class="text-xs mt-0.5" style="color: var(--color-text-muted);">
                {dept.admins.map((a: { name: string }) => a.name).join(', ')}
              </p>
            </div>
            <span
              class="badge"
              style="background: var(--color-success-light); color: var(--color-success);"
            >
              {dept.count} admin{dept.count > 1 ? 's' : ''}
            </span>
            <a href="/graduate-admin/admins?dept={dept._id}" class="btn btn-ghost" style="padding: 0.375rem 0.625rem; min-height: 36px; font-size: 0.75rem;">
              Manage <ArrowRight size={14} />
            </a>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<script lang="ts">
  import { page } from '$app/stores';
  import type { SessionUser } from '$lib/types';
  import { LogOut, LayoutDashboard, Upload, Users, ClipboardCheck, Menu, X, Settings } from 'lucide-svelte';

  let { user }: { user: SessionUser } = $props();

  let menuOpen = $state(false);

  const studentLinks = [
    { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/upload', label: 'Upload Documents', icon: Upload },
  ];

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/review', label: 'Review Requests', icon: ClipboardCheck },
  ];

  const graduateAdminLinks = [
    { href: '/graduate-admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/graduate-admin/admins', label: 'Manage Admins', icon: Settings },
  ];

  const links =
    user.role === 'student' ? studentLinks :
    user.role === 'graduate_admin' ? graduateAdminLinks :
    adminLinks;

  const homeHref =
    user.role === 'student' ? '/student/dashboard' :
    user.role === 'graduate_admin' ? '/graduate-admin/dashboard' :
    '/admin/dashboard';

  function isActive(href: string) {
    return $page.url.pathname.startsWith(href);
  }
</script>

<header
  class="fixed top-0 left-0 right-0 z-50 h-16"
  style="background: var(--color-surface); border-bottom: 1px solid var(--color-border); box-shadow: var(--shadow-sm);"
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
    <!-- Logo -->
    <a
      href={homeHref}
      class="flex items-center gap-2 font-semibold text-base flex-shrink-0"
      style="color: var(--color-text);"
    >
      <div
        class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
        style="background: var(--color-primary);"
      >
        UC
      </div>
      <span class="hidden sm:inline" style="font-family: var(--font-display);">UniClear</span>
    </a>

    <!-- Desktop Nav -->
    <nav class="hidden md:flex items-center gap-1" aria-label="Main navigation">
      {#each links as link}
        {@const active = isActive(link.href)}
        <a
          href={link.href}
          class="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          style="color: {active ? 'var(--color-primary)' : 'var(--color-text-muted)'}; background: {active ? 'var(--color-primary-light)' : 'transparent'};"
          aria-current={active ? 'page' : undefined}
        >
          <link.icon size={16} />
          {link.label}
        </a>
      {/each}
    </nav>

    <!-- Right side -->
    <div class="flex items-center gap-3">
      <div class="hidden md:flex flex-col items-end">
        <span class="text-sm font-medium" style="color: var(--color-text);">{user.name}</span>
        <span class="text-xs capitalize" style="color: var(--color-text-subtle);">
          {user.role}{user.department ? ` · ${user.department}` : ''}
        </span>
      </div>

      <form method="POST" action="/auth/logout" class="hidden md:block">
        <button
          type="submit"
          class="btn btn-ghost"
          style="padding: 0.5rem; min-width: 44px;"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </form>

      <!-- Mobile menu toggle -->
      <button
        class="md:hidden btn btn-ghost"
        style="padding: 0.5rem; min-width: 44px;"
        onclick={() => (menuOpen = !menuOpen)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
      >
        {#if menuOpen}
          <X size={20} />
        {:else}
          <Menu size={20} />
        {/if}
      </button>
    </div>
  </div>

  <!-- Mobile Nav -->
  {#if menuOpen}
    <div
      class="md:hidden px-4 py-3 space-y-1"
      style="background: var(--color-surface); border-top: 1px solid var(--color-border); animation: modalIn 200ms var(--ease-out);"
    >
      {#each links as link}
        {@const active = isActive(link.href)}
        <a
          href={link.href}
          class="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium w-full"
          style="color: {active ? 'var(--color-primary)' : 'var(--color-text-muted)'}; background: {active ? 'var(--color-primary-light)' : 'transparent'};"
          onclick={() => (menuOpen = false)}
        >
          <link.icon size={17} />
          {link.label}
        </a>
      {/each}

      <div style="border-top: 1px solid var(--color-border); margin-top: 0.5rem; padding-top: 0.5rem;">
        <div class="px-3 pb-2">
          <span class="text-sm font-medium block" style="color: var(--color-text);">{user.name}</span>
          <span class="text-xs capitalize" style="color: var(--color-text-subtle);">
            {user.role}{user.department ? ` · ${user.department}` : ''}
          </span>
        </div>
        <form method="POST" action="/auth/logout">
          <button
            type="submit"
            class="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium w-full"
            style="color: var(--color-danger);"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  {/if}
</header>

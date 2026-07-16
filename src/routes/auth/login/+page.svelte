<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';
  import { GraduationCap, Mail, Lock, AlertCircle } from 'lucide-svelte';

  let { form }: { form: ActionData } = $props();
  let loading = $state(false);
</script>

<svelte:head>
  <title>Sign In — UniClear</title>
</svelte:head>

<div class="min-h-screen flex" style="background: var(--color-surface-2);">
  <!-- Left panel (decorative) -->
  <div
    class="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
    style="background: var(--color-primary);"
  >
    <div>
      <div class="flex items-center gap-2 mb-16">
        <div class="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
          <GraduationCap size={20} style="color: white;" />
        </div>
        <span class="text-white font-semibold text-lg" style="font-family: var(--font-display);">UniClear</span>
      </div>
      <h2 class="text-4xl font-bold text-white mb-4" style="font-family: var(--font-display); line-height: 1.2;">
        Your clearance.<br />Your progress.<br />In your hands.
      </h2>
      <p class="text-blue-100 text-base leading-relaxed max-w-sm">
        Track all 14 departmental approvals in real time, submit documents, and graduate without the paperwork.
      </p>
    </div>
    <!-- Decorative circles -->
    <div class="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-10" style="background: white; transform: translate(30%, 30%);"></div>
    <div class="absolute top-1/3 right-0 w-40 h-40 rounded-full opacity-10" style="background: white; transform: translateX(50%);"></div>
    <p class="text-blue-200 text-sm">© {new Date().getFullYear()} UniClear. University Online Clearance System.</p>
  </div>

  <!-- Right panel (form) -->
  <div class="flex-1 flex items-center justify-center p-6">
    <div class="w-full max-w-sm page-enter">
      <!-- Mobile logo -->
      <div class="lg:hidden flex items-center gap-2 mb-8 justify-center">
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center"
          style="background: var(--color-primary);"
        >
          <GraduationCap size={22} style="color: white;" />
        </div>
        <span class="font-semibold text-xl" style="font-family: var(--font-display); color: var(--color-text);">
          UniClear
        </span>
      </div>

      <h1 class="text-2xl font-bold mb-1" style="color: var(--color-text);">Welcome back</h1>
      <p class="text-sm mb-8" style="color: var(--color-text-muted);">
        Sign in to continue to your clearance dashboard.
      </p>

      {#if form?.message}
        <div
          class="flex items-start gap-2 p-3 rounded-lg text-sm mb-5"
          style="background: var(--color-danger-light); color: var(--color-danger);"
          role="alert"
        >
          <AlertCircle size={16} class="flex-shrink-0 mt-0.5" />
          <span>{form.message}</span>
        </div>
      {/if}

      <form
        method="POST"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            loading = false;
            await update();
          };
        }}
        class="space-y-4"
        novalidate
      >
        <div>
          <label for="email" class="block text-sm font-medium mb-1.5" style="color: var(--color-text);">
            Email address
          </label>
          <div class="relative input">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--color-text-subtle);">
              <Mail size={16} />
            </span>
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              placeholder="you@university.edu.ng"
              class="pl-9 outline-none w-full"
            />
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium mb-1.5" style="color: var(--color-text);">
            Password
          </label>
          <div class="relative input">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--color-text-subtle);">
              <Lock size={16} />
            </span>
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              placeholder="••••••••"
              class="pl-9 outline-none w-full"
            />
          </div>
        </div>

        <button type="submit" class="btn btn-primary w-full" disabled={loading} aria-busy={loading}>
          {#if loading}
            <span class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
            Signing in…
          {:else}
            Sign In
          {/if}
        </button>
      </form>

      <p class="text-sm text-center mt-6" style="color: var(--color-text-muted);">
        New student?{' '}
        <a href="/auth/register" style="color: var(--color-primary); font-weight: 500;">
          Create account
        </a>
      </p>
    </div>
  </div>
</div>

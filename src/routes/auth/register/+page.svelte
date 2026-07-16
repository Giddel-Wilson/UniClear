<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';
  import { GraduationCap, User, Mail, Lock, Hash, BookOpen, AlertCircle } from 'lucide-svelte';

  let { form }: { form: ActionData } = $props();
  let loading = $state(false);
  let step = $state(1);
</script>

<svelte:head><title>Register — UniClear</title></svelte:head>

<div class="min-h-screen flex items-center justify-center px-4 py-12" style="background: var(--color-surface-2);">
  <div class="w-full max-w-md page-enter">
    <!-- Header -->
    <div class="text-center mb-8">
      <a href="/" class="inline-flex items-center gap-2 mb-4">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: var(--color-primary);">
          <GraduationCap size={22} style="color: white;" />
        </div>
        <span class="font-semibold text-xl" style="font-family: var(--font-display); color: var(--color-text);">UniClear</span>
      </a>
      <h1 class="text-2xl font-bold" style="color: var(--color-text);">Create your account</h1>
      <p class="text-sm mt-1" style="color: var(--color-text-muted);">Fill in your details to get started with your clearance.</p>
    </div>

    <!-- Progress indicator -->
    <div class="flex gap-2 mb-6">
      {#each [1, 2] as s}
        <div
          class="h-1 flex-1 rounded-full transition-colors duration-300"
          style="background: {step >= s ? 'var(--color-primary)' : 'var(--color-border-strong)'};"
        ></div>
      {/each}
    </div>

    <div class="card p-6">
      {#if form?.message}
        <div
          class="flex items-start gap-2 p-3 rounded-lg text-sm mb-4"
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
        <!-- Step 1: Personal info -->
        <div class="stagger-children space-y-4" class:hidden={step !== 1}>
            <div>
              <label for="name" class="block text-sm font-medium mb-1.5" style="color: var(--color-text);">Full Name</label>
              <div class="relative input">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--color-text-subtle);"><User size={16} /></span>
                <input id="name" name="name" type="text" autocomplete="name" required placeholder="Chukwuemeka Obi" class="pl-6 outline-none w-full" />
              </div>
            </div>

            <div>
              <label for="email" class="block text-sm font-medium mb-1.5" style="color: var(--color-text);">Email Address</label>
              <div class="relative input">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--color-text-subtle);"><Mail size={16} /></span>
                <input id="email" name="email" type="email" autocomplete="email" required placeholder="you@uniport.edu.ng" class="pl-6 outline-none w-full" />
              </div>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium mb-1.5" style="color: var(--color-text);">Password</label>
              <div class="relative input">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--color-text-subtle);"><Lock size={16} /></span>
                <input id="password" name="password" type="password" autocomplete="new-password" required placeholder="Min. 8 characters" class="pl-6 outline-none w-full" minlength="8" />
              </div>
            </div>

            <button type="button" class="btn btn-primary w-full" onclick={() => (step = 2)}>
              Continue →
            </button>
        </div>

        <!-- Step 2: Academic info -->
        <div class="stagger-children space-y-4" class:hidden={step !== 2}>
            <div>
              <label for="matricNumber" class="block text-sm font-medium mb-1.5" style="color: var(--color-text);">Matric Number</label>
              <div class="relative input">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--color-text-subtle);"><Hash size={16} /></span>
                <input id="matricNumber" name="matricNumber" type="text" required placeholder="CSC/2020/001" class="pl-6 outline-none w-full" />
              </div>
            </div>

            <div>
              <label for="faculty" class="block text-sm font-medium mb-1.5" style="color: var(--color-text);">Faculty</label>
              <div class="relative input">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--color-text-subtle);"><BookOpen size={16} /></span>
                <input id="faculty" name="faculty" type="text" required placeholder="Faculty of Sciences" class="pl-6 outline-none w-full" />
              </div>
            </div>

            <div>
              <label for="programme" class="block text-sm font-medium mb-1.5" style="color: var(--color-text);">Programme</label>
              <input id="programme" name="programme" type="text" required placeholder="B.Sc. Computer Science" class="input" />
            </div>

            <div>
              <label for="graduationYear" class="block text-sm font-medium mb-1.5" style="color: var(--color-text);">Graduation Year</label>
              <input id="graduationYear" name="graduationYear" type="number" required placeholder={String(new Date().getFullYear())} min="2000" max={new Date().getFullYear() + 2} class="input" />
            </div>

            <div class="flex gap-3">
              <button type="button" class="btn btn-ghost flex-1" onclick={() => (step = 1)}>← Back</button>
              <button type="submit" class="btn btn-primary flex-1" disabled={loading} aria-busy={loading}>
                {#if loading}
                  <span class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  Creating…
                {:else}
                  Create Account
                {/if}
              </button>
            </div>
        </div>
      </form>
    </div>

    <p class="text-sm text-center mt-4" style="color: var(--color-text-muted);">
      Already have an account?{' '}
      <a href="/auth/login" style="color: var(--color-primary); font-weight: 500;">Sign in</a>
    </p>
  </div>
</div>

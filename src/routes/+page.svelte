<script lang="ts">
  import { GraduationCap, ShieldCheck, Clock, FileCheck } from 'lucide-svelte';
</script>

<svelte:head>
  <title>UniClear — Graduate Online Clearance</title>
</svelte:head>

<div class="min-h-screen flex flex-col" style="background: var(--color-surface);">
  <!-- Hero -->
  <div class="flex-1 flex flex-col items-center justify-center px-4 text-center py-20 page-enter">
    <div
      class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
      style="background: var(--color-primary); color: white;"
    >
      <GraduationCap size={32} />
    </div>

    <h1
      class="text-4xl sm:text-5xl font-bold mb-4 max-w-2xl"
      style="font-family: var(--font-display); color: var(--color-text); line-height: 1.2;"
    >
      Graduate Clearance,<br />
      <span style="color: var(--color-primary);">Done Right.</span>
    </h1>
    <p class="text-lg max-w-xl mb-10" style="color: var(--color-text-muted); line-height: 1.7;">
      Track your departmental clearance, upload documents, and get approved — all in one place.
      No queues. No paper. No stress.
    </p>

    <div class="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
      <a href="/auth/register" class="btn btn-primary text-base px-8 py-3" style="min-height: 52px;">
        Get Started
      </a>
      <a href="/auth/login" class="btn btn-ghost text-base px-8 py-3" style="min-height: 52px;">
        Sign In
      </a>
    </div>
  </div>

  <!-- Features -->
  <div class="max-w-5xl mx-auto px-4 pb-20 w-full">
    <div class="grid sm:grid-cols-3 gap-4 stagger-children">
      {#each [
        { icon: ShieldCheck, title: 'Secure & Verified', desc: 'Role-based access ensures only authorized personnel review your clearance.' },
        { icon: Clock, title: 'Real-Time Status', desc: 'Track approvals from Bursary, Library, Sports and 11 other departments live.' },
        { icon: FileCheck, title: 'Document Upload', desc: 'Upload receipts and evidence securely. Max 5 MB per file, stored on Cloudinary.' },
      ] as feature}
        <div class="card p-5 text-left">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
            style="background: var(--color-primary-light); color: var(--color-primary);"
          >
            <feature.icon size={20} />
          </div>
          <h3 class="font-semibold mb-1" style="color: var(--color-text);">{feature.title}</h3>
          <p class="text-sm" style="color: var(--color-text-muted); line-height: 1.6;">{feature.desc}</p>
        </div>
      {/each}
    </div>
  </div>
</div>

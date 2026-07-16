import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  
  // Move the compiler options here so svelte.config.js is respected
  compilerOptions: {
    runes: ({ filename }) => filename.includes('node_modules') ? undefined : true
  },
  
  kit: {
    adapter: adapter({
      edge: false,
      split: false,
    }),
    csrf: {
      checkOrigin: true,
    },
  },
};

export default config;
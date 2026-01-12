import { defineNitroConfig } from 'nitro/config'

export default defineNitroConfig({
  preset: 'cloudflare-pages',
  output: {
    dir: '.output',
  },
  // Ensure static assets are properly handled
  publicAssets: [
    {
      baseURL: '/',
      dir: 'public',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  ],
})

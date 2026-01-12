# Deploying Frame Studio to Cloudflare Pages

This guide walks you through deploying Frame Studio to Cloudflare Pages with automatic CI/CD from GitHub.

## Prerequisites

- A Cloudflare account (free tier works)
- Your GitHub repository connected to Cloudflare
- Node.js 20+ (Cloudflare Pages will use this automatically)

## Step 1: Connect Your GitHub Repository

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Pages**
3. Click **Create a project** → **Connect to Git**
4. Select **GitHub** and authorize Cloudflare to access your repositories
5. Select the `404mat/frame-studio` repository
6. Click **Begin setup**

## Step 2: Configure Build Settings

In the build configuration screen, use these settings:

- **Project name**: `frame-studio` (or your preferred name)
- **Production branch**: `main` (or your default branch)
- **Build command**: `pnpm build`
- **Build output directory**: `.output/public`
- **Root directory**: `/` (leave as default)
- **Environment variables**: None required for this app

### Build Settings Summary

```
Framework preset: None (or "None")
Build command: pnpm build
Output directory: .output/public
```

## Step 3: Deploy

1. Click **Save and Deploy**
2. Cloudflare will:
   - Install dependencies using `pnpm`
   - Run the build command
   - Deploy the static files from `.output/public`
3. Wait for the build to complete (usually 2-5 minutes)

## Step 4: Custom Domain (Optional)

1. After deployment, go to your project settings
2. Click **Custom domains**
3. Add your domain and follow DNS configuration instructions

## Automatic Deployments

Once connected, Cloudflare Pages will automatically deploy:

- **Production deployments**: Every push to your `main` branch
- **Preview deployments**: Every pull request gets its own preview URL

You can view deployment status and logs in the Cloudflare Pages dashboard.

## Local Testing

To test the build locally before deploying:

```bash
# Build the project
pnpm build

# The output will be in .output/public
# You can serve it with any static file server, e.g.:
npx serve .output/public
```

## Troubleshooting

### Build Fails with "Command not found: pnpm"

**Solution**: Cloudflare Pages should auto-detect pnpm from your `pnpm-lock.yaml` file. If it doesn't, you can add a build environment variable:

- Name: `PNPM_VERSION`
- Value: `latest`

Or switch to npm by updating `package.json` scripts and using `npm install` instead.

### Build Output Directory Not Found

**Solution**: Ensure the build completes successfully. The `.output/public` directory is created during the build process. Check build logs for errors.

### Assets Not Loading

**Solution**: Verify that the `public` directory is being copied correctly. The Nitro config includes public assets configuration. If issues persist, check that asset paths are relative (not absolute).

### Build Timeout

**Solution**: Cloudflare Pages has a 20-minute build timeout on the free tier. If your build takes longer, consider:

- Optimizing dependencies
- Using build caching
- Upgrading to a paid plan for longer build times

## Environment Variables

Currently, no environment variables are required. If you need to add them later:

1. Go to your project settings in Cloudflare Pages
2. Navigate to **Environment variables**
3. Add variables for Production, Preview, or both
4. Redeploy to apply changes

## Monitoring

- View deployment logs in the Cloudflare Pages dashboard
- Check build status and deployment history
- Monitor analytics (available on paid plans)

## Support

For issues specific to:

- **Cloudflare Pages**: [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- **Nitro**: [Nitro Documentation](https://nitro.unjs.io/)
- **TanStack Start**: [TanStack Start Documentation](https://tanstack.com/start)

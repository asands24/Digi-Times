# Deployment Guide

## Netlify Deployment

### Prerequisites

1. Complete Supabase setup (see SUPABASE_SETUP.md)
2. GitHub repository with your code
3. Netlify account

### Step 1: Prepare for Deployment

1. **Set up environment variables locally**:
   ```bash
   cp .env.example .env
   ```
   - Ensure `.env.local` and `.env.production` exist at the project root with:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```
   - Replace the placeholders with your real credentials and keep these files out of version control.

2. **Test the build locally**:
   ```bash
   npm install
   npm run build
   ```

3. **Commit and push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

### Step 2: Deploy to Netlify

#### Option A: Netlify Dashboard

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "New site from Git"
3. Choose GitHub and authorize Netlify
4. Select your repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
   - **Node version**: 18
6. Add environment variables:
   - Go to Site settings > Environment variables
   - Add:
     - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - If you still rely on Create React App builds, mirror the values under `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` for backward compatibility.
7. Click "Deploy site"

#### Option B: Netlify CLI

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Initialize your site**:
   ```bash
   netlify init
   ```

4. **Set environment variables**:
   ```bash
   netlify env:set NEXT_PUBLIC_SUPABASE_URL "your_supabase_url"
   netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your_supabase_anon_key"
   ```

5. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

### Step 3: Configure Supabase for Production

1. **Update Supabase Auth Settings**:
   - Go to Authentication > Settings in your Supabase dashboard
   - Add your Netlify URL to "Site URL": `https://your-app-name.netlify.app`
   - Add to "Redirect URLs": `https://your-app-name.netlify.app/auth/callback`

2. **Update RLS Policies** (if needed):
   - Ensure all RLS policies work with your production domain

### Step 4: Verify Deployment

1. **Test Authentication**:
   - Sign in with the configured smoke credentials
   - Verify email redirection works

2. **Test Core Features**:
   - Create a group
   - Join a group with invite code
   - Create a newsletter
   - Add events
   - Upload photos (≤4MB)
   - Preview newsletters

3. **Check Console for Errors**:
   - Open browser dev tools
   - Look for any console errors or warnings

### Storage & Media Handling

- Photos now upload to the Supabase `photos` storage bucket instead of being saved in `localStorage`.
- Each upload is capped at **4MB**. Oversized files trigger a visible toast error (“Photo is too large. Max 4MB.”).
- Metadata is persisted in the `photos` table, keyed by `photos.uploaded_by` for ownership.
- Confirm new deployments have public bucket access configured and that successful uploads surface a public URL.

### Print Preview Hardening

- Print previews are rendered by constructing DOM nodes explicitly; no user-supplied HTML is ever injected.
- This prevents script execution during print (`document.write` with interpolated HTML has been removed).
- Smoke verification: trigger print preview on an existing story and ensure the preview renders without executing arbitrary scripts.

### Accessibility Guarantees

- Dialogs are focus-trapped, restore focus to their trigger on close, expose `role="dialog"` and `aria-modal="true"`, and close via `Escape`.
- Dropdown menus support arrow navigation (Up/Down/Home/End) and keep focus within the menu until dismissed.
- Include keyboard-only validation in each smoke test cycle to confirm tab/shift-tab behavior and Escape handling.

### Smoke Testing Checklist

Run before and after each deploy (locally or against production):

1. `node scripts/smoke-create-group.ts` – succeeds whether the schema uses `owner_id` or `created_by`.
2. Sign in using `SMOKE_TEST_EMAIL` / `SMOKE_TEST_PASSWORD`.
3. Upload a ≤4MB photo and confirm the object appears in the `photos` bucket with matching metadata.
4. Create a story, open print preview, and verify no `<script>` tags execute.
5. Open a dialog (e.g., Story Preview) and confirm keyboard focus loops; open the account dropdown and navigate with arrow keys.
6. Log out via the header menu and confirm redirection to `/login`.

### Smoke Credential Rotation

- Store smoke user credentials in `.env.local` and Netlify/Vercel environment variables:
  - `SMOKE_TEST_EMAIL`
  - `SMOKE_TEST_PASSWORD`
- Rotate by creating a new Supabase user, updating the variables locally and in hosting dashboards, and invalidating the old credentials.
- Document each rotation (who, when, why) in your team log to keep the smoke account auditable.

### Continuous Deployment

With this setup, any push to your main branch will automatically trigger a new deployment.

### Custom Domain (Optional)

1. **Purchase domain** from your preferred registrar
2. **Add custom domain in Netlify**:
   - Go to Site settings > Domain management
   - Click "Add custom domain"
   - Follow DNS configuration instructions
3. **Update Supabase URLs** to use your custom domain

### Environment Variables Reference

Required environment variables for production:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
# Optional CRA fallback
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```
- Netlify: set these under Site settings → Environment variables before triggering a build.
- Vercel: set them in Project settings → Environment variables for both `Preview` and `Production`, then redeploy to propagate.
- Confirm availability locally by running `npm run dev` and checking that the startup logs include “✅ Supabase client initialized”.

### Troubleshooting

#### Build Fails
- Check Node.js version (should be 18+)
- Verify all dependencies are in package.json
- Check for TypeScript errors if using TypeScript

#### Authentication Issues
- Verify Supabase Site URL and Redirect URLs
- Check environment variables are set correctly
- Ensure CORS is properly configured

#### Photos Not Loading
- Verify Supabase storage bucket permissions
- Check RLS policies for storage
- Ensure bucket is public or has proper access policies

#### 404 Errors on Refresh
- Netlify redirects should handle this (see netlify.toml)
- If issues persist, check redirect configuration

### Performance Optimization

1. **Enable Gzip Compression** (handled by netlify.toml)
2. **Optimize Images** before upload (handled by app)
3. **Implement Code Splitting** (already configured in React)
4. **Monitor Bundle Size**:
   ```bash
   npm run build
   # Check build/static/js for bundle sizes
   ```

### Security Checklist

- ✅ Environment variables are not committed to Git
- ✅ Supabase RLS policies are properly configured
- ✅ Authentication redirect URLs are whitelisted
- ✅ File upload size limits are enforced
- ✅ Only authenticated users can access protected routes

Your photo newsletter app is now deployed and ready for users!

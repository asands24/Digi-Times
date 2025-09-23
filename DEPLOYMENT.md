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
   # Edit .env with your actual Supabase credentials
   ```

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
     - `REACT_APP_SUPABASE_URL`: Your Supabase project URL
     - `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase anon key
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
   netlify env:set REACT_APP_SUPABASE_URL "your_supabase_url"
   netlify env:set REACT_APP_SUPABASE_ANON_KEY "your_supabase_anon_key"
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
   - Try signing in with magic link
   - Verify email redirection works

2. **Test Core Features**:
   - Create a group
   - Join a group with invite code
   - Create a newsletter
   - Add events
   - Upload photos
   - Preview newsletters

3. **Check Console for Errors**:
   - Open browser dev tools
   - Look for any console errors or warnings

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
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

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
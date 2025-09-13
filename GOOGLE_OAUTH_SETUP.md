# Google OAuth Configuration Guide

## Setting up Google OAuth for QuickWork

To enable Google sign-in/sign-up functionality, you need to configure Google OAuth in your Supabase project.

### Step 1: Set up Google OAuth Provider in Supabase

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `mcdwkwrsmuxglgtnncym`

2. **Enable Google Provider**
   - Go to `Authentication` → `Providers`
   - Find "Google" in the list
   - Toggle it ON

3. **Configure Redirect URLs**
   Add these redirect URLs in the Google provider settings:
   ```
   Development: http://localhost:3000/auth/callback
   Production: https://yourdomain.com/auth/callback
   ```

### Step 2: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
   - Also enable "People API"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     ```
     https://mcdwkwrsmuxglgtnncym.supabase.co/auth/v1/callback
     ```

4. **Copy Client ID and Secret**
   - Copy the Client ID and Client Secret
   - Add them to your Supabase Google provider configuration

### Step 3: Update Environment Variables (if needed)

No additional environment variables are needed for Google OAuth with Supabase.

### Step 4: Test the Integration

1. Try the Google sign-in button on the login page
2. Try the Google sign-up button on the signup page
3. Verify users are created in the Supabase Auth panel

### Troubleshooting

**Error: "OAuth provider not configured"**
- Check that Google provider is enabled in Supabase
- Verify Client ID and Secret are correctly entered
- Ensure redirect URLs match exactly

**Error: "redirect_uri_mismatch"**
- Check that the redirect URI in Google Console matches Supabase callback URL
- Format: `https://[your-supabase-reference].supabase.co/auth/v1/callback`

**Users can't complete signup**
- Check that email confirmation is disabled or properly configured
- Verify redirect URLs in the auth configuration

### Current Status

✅ **Fixed Issues:**
- Created OAuth callback route at `/auth/callback`
- Updated login page to use correct redirect URL
- Updated signup page to use correct redirect URL
- Fixed redirect URLs to go to dashboard after authentication
- Added proper error handling for OAuth failures
- Cleaned up the login/signup UI

✅ **Technical Implementation:**
- OAuth callback route handles code exchange for session
- Proper error handling and logging
- Redirect to dashboard on successful authentication
- Fallback to login page with error message on failure

❌ **Needs Configuration:**
- Google OAuth provider setup in Supabase dashboard
- Google Cloud Console project with OAuth credentials

### Vercel Deployment Setup

For production deployment on Vercel, make sure to:

1. **Update Redirect URLs in Google Console:**
   ```
   https://your-vercel-app.vercel.app/auth/callback
   ```

2. **Update Supabase OAuth Settings:**
   - Add your Vercel domain to the allowed origins
   - Verify the callback URL is: `https://mcdwkwrsmuxglgtnncym.supabase.co/auth/v1/callback`

3. **Environment Variables on Vercel:**
   - Ensure all environment variables from `.env.local` are added to Vercel
   - Verify Supabase and Cloudinary configurations are correct

### Next Steps

1. Complete the Google OAuth configuration in Supabase dashboard
2. Create Google Cloud Console project and OAuth credentials  
3. Test the Google authentication flow
4. Verify user profile creation and data storage

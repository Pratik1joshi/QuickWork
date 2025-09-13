# Cloudinary Setup Guide

To enable profile image uploads, you need to set up Cloudinary:

## 1. Create a Cloudinary Account
- Go to [cloudinary.com](https://cloudinary.com) and create a free account
- Verify your email

## 2. Get Your Credentials
- Go to your Dashboard → Account → API Keys
- Copy your Cloud Name, API Key, and API Secret

## 3. Create an Upload Preset
- Go to Settings → Upload → Upload presets
- Click "Add upload preset"
- Set the following:
  - **Preset name**: `quickwork_profiles`
  - **Mode**: `Unsigned` (for client-side uploads)
  - **Folder**: `quickwork/profiles`
  - **Format**: `Auto`
  - **Allowed formats**: `jpg,png,jpeg,gif,webp`
  - **Max image size**: `5000000` (5MB)
  - **Max image width/height**: `2000`
- Save the preset

## 4. Update Environment Variables
Update your `.env.local` file with your actual Cloudinary credentials:

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=quickwork_profiles
```

## 5. Restart the Development Server
After updating the environment variables, restart your development server:

```bash
npm run dev
```

The profile image upload will now be functional!

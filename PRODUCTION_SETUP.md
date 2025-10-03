# Production Environment Setup Guide

## Required Environment Variables

Make sure these environment variables are set in your production environment (e.g., Heroku):

### Spotify API Configuration

```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://your-app.herokuapp.com/callback
```

### JWT Configuration

```
JWT_SECRET=your_very_secure_jwt_secret_key_at_least_32_characters_long
```

### Database Configuration

```
DATABASE_URL=postgresql://username:password@host:port/database
```

_Note: This is automatically set by Heroku Postgres addon_

### Server Configuration

```
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-app.herokuapp.com
```

## Spotify App Configuration

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app or edit existing app
3. Add these redirect URIs:
   - `https://your-app.herokuapp.com/callback`
   - `http://localhost:3000/callback` (for development)
4. Copy the Client ID and Client Secret to your environment variables

## Heroku Deployment Checklist

1. **Set Environment Variables:**

   ```bash
   heroku config:set SPOTIFY_CLIENT_ID=your_client_id
   heroku config:set SPOTIFY_CLIENT_SECRET=your_client_secret
   heroku config:set SPOTIFY_REDIRECT_URI=https://your-app.herokuapp.com/callback
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set NODE_ENV=production
   heroku config:set FRONTEND_URL=https://your-app.herokuapp.com
   ```

2. **Add PostgreSQL Database:**

   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

3. **Deploy and Check Logs:**
   ```bash
   git push heroku main
   heroku logs --tail
   ```

## Debugging Authentication Issues

### 1. Check Health Endpoint

Visit: `https://your-app.herokuapp.com/api/health`

This will show you which environment variables are properly set.

### 2. Check Server Logs

```bash
heroku logs --tail
```

Look for these error messages:

- "SPOTIFY_CLIENT_ID is not set"
- "SPOTIFY_REDIRECT_URI is not set"
- "JWT_SECRET is not set"
- "Database connection failed"

### 3. Common Issues and Solutions

#### Issue: "Server configuration error"

**Solution:** Check that all required environment variables are set in Heroku

#### Issue: "Invalid authorization code"

**Solution:**

- Verify SPOTIFY_REDIRECT_URI matches exactly in Spotify app settings
- Check that the redirect URI in your Spotify app includes the production URL

#### Issue: "Database connection failed"

**Solution:**

- Ensure Heroku Postgres addon is installed
- Check DATABASE_URL is set (should be automatic)

#### Issue: CORS errors

**Solution:**

- Set FRONTEND_URL environment variable to your production URL
- Verify the CORS configuration in server/index.js

### 4. Testing Authentication Flow

1. Visit your production URL
2. Click "Connect with Spotify"
3. Complete Spotify authorization
4. Check server logs for any errors during the callback process

## Environment Variable Verification

Run this command to check all environment variables:

```bash
heroku config
```

All variables should be set and not show as empty or undefined.

## Spotify App Settings Verification

1. Go to your Spotify app settings
2. Verify redirect URIs include your production URL
3. Ensure the app is not in development mode if you want public access
4. Check that the app has the required scopes enabled

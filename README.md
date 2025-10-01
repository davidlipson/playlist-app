# Playlist App

A Spotify playlist sharing application that allows users to share their playlists and add timestamped comments. Built with TypeScript, React, Node.js, Express, and PostgreSQL.

## Features

- **Spotify Authentication**: Login with your Spotify account
- **Playlist Management**: View your Spotify playlists and share them with others
- **Shared Playlists**: Access playlists shared with you by other users
- **Music Playback**: Play tracks directly in the browser using Spotify Web Playback SDK
- **Timestamped Comments**: Add comments at specific timestamps on any track
- **Real-time Updates**: See comments from other users in real-time

## Tech Stack

### Backend

- Node.js with Express
- TypeScript
- PostgreSQL with Sequelize ORM
- Spotify Web API
- JWT Authentication

### Frontend

- React with TypeScript
- Styled Components
- React Router
- Spotify Web Playback SDK
- Axios for API calls

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Spotify Developer Account

### 1. Spotify App Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add `http://localhost:3000/callback` to Redirect URIs
4. Note down your Client ID and Client Secret

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/playlist_app

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 3. Database Setup

1. Create a PostgreSQL database named `playlist_app`
2. The application will automatically create the necessary tables on first run

### 4. Installation

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

# Install server dependencies (if not already installed)
npm install
```

### 5. Development

```bash
# Start both client and server
npm run dev

# Or start them separately:
# Server only
npm run server

# Client only (in another terminal)
cd client && npm start
```

The app will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Deployment to Heroku

### 1. Heroku Setup

```bash
# Install Heroku CLI
# Create a new Heroku app
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev
```

### 2. Environment Variables on Heroku

```bash
heroku config:set SPOTIFY_CLIENT_ID=your_spotify_client_id
heroku config:set SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
heroku config:set SPOTIFY_REDIRECT_URI=https://your-app-name.herokuapp.com/callback
heroku config:set JWT_SECRET=your_jwt_secret_key
heroku config:set NODE_ENV=production
```

### 3. Deploy

```bash
git add .
git commit -m "Initial commit"
git push heroku main
```

## API Endpoints

### Authentication

- `GET /api/auth/spotify-login` - Get Spotify login URL
- `POST /api/auth/spotify-callback` - Handle Spotify callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh-token` - Refresh Spotify token

### Playlists

- `GET /api/playlists/my-playlists` - Get user's playlists
- `GET /api/playlists/shared-playlists` - Get shared playlists
- `GET /api/playlists/:playlistId` - Get playlist details
- `POST /api/playlists/:playlistId/share` - Share a playlist
- `GET /api/playlists/share/:shareCode` - Access shared playlist

### Comments

- `GET /api/comments/playlist/:playlistId` - Get playlist comments
- `POST /api/comments` - Add a comment
- `PUT /api/comments/:commentId` - Update a comment
- `DELETE /api/comments/:commentId` - Delete a comment

## Database Schema

### Users

- id (UUID, Primary Key)
- spotifyId (String, Unique)
- displayName (String)
- email (String)
- accessToken (Text)
- refreshToken (Text)
- tokenExpiresAt (DateTime)

### Playlists

- id (UUID, Primary Key)
- spotifyPlaylistId (String, Unique)
- name (String)
- description (Text)
- imageUrl (String)
- ownerId (UUID, Foreign Key)
- isPublic (Boolean)
- shareCode (String, Unique)

### Comments

- id (UUID, Primary Key)
- playlistId (UUID, Foreign Key)
- userId (UUID, Foreign Key)
- trackId (String)
- trackName (String)
- artistName (String)
- timestamp (Integer)
- content (Text)

### Shared Playlists

- id (UUID, Primary Key)
- playlistId (UUID, Foreign Key)
- sharedWithUserId (UUID, Foreign Key)
- sharedByUserId (UUID, Foreign Key)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License

# Database Migrations

This document describes the database migrations for the playlist app.

## Current Migrations

### 001 - Add inSongTimestamp Column (2024-10-03)

**Purpose**: Adds a nullable `inSongTimestamp` column to the `comments` table to track when users comment while actively listening to a song.

**Column Details**:
- **Name**: `inSongTimestamp`
- **Type**: `INTEGER`
- **Nullable**: `true`
- **Description**: Timestamp in seconds when user clicked comment button while listening to the song

**Migration Code**: The migration is automatically applied when the server starts up. The migration code is embedded in `server/index.js` and will:

1. Check if the column already exists
2. Add the column if it doesn't exist
3. Skip gracefully if the column already exists
4. Log the migration status

## How Migrations Work

### Automatic Migration
The server automatically runs migrations on startup. This ensures that:
- New environments get the required database schema
- Existing environments are updated with new columns
- No manual intervention is required

### Manual Migration
If you need to run migrations manually:

```bash
# Run the migration script
npm run migrate

# Or run directly with node
node -e "require('./server/config/database').getQueryInterface().addColumn('comments', 'inSongTimestamp', { type: require('sequelize').DataTypes.INTEGER, allowNull: true }).then(() => console.log('Migration completed')).catch(err => console.log('Migration already applied or error:', err.message))"
```

### Production Deployment
When deploying to a new environment:

1. The server will automatically detect missing columns
2. Run the migration on startup
3. Continue with normal operation

## Adding New Migrations

To add a new migration:

1. Update the model definition in `server/models/`
2. Add migration code to `server/index.js` in the migration section
3. Test locally first
4. Deploy - the migration will run automatically

## Rollback

To rollback the inSongTimestamp column:

```sql
ALTER TABLE comments DROP COLUMN "inSongTimestamp";
```

**Note**: This will permanently delete all inSongTimestamp data.

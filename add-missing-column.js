const { Sequelize } = require("sequelize");

// Create a direct database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  protocol: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: console.log,
});

async function addMissingColumn() {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    // Add the missing column
    console.log("Adding lastNotificationCheck column to users table...");
    await sequelize.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "lastNotificationCheck" TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    `);

    console.log("✅ Successfully added lastNotificationCheck column!");
    
    // Verify the column exists
    const [results] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'lastNotificationCheck';
    `);
    
    if (results.length > 0) {
      console.log("✅ Column verified:", results[0]);
    } else {
      console.log("❌ Column not found after adding");
    }

  } catch (error) {
    console.error("❌ Error adding column:", error);
  } finally {
    await sequelize.close();
    console.log("Database connection closed.");
  }
}

addMissingColumn();

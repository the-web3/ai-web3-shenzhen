#!/usr/bin/env node

/**
 * Database Migration Runner
 * Executes 020_create_payment_retry_queue.sql using Node.js
 * No need for psql installation
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  // Read environment variables
  const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

  if (!dbUrl) {
    console.error('❌ Error: POSTGRES_URL_NON_POOLING or POSTGRES_URL not found in environment');
    console.error('Please set the database connection string in .env file');
    process.exit(1);
  }

  // Read migration SQL file
  const sqlFilePath = path.join(__dirname, '020_create_payment_retry_queue.sql');
  let sqlContent;

  try {
    sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ Migration file loaded:', sqlFilePath);
  } catch (error) {
    console.error('❌ Error reading migration file:', error.message);
    process.exit(1);
  }

  // Try to use pg library
  let pg;
  try {
    pg = require('pg');
  } catch (error) {
    console.error('❌ Error: "pg" package not found');
    console.error('Installing pg package...\n');

    const { execSync } = require('child_process');
    try {
      execSync('npm install pg', { stdio: 'inherit' });
      pg = require('pg');
      console.log('\n✅ pg package installed successfully\n');
    } catch (installError) {
      console.error('❌ Failed to install pg package:', installError.message);
      console.error('\nPlease run manually: npm install pg');
      process.exit(1);
    }
  }

  // Connect to database
  // Parse connection string - remove sslmode parameter as we'll set it programmatically
  const cleanDbUrl = dbUrl.replace(/[?&]sslmode=[^&]*/g, '');

  const connectionConfig = {
    connectionString: cleanDbUrl,
    ssl: {
      rejectUnauthorized: false, // Accept self-signed certificates from Supabase
      // Disable SSL verification entirely for development
      ca: false,
      checkServerIdentity: () => undefined,
    },
    // Add connection timeout
    connectionTimeoutMillis: 10000,
  };

  const client = new pg.Client(connectionConfig);

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('📝 Executing migration SQL...\n');
    console.log('----------------------------------------');

    // Execute the migration
    await client.query(sqlContent);

    console.log('----------------------------------------\n');
    console.log('✅ Migration executed successfully!\n');

    // Verify table creation
    console.log('🔍 Verifying table creation...');
    const verifyQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'payment_retry_queue';
    `;

    const verifyResult = await client.query(verifyQuery);

    if (verifyResult.rows.length > 0) {
      console.log('✅ Table "payment_retry_queue" created successfully\n');

      // Check columns
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'payment_retry_queue'
        ORDER BY ordinal_position;
      `;

      const columnsResult = await client.query(columnsQuery);
      console.log('📋 Table structure:');
      console.log('Columns:', columnsResult.rows.length);
      columnsResult.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });

      // Check indexes
      const indexesQuery = `
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'payment_retry_queue';
      `;

      const indexesResult = await client.query(indexesQuery);
      console.log('\n📑 Indexes:', indexesResult.rows.length);
      indexesResult.rows.forEach(idx => {
        console.log(`  - ${idx.indexname}`);
      });

      // Check RLS policies
      const policiesQuery = `
        SELECT policyname, cmd
        FROM pg_policies
        WHERE tablename = 'payment_retry_queue';
      `;

      const policiesResult = await client.query(policiesQuery);
      console.log('\n🔒 RLS Policies:', policiesResult.rows.length);
      policiesResult.rows.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });

      console.log('\n🎉 Migration completed successfully!');
      console.log('\n✅ Next steps:');
      console.log('  1. Test the retry queue API: npm run dev');
      console.log('  2. Test payment flow with retry mechanism');
      console.log('  3. Monitor the retry queue table for any failed payments\n');

    } else {
      console.log('⚠️  Warning: Table verification failed');
      console.log('Please check manually in Supabase Dashboard\n');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    console.error('\n💡 Alternative: Use Supabase Dashboard');
    console.error('   Visit: https://uasxfshglutvtcovpmej.supabase.co/project/_/sql');
    console.error('   Copy and paste the SQL from scripts/020_create_payment_retry_queue.sql\n');
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run migration
runMigration().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

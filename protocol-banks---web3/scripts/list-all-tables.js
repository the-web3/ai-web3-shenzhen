#!/usr/bin/env node

/**
 * List All Database Tables
 * Displays all tables, columns, indexes, and RLS policies in the database
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function listAllTables() {
  console.log('🔍 Fetching database schema...\n');

  // Read environment variables
  const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

  if (!dbUrl) {
    console.error('❌ Error: POSTGRES_URL_NON_POOLING or POSTGRES_URL not found in environment');
    console.error('Please set the database connection string in .env file');
    process.exit(1);
  }

  // Load pg library
  let pg;
  try {
    pg = require('pg');
  } catch (error) {
    console.error('❌ Error: "pg" package not found');
    console.error('Please run: npm install pg');
    process.exit(1);
  }

  // Connect to database
  const cleanDbUrl = dbUrl.replace(/[?&]sslmode=[^&]*/g, '');

  const connectionConfig = {
    connectionString: cleanDbUrl,
    ssl: {
      rejectUnauthorized: false,
      ca: false,
      checkServerIdentity: () => undefined,
    },
    connectionTimeoutMillis: 10000,
  };

  const client = new pg.Client(connectionConfig);

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    // ==========================================
    // 1. Get all tables in public schema
    // ==========================================
    console.log('📊 DATABASE TABLES');
    console.log('='.repeat(80));

    const tablesQuery = `
      SELECT
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const tablesResult = await client.query(tablesQuery);

    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No tables found in public schema\n');
      return;
    }

    console.log(`\nFound ${tablesResult.rows.length} tables:\n`);

    // ==========================================
    // 2. Loop through each table and get details
    // ==========================================
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;

      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📋 TABLE: ${tableName}`);
      console.log(`${'─'.repeat(80)}`);

      // Get columns
      const columnsQuery = `
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
        ORDER BY ordinal_position;
      `;

      const columnsResult = await client.query(columnsQuery, [tableName]);

      console.log(`\n  📝 Columns (${columnsResult.rows.length}):`);
      columnsResult.rows.forEach((col, idx) => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const type = col.character_maximum_length
          ? `${col.data_type}(${col.character_maximum_length})`
          : col.data_type;
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';

        console.log(`    ${idx + 1}. ${col.column_name.padEnd(25)} ${type.padEnd(30)} ${nullable}${defaultVal}`);
      });

      // Get indexes
      const indexesQuery = `
        SELECT
          i.indexname,
          i.indexdef
        FROM pg_indexes i
        WHERE i.schemaname = 'public'
          AND i.tablename = $1
        ORDER BY i.indexname;
      `;

      const indexesResult = await client.query(indexesQuery, [tableName]);

      if (indexesResult.rows.length > 0) {
        console.log(`\n  🔑 Indexes (${indexesResult.rows.length}):`);
        indexesResult.rows.forEach((idx, i) => {
          console.log(`    ${i + 1}. ${idx.indexname}`);
          // Optionally show full index definition
          // console.log(`       ${idx.indexdef}`);
        });
      }

      // Get foreign keys
      const foreignKeysQuery = `
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = $1;
      `;

      const foreignKeysResult = await client.query(foreignKeysQuery, [tableName]);

      if (foreignKeysResult.rows.length > 0) {
        console.log(`\n  🔗 Foreign Keys (${foreignKeysResult.rows.length}):`);
        foreignKeysResult.rows.forEach((fk, i) => {
          console.log(`    ${i + 1}. ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      }

      // Get RLS policies
      const policiesQuery = `
        SELECT
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = $1
        ORDER BY policyname;
      `;

      const policiesResult = await client.query(policiesQuery, [tableName]);

      if (policiesResult.rows.length > 0) {
        console.log(`\n  🔒 RLS Policies (${policiesResult.rows.length}):`);
        policiesResult.rows.forEach((policy, i) => {
          const roles = Array.isArray(policy.roles) ? policy.roles.join(', ') : policy.roles;
          console.log(`    ${i + 1}. ${policy.policyname}`);
          console.log(`       Command: ${policy.cmd}`);
          console.log(`       Roles: ${roles}`);
          console.log(`       Permissive: ${policy.permissive}`);
        });
      }

      // Check if RLS is enabled
      const rlsCheckQuery = `
        SELECT relrowsecurity
        FROM pg_class
        WHERE relname = $1
          AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
      `;

      const rlsCheckResult = await client.query(rlsCheckQuery, [tableName]);

      if (rlsCheckResult.rows.length > 0) {
        const rlsEnabled = rlsCheckResult.rows[0].relrowsecurity;
        console.log(`\n  🛡️  Row Level Security: ${rlsEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
      }

      // Get row count
      try {
        const countQuery = `SELECT COUNT(*) as count FROM "${tableName}"`;
        const countResult = await client.query(countQuery);
        const rowCount = countResult.rows[0].count;
        console.log(`  📊 Row Count: ${rowCount}`);
      } catch (error) {
        console.log(`  📊 Row Count: Unable to fetch (${error.message})`);
      }
    }

    // ==========================================
    // 3. Summary
    // ==========================================
    console.log(`\n${'='.repeat(80)}`);
    console.log('📈 SUMMARY');
    console.log(`${'='.repeat(80)}\n`);
    console.log(`  Total Tables: ${tablesResult.rows.length}`);

    // Get total columns count
    const totalColumnsQuery = `
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_schema = 'public';
    `;
    const totalColumnsResult = await client.query(totalColumnsQuery);
    console.log(`  Total Columns: ${totalColumnsResult.rows[0].count}`);

    // Get total indexes count
    const totalIndexesQuery = `
      SELECT COUNT(*) as count
      FROM pg_indexes
      WHERE schemaname = 'public';
    `;
    const totalIndexesResult = await client.query(totalIndexesQuery);
    console.log(`  Total Indexes: ${totalIndexesResult.rows[0].count}`);

    // Get total RLS policies count
    const totalPoliciesQuery = `
      SELECT COUNT(*) as count
      FROM pg_policies
      WHERE schemaname = 'public';
    `;
    const totalPoliciesResult = await client.query(totalPoliciesQuery);
    console.log(`  Total RLS Policies: ${totalPoliciesResult.rows[0].count}`);

    console.log('\n✅ Database schema inspection completed!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
listAllTables().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

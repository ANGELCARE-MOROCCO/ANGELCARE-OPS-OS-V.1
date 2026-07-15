import { Pool } from 'pg';

const databaseUrl = process.env.REFFERQ_DATABASE_URL;

if (!databaseUrl) {
  console.error('REFFERQ_DATABASE_URL is not configured');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});

async function main() {
  const result = await pool.query('delete from refferq.rate_limit_entries');
  console.log(`✅ Cleared ${result.rowCount} refferq.rate_limit_entries rows`);
}

main()
  .catch((error) => {
    console.error('❌ Failed to clear RefferQ rate limits:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => {});
  });

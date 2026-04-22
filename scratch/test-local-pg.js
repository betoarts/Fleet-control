import pkg from 'pg';
const { Client } = pkg;

async function testConnection() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'fleet_user',
    password: 'fleet_pass_2026',
    database: 'fleet_control',
  });

  try {
    console.log('Connecting to local PostgreSQL...');
    await client.connect();
    console.log('Connected successfully!');

    console.log('Testing query on "users" table...');
    const res = await client.query('SELECT count(*) FROM users');
    console.log(`Total users in local DB: ${res.rows[0].count}`);

    console.log('Testing query on "vehicles" table...');
    const vRes = await client.query('SELECT name, plate FROM vehicles');
    console.log('Vehicles found:', vRes.rows);

    await client.end();
    console.log('Connection closed.');
  } catch (err) {
    console.error('Connection error:', err.message);
    console.log('\nMake sure the Docker container is running (docker ps)');
    process.exit(1);
  }
}

testConnection();

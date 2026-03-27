const { Client } = require('pg');
const config = require('./config/config.json');

const createDb = async () => {
  const env = process.env.NODE_ENV || 'development';
  const dbConfig = config[env];

  const client = new Client({
    user: dbConfig.username,
    host: dbConfig.host,
    password: dbConfig.password,
    port: 5432,
  });

  try {
    await client.connect();
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbConfig.database}'`);
    if (res.rowCount === 0) {
      console.log(`Database "${dbConfig.database}" not found, creating it.`);
      await client.query(`CREATE DATABASE "${dbConfig.database}"`);
      console.log(`Database "${dbConfig.database}" created.`);
    } else {
      console.log(`Database "${dbConfig.database}" already exists.`);
    }
  } catch (err) {
    console.error('Error creating database!', err);
    process.exit(1);
  } finally {
    await client.end();
  }
};

createDb();

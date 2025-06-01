require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString:'postgresql://postgres:labibhafiz3rdclassproject@db.clcdzrnfvhnxwrthhmwe.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false // required for Supabase
  }
});

module.exports = pool;

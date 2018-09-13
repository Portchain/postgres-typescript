const { parse } = require('pg-connection-string');

let pgConnStringConf:any = {
  host: null,
  port: null,
  database: null,
  user: null,
  password: null,
  client_encoding: null,
  ssl: null,
  application_name: null,
  fallback_application_name: null
};

if (process.env.DATABASE_URL) {
  pgConnStringConf = parse(process.env.DATABASE_URL);
}

module.exports = {
  isProduction: process.env.NODE_ENV === 'production',
  db: {
    host: pgConnStringConf.host || process.env.DB_HOST || '127.0.0.1',
    port: pgConnStringConf.port || parseInt(process.env.DB_PORT, 10) || 5432,
    database: pgConnStringConf.database || process.env.DB_NAME || 'soe',
    user: pgConnStringConf.user || process.env.DB_USER || 'portchain',
    password: pgConnStringConf.password || process.env.DB_PWD || 'portchain',
    ssl: process.env.NODE_ENV === 'production'
  }
};
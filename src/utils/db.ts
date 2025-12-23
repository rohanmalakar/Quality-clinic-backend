import mysql from "mysql2/promise";
import  { MYSQL_DB_CONFIG_NEW } from "./contants";

const pool = mysql.createPool({
  host: MYSQL_DB_CONFIG_NEW.host,
  user: MYSQL_DB_CONFIG_NEW.user,
  password: MYSQL_DB_CONFIG_NEW.password,
  database: MYSQL_DB_CONFIG_NEW.database,
  port: MYSQL_DB_CONFIG_NEW.port,
  waitForConnections: true,
  connectionLimit: 50,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

console.log('MySQL pool created successfully');

export default pool;
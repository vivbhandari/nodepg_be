const Pool = require("pg").Pool;
const pool = new Pool({
  user: process.env.PG_USER || "postgres",
  host: process.env.PG_HOST || "localhost",
  database: process.env.PG_DB || "test",
  password: process.env.PG_PWD || "test",
  port: process.env.PG_PORT || 5432,
});

async function executeQuery(query) {
  let result = null,
    error = null;
  try {
    result = await pool.query(query);
  } catch (e) {
    error = e;
  }
  return [error, result];
}

async function executeTransaction(queries) {
  let results = [],
    error = null;
  try {
    await pool.query("BEGIN");
    for (let query of queries) {
      const [error, result] = await executeQuery(query);
      if (error) {
        await pool.query("ROLLBACK");
        results = null;
        break;
      }
      results.push(result);
    }
    if (results) await pool.query("COMMIT");
  } catch (e) {
    await pool.query("ROLLBACK");
    error = e;
  }
  return [error, results];
}

module.exports.pool = pool;
module.exports.executeQuery = executeQuery;
module.exports.executeTransaction = executeTransaction;

// const pg = require("pg");
// const connectionString = "postgres://postgres:test@localhost:5432/test";
// const pgClient = new pg.Client(connectionString);
// pgClient.connect();

// module.exports = pgClient;

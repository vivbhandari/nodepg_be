const executeQuery = require("./dbConnection").executeQuery;
const pool = require("./dbConnection").pool;
const User = require("../models/user");
const Address = require("../models/address");

class UserQuery {
  constructor() {}

  getUserModel(dbUserWithAddresses) {
    return new User(
      dbUserWithAddresses.id,
      dbUserWithAddresses.name,
      dbUserWithAddresses.role,
      this.getAddressModelArray(dbUserWithAddresses.addresses)
    );
  }

  getAddressModelArray(dbAddresses) {
    let addresses = [];
    dbAddresses.forEach((address) => {
      if (address)
        addresses.push(
          new Address(address.id, address.userId, address.details)
        );
    });
    return addresses;
  }

  async getUsers() {
    const [error, result] = await executeQuery("SELECT * from Users");
    if (error) return [error.message, []];

    let users = [];
    result.rows.forEach((user) =>
      users.push(new User(user.id, user.name, user.role))
    );
    return [null, users];
  }

  async getUsersWithAddress() {
    const [error, result] = await executeQuery(
      "SELECT Users.*, json_agg(Address.*) as addresses from Users left join Address on Users.id = Address.userid group by Users.id order by Users.id"
    );
    if (error) return [error.message, []];

    let users = [];
    result.rows.forEach((userWithAddresses) => {
      users.push(this.getUserModel(userWithAddresses));
    });
    return [null, users];
  }

  async getUser(id) {
    const [error, result] = await executeQuery(
      `SELECT * from Users where id =${id}`
    );
    if (error) return [error.message, []];

    let user = new User(
      result.rows[0].id,
      result.rows[0].name,
      result.rows[0].role
    );
    return [null, user];
  }

  async getUserWithAddress(id) {
    const [error, result] = await executeQuery(
      `SELECT Users.*, json_agg(Address.*) as addresses from Users left join Address on Users.id = Address.userid where Users.id=${id} group by Users.id`
    );
    if (error) return [error.message, null];

    let user = this.getUserModel(result.rows[0]);
    return [null, user];
  }

  async addUser(user) {
    console.log(user.addresses.length);
    if (user.addresses.length > 0) return this.addUserWithAddress(user);
    else {
      const [error, result] = await executeQuery(
        `INSERT INTO users (NAME, ROLE) VALUES ('${user.name}', '${user.role}') RETURNING id`
      );
      if (error) return [error.message, []];
      user.id = result.rows[0].id;
      return [null, user];
    }
  }

  async addUserWithAddress(user) {
    try {
      await pool.query("BEGIN");

      let [error, result] = await executeQuery(
        `INSERT INTO users (NAME, ROLE) VALUES ('${user.name}', '${user.role}') RETURNING id`
      );
      if (error) {
        await pool.query("ROLLBACK");
        return [error.message, null];
      }
      user.id = result.rows[0].id;

      for (let address of user.addresses) {
        [error, result] = await executeQuery(
          `INSERT INTO address(userId, details) values (${
            user.id
          }, \'${JSON.stringify(address)}\') RETURNING id`
        );
        if (error) {
          await pool.query("ROLLBACK");
          return [error.message, null];
        }
        address.id = result.rows[0].id;
      }

      await pool.query("COMMIT");
    } catch (e) {
      await pool.query("ROLLBACK");
      return [error.message, null];
    }
    return [null, user];
  }
}

module.exports = new UserQuery();

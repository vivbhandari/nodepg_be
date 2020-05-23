class User {
  constructor(id, name, role, addresses = []) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.addresses = addresses;
  }
}

module.exports = User;

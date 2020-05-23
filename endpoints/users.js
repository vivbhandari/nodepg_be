const userQuery = require("../database/userQuery");
const Joi = require("joi");
const express = require("express");
const router = express.Router();
const User = require("../models/user");

//Middle ware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log("Time: ", Date.now());
  next();
});

// Define users route
router.get("/", async (req, res) => {
  const [error, users] =
    req.query.includeAddress == "true"
      ? await userQuery.getUsersWithAddress()
      : await userQuery.getUsers();
  if (error) return res.status(400).send(error);
  res.status(200).json(users);
});

router.get("/:id", async (req, res) => {
  const [error, user] =
    req.query.includeAddress == "true"
      ? await userQuery.getUserWithAddress(req.params.id)
      : await userQuery.getUser(req.params.id);
  if (error) return res.status(400).send(error);
  res.send(user);
});

const schema = {
  name: Joi.string().min(3).required(),
  role: Joi.string().min(3).required(),
  addresses: Joi.array().optional(),
};

router.post("/", async (req, res) => {
  const validation = Joi.validate(req.body, schema);
  if (validation.error)
    return res.status(400).send(validation.error.details[0].message);

  let inputUser = new User(
    -1,
    req.body.name,
    req.body.role,
    req.body.addresses || []
  );
  console.log(inputUser);
  const [error, user] = await userQuery.addUser(inputUser);
  if (error) return res.status(400).send(error);

  res.send(user);
});

module.exports = router;

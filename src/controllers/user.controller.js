import userService from "../services/user.service.js";

const create = async (req, res) => {
  try {
    const { name, code, email, semester, password, status } = req.body;
    if (!name || !code || !email || !semester || !password || !status) {
      res.status(400).send({ menssage: "Submit all fields for registration" });
    }
    const user = await userService.createService(req.body);
    if (!user) {
      return res.status(400).send({ message: "Error creating User" });
    }
    res.status(201).json({
      message: "User create sucessfully",
      user: {
        id: user._id,
        name,
        code,
        email,
        semester,
        password,
        status,
      },
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
const findAll = async (req, res) => {
  try {
    const users = await userService.findAllService();
    if (users.length === 0) {
      return res.status(400).send({ message: "There are no registered users" });
    }
    res.send(users);
  } catch (err) {
    send.status(500).send({ message: err.message });
  }
};
const findById = async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
const update = async (req, res) => {
  try {
    const { name, code, email, semester, password, status } = req.body;
    if (!name && !code && !email && !semester && !password, !status) {
      res
        .status(400)
        .send({ menssage: "Submit at least one field for update" });
    }
    const { id, user } = req;
    console.log(`Esse é o ID esperado:${id}`);
    await userService.updateService(id, name, code, email, semester, password, status);
    res.send({ message: "User successfully updated!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
export default { create, findAll, findById, update };

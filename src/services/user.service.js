import User from "../models/User.js";
const createService = (body) => User.create(body);
const findAllService = () => User.find();
const findByIdService = (id) => User.findById(id);
const updateService = (id, name, code, email, semester, password, status) =>
  User.findOneAndUpdate(
    { _id: id },
    { name, code, email, semester, password, status } 
  );

export default {
  createService,
  findAllService,
  findByIdService,
  updateService,
}; 

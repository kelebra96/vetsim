import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema({
  name: { type: String, require: true },
  code: { type: Number, require: true },
  email: { type: String, require: true, unique: true },
  semester: { type: Number, require: true, min: 1, max: 8 },
  password: { type: String, require: true, select: false },
  status: { type: Boolean, default: true },
  balance: { type: Number, default: 50000 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const salt = 10;
UserSchema.pre("save", async function (next) {
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", UserSchema);
export default User;

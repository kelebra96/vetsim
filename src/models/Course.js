import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  maxSemesters: { type: Number, required: true, min: 1, max: 20 },
  description: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Course = mongoose.model("Course", CourseSchema);
export default Course;

import express from "express";
import { uploadImage } from "../middelware/uploadImage.middleware.js";
const templeRoutes = express.Router();
import {
  createTemple,
  getAllTemple,
  updateTemple,
  deleteTemple,
  getTempleById,
} from "../controller/temple.controller.js";
import { isAuthenticated } from "../middelware/auth.middleware.js";
templeRoutes.get("/", getAllTemple);
templeRoutes.get("/:id", getTempleById);
templeRoutes.post(
  "/",
  isAuthenticated,
  uploadImage("temples").single("image"),
  createTemple
);
templeRoutes.put(
  "/:id",
  isAuthenticated,
  uploadImage("temples").single("image"),
  updateTemple
);
templeRoutes.delete("/:id", isAuthenticated, deleteTemple);

export default templeRoutes;

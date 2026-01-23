import express from "express";
import {
  createPandit,
  getAllPandit,
  updatePandit,
  deletePandit,
  updatePanditStatus, // Add this import
} from "../controller/pandit.controller.js";
import { uploadImage } from "../middelware/uploadImage.middleware.js";
import { isAuthenticated } from "../middelware/auth.middleware.js";

const panditRoutes = express.Router();

panditRoutes.post(
  "/",
  isAuthenticated,
  uploadImage("pandits").single("image"),
  createPandit
);
panditRoutes.get("/", getAllPandit);
panditRoutes.put(
  "/:id",
  isAuthenticated,
  uploadImage("pandits").single("image"),
  updatePandit
);
panditRoutes.patch("/:id/status", isAuthenticated, updatePanditStatus); // Add this route
panditRoutes.delete("/:id", isAuthenticated, deletePandit);

export default panditRoutes;

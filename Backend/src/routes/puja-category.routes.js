import express from "express";
const pujaCategory = express.Router();
import {
  createPujaCategory,
  deletePujaCategory,
  getAllPujaCategory,
  updatePujaCategory,
  updatePujaCategoryStatus,
} from "../controller/puja-category.controller.js";
import { isAuthenticated } from "../middelware/auth.middleware.js";

pujaCategory.get("/", getAllPujaCategory);
pujaCategory.post("/", isAuthenticated, createPujaCategory);
pujaCategory.put("/:id", isAuthenticated, updatePujaCategory);
pujaCategory.patch("/:id/status", isAuthenticated, updatePujaCategoryStatus);
pujaCategory.delete("/:id", isAuthenticated, deletePujaCategory);

export default pujaCategory;

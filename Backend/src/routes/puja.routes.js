import express from "express";
import {
  createPuja,
  deletePuja,
  getAllPuja,
  getPujaById,
  updatePuja,
  updatePujaStatus,
} from "../controller/puja.controller.js";
import { isAuthenticated } from "../middelware/auth.middleware.js";
import { uploadImage } from "../middelware/uploadImage.middleware.js";
const pujaRoutes = express.Router();

pujaRoutes.get("/", getAllPuja);
pujaRoutes.post("/", isAuthenticated, uploadImage("puja").single("image"), createPuja);
pujaRoutes.patch("/status/:id", isAuthenticated, updatePujaStatus);
pujaRoutes.put("/:id", isAuthenticated, uploadImage("puja").single("image"), updatePuja);
pujaRoutes.delete("/:id", isAuthenticated, deletePuja);
pujaRoutes.get("/:id", getPujaById);


export default pujaRoutes;

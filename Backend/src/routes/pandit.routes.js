// import express from "express";
// import {
//   createPandit,
//   getAllPandit,
//   getPanditById, // ✅ NEW
//   updatePandit,
//   deletePandit,
//   updatePanditStatus,
// } from "../controller/pandit.controller.js";

// import { uploadImage } from "../middelware/uploadImage.middleware.js";
// import { isAuthenticated } from "../middelware/auth.middleware.js";

// const panditRoutes = express.Router();

// panditRoutes.post(
//   "/",
//   isAuthenticated,
//   uploadImage("pandits").single("image"),
//   createPandit
// );

// // ✅ IMPORTANT: keep "/" BEFORE "/:id"
// panditRoutes.get("/", getAllPandit);

// // ✅ NEW API: GET single pandit by id
// panditRoutes.get("/:id", getPanditById);

// panditRoutes.put(
//   "/:id",
//   isAuthenticated,
//   uploadImage("pandits").single("image"),
//   updatePandit
// );

// panditRoutes.patch("/:id/status", isAuthenticated, updatePanditStatus);

// panditRoutes.delete("/:id", isAuthenticated, deletePandit);

// export default panditRoutes;



import express from "express";
import {
  createPandit,
  getAllPandit,
  getPanditById,
  updatePandit,
  deletePandit,
  updatePanditStatus,
} from "../controller/pandit.controller.js";

import { uploadImage } from "../middelware/uploadImage.middleware.js";
import { isAuthenticated } from "../middelware/auth.middleware.js";

const panditRoutes = express.Router();

// ✅ Create (single image + multiple images)
panditRoutes.post(
  "/",
  isAuthenticated,
  uploadImage("pandits").fields([
    { name: "image", maxCount: 1 },     // ✅ profile image
    { name: "images", maxCount: 6 },    // ✅ gallery images
  ]),
  createPandit
);

panditRoutes.get("/", getAllPandit);
panditRoutes.get("/:id", getPanditById);

// ✅ Update (single image + multiple images)
panditRoutes.put(
  "/:id",
  isAuthenticated,
  uploadImage("pandits").fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 6 },
  ]),
  updatePandit
);

panditRoutes.patch("/:id/status", isAuthenticated, updatePanditStatus);
panditRoutes.delete("/:id", isAuthenticated, deletePandit);

export default panditRoutes;

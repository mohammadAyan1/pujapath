import express from "express";
import { isAuthenticated } from "../middelware/auth.middleware.js";
import {
  createProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  getProductById,
} from "../controller/product.controller.js";
import { uploadImage } from "../middelware/uploadImage.middleware.js";
const productRoutes = express.Router();

productRoutes.post(
  "/",
  isAuthenticated,
  uploadImage("products").single("image"),
  createProduct
);
productRoutes.get("/", getAllProduct);
productRoutes.get("/:id", getProductById);
productRoutes.put(
  "/:id",
  isAuthenticated,
  uploadImage("products").single("image"),
  updateProduct
);
productRoutes.patch("/:id/status", isAuthenticated, updateProductStatus);
productRoutes.delete("/:id", isAuthenticated, deleteProduct);

export default productRoutes;

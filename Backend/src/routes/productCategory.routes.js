import express from "express";
import { isAuthenticated } from "../middelware/auth.middleware.js";
import {
  getAllProductCategory,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from "../controller/productCategory.controller.js";

const productCategoryRoutes = express.Router();

productCategoryRoutes.get("/", getAllProductCategory);
productCategoryRoutes.post("/", isAuthenticated, createProductCategory);
productCategoryRoutes.put("/:id", isAuthenticated, updateProductCategory);
productCategoryRoutes.delete("/:id", isAuthenticated, deleteProductCategory);

export default productCategoryRoutes;

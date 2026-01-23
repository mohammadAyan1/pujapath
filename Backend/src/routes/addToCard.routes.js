import express from "express";
import { optionalAuth } from "../middelware/optionalAuth.middleware.js";
import { isAuthenticated } from "../middelware/auth.middleware.js";
import {
  createAddToCartProduct,
  getAddToCartProduct,
  updateAddToCartProduct,
  deleteAllAddToCartProduct,
  deleteSingleCartItem,
  replaceGuestIdToUserId
} from "../controller/addToCard.controller.js";

const addToCardRoutes = express.Router();

addToCardRoutes.post("/", optionalAuth, createAddToCartProduct);
addToCardRoutes.get("/", optionalAuth, getAddToCartProduct);
addToCardRoutes.put("/:id", optionalAuth, updateAddToCartProduct);
addToCardRoutes.delete("/", optionalAuth, deleteAllAddToCartProduct);
addToCardRoutes.delete("/item/:id", optionalAuth, deleteSingleCartItem);
addToCardRoutes.put("/replace/:id", isAuthenticated, replaceGuestIdToUserId);

export default addToCardRoutes;

import express from "express";
import { createAddress, getAddress } from "../controller/address.controller.js";
import { isAuthenticated } from "../middelware/auth.middleware.js";
const addressRoutes = express.Router()
addressRoutes.post("/", isAuthenticated, createAddress)
addressRoutes.get("/", isAuthenticated, getAddress)
export default addressRoutes
import express from "express";
import { getHomeData } from "../controller/home.controller.js";

const homeRoutes = express.Router();

homeRoutes.get("/", getHomeData);

export default homeRoutes;

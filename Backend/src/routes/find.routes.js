import express from "express";
import { getSearchData } from "../controller/find.controller.js";
const findRoutes = express.Router()
findRoutes.get("/", getSearchData)
export default findRoutes
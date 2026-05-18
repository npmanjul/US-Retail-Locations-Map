import { Router } from "express";
import mapRouter from "./map.route.ts";

const router: Router = Router();

router.use("/map", mapRouter);

export default router;

import { Router } from "express";
import { viewportController } from "../controller/map.controller.ts";

const router: Router = Router();

router.get("/viewport", viewportController);

export default router;

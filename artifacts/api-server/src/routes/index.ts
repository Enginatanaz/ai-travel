import { Router, type IRouter } from "express";
import healthRouter from "./health";
import travelPlansRouter from "./travelPlans";

const router: IRouter = Router();

router.use(healthRouter);
router.use(travelPlansRouter);

export default router;

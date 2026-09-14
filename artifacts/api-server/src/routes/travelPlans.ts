import { Router, type IRouter } from "express";
import {
  GenerateTravelPlanBody,
  type ErrorResponse,
} from "@workspace/api-zod";
import {
  AiServiceError,
  generateTravelPlan,
} from "../services/ai/aiService";

const router: IRouter = Router();

router.post("/travel-plans", async (req, res) => {
  const parsed = GenerateTravelPlanBody.safeParse(req.body);
  if (!parsed.success) {
    const response: ErrorResponse = {
      error: "Seyahat bilgilerini kontrol edip tekrar deneyin.",
    };
    res.status(400).json(response);
    return;
  }

  try {
    const plan = await generateTravelPlan(parsed.data);
    res.json(plan);
  } catch (error) {
    req.log.error({ err: error }, "Travel plan generation failed");

    if (error instanceof AiServiceError) {
      req.log.warn({ code: error.code }, "AI service could not create a plan");
      const statusCode = error.code === "missing_api_key" ? 500 : 502;
      const response: ErrorResponse = {
        error: error.message,
      };
      res.status(statusCode).json(response);
      return;
    }

    const response: ErrorResponse = {
      error: "Plan oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.",
    };
    res.status(503).json(response);
  }
});

export default router;
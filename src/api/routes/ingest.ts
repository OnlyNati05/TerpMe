import { Router } from "express";
import { ingestController } from "../controllers/ingest.controller";

const ingestRouter = Router();

ingestRouter.post("/", ingestController);

export default ingestRouter;

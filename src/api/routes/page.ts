import { Router } from "express";
import { addPage, addPagesBulk } from "../controllers/page.controller";

const pageRouter = Router();

pageRouter.post("/", addPage);
pageRouter.post("/bulk", addPagesBulk);

export default pageRouter;

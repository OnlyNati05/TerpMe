import { Router } from "express";
import {
  addPage,
  addPagesBulk,
  check,
  deletePage,
  deletePagesBulk,
} from "../controllers/page.controller";

const pageRouter = Router();

pageRouter.post("/", addPage);
pageRouter.post("/test", check);
pageRouter.post("/bulk", addPagesBulk);
pageRouter.delete("/", deletePage);
pageRouter.delete("/bulk", deletePagesBulk);

export default pageRouter;

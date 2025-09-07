import { Router } from "express";
import { addPage, addPagesBulk, deletePage, deletePagesBulk } from "../controllers/page.controller";

const pageRouter = Router();

pageRouter.post("/", addPage);
pageRouter.post("/bulk", addPagesBulk);
pageRouter.delete("/", deletePage);
pageRouter.delete("/bulk", deletePagesBulk);

export default pageRouter;

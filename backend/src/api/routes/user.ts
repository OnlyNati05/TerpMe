import { Router } from "express";
import { updateAvatar, getUser } from "../controllers/user.controller";

const userRouter = Router();

userRouter.patch("/avatar", updateAvatar);
userRouter.get("/", getUser);

export default userRouter;

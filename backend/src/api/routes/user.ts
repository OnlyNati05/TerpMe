import { Router } from "express";
import { updateAvatar, getUser, userLimit } from "../controllers/user.controller";

const userRouter = Router();

userRouter.patch("/avatar", updateAvatar);
userRouter.get("/", getUser);
userRouter.get("/limit", userLimit);

export default userRouter;

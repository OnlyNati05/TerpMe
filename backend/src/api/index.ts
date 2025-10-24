import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { FRONTEND_URL, PORT } from "./config/env";
import chatRouter from "./routes/chat";
import pageRouter from "./routes/page";
import userRouter from "./routes/user";
import ingestRouter from "./routes/ingest";
import conversationRoutes from "./routes/conversations";
import cookieParser from "cookie-parser";

const app = express();

// Middleware

let allowedOrigin = FRONTEND_URL;
if (allowedOrigin.endsWith("/")) {
  allowedOrigin = allowedOrigin.slice(0, -1);
}

app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  if (!req.cookies.uid) {
    res.cookie("uid", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  next();
});
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATHC", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/pages", pageRouter);
app.use("/ingest", ingestRouter);
app.use("/chat", chatRouter);
app.use("/conversations", conversationRoutes);
app.use("/user", userRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

import { randomUUID } from "node:crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { FRONTEND_URL, PORT } from "./api/config/env";
import chatRouter from "./api/routes/chat";
import pageRouter from "./api/routes/page";
import userRouter from "./api/routes/user";
import ingestRouter from "./api/routes/ingest";
import conversationRoutes from "./api/routes/conversations";

const app = express();

const allowedOrigins = [
  FRONTEND_URL.replace(/\/$/, ""),
  "https://www.terrpme.com",
  "https://terrpme.com",
  "https://terpme.vercel.app",
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("CORS rejected origin:", origin);
    return callback(new Error(`CORS blocked from origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  if (!req.cookies.uid) {
    res.cookie("uid", randomUUID(), {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  next();
});
app.use(helmet());
app.use(morgan("dev"));

app.use("/pages", pageRouter);
app.use("/ingest", ingestRouter);
app.use("/chat", chatRouter);
app.use("/conversations", conversationRoutes);
app.use("/user", userRouter);

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
}

export default app;

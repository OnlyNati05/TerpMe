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
import { userTokenMiddleware } from "./middleware/userToken";

const app = express();

const allowedOrigins = ["http://localhost:3000", "https://terpme.vercel.app"];

// Middleware
app.use(
  cors({
    origin: ["https://terpme.vercel.app", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-user-token"],
  })
);

app.options(/.*/, cors());
app.use(express.json());
app.use(cookieParser());
app.use(userTokenMiddleware);
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

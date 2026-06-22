const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const morgan = require("morgan");
const path = require("path");

const routes = require("./routes");
const errorHandler = require("./middlewares/errorMiddleware");
const logger = require("./services/loggerService");
const AppError = require("./utilities/AppError");
const { configureCloudinary } = require("./config/cloudinaryConfig");

const app = express();

// Initialize Cloudinary on application boot
configureCloudinary();

// 1. Trust proxy (Essential for correct client IP logging and rate limiting on Vercel serverless proxy layers)
app.set("trust proxy", 1);

// 1b. MongoDB Database connection middleware (bulletproof serverless MERN pattern)
const connectDB = require("./config/database");
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// 2. Global security middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Reflect request origin dynamically to support credentials across development & production domains
      callback(null, true);
    },
    credentials: true,
  }),
);

// 3. Rate limiting (Slightly relaxed for dev environments)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 1000 : 100,
  message: "Too many requests from this IP, please try again after 15 minutes.",
});
app.use("/api", limiter);

// 4. Request body parsing (Increased to 10MB to accommodate base64 graphics encoding)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 5. Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// 6. Logging HTTP requests using Morgan streaming to Winston
const morganStream = {
  write: (message) => logger.info(message.trim()),
};
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms", {
    stream: morganStream,
  }),
);

// 7. Serve static files (Local ZIP downloads fallback)
app.use("/public", express.static(path.join(__dirname, "public")));

// 8. Base health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    environment: process.env.NODE_ENV || "production",
    vercel: !!process.env.VERCEL,
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Portfolio Maker API Server!",
    version: "1.0.0",
    status: "ACTIVE",
    frontend_url: process.env.BASE_URL,
  });
});

// 9. API Routes (Supporting both /api/v1 and /api for frontend compatibility)
app.use("/api", routes);
app.use("/api/v1", routes);

// 10. Catch-all for unhandled routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 11. Centralized Error Handler
app.use(errorHandler);

module.exports = app;

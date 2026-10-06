import { Hono } from "hono";
import { cors } from "hono/cors";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import { fakultasRoutes, prodiRoutes, rolesRoutes, requestsRoutes, exercisesRoutes, activityLogsRoutes } from "./routes/crud";
import mataKuliahRoutes from "./routes/mata-kuliah";
import { materialRoutes, bankSoalRoutes } from "./routes/content";
import { videoRoutes, responsiRoutes, supportRoutes } from "./routes/media";
import dashboardRoutes from "./routes/dashboard";
import marketplaceRoutes from "./routes/marketplace";

const app = new Hono().basePath("/api");

// CORS
app.use("*", cors({
    origin: [
        "https://lms.helphin.id",
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Mount all routes
app.route("/auth", authRoutes);
app.route("/users", userRoutes);
app.route("/fakultas", fakultasRoutes);
app.route("/prodi", prodiRoutes);
app.route("/roles", rolesRoutes);
app.route("/requests", requestsRoutes);
app.route("/exercises", exercisesRoutes);
app.route("/activity-logs", activityLogsRoutes);
app.route("/mata-kuliah", mataKuliahRoutes);
app.route("/materials", materialRoutes);
app.route("/bank-soal", bankSoalRoutes);
app.route("/videos", videoRoutes);
app.route("/responsi", responsiRoutes);
app.route("/support", supportRoutes);
app.route("/dashboard", dashboardRoutes);
app.route("/marketplace", marketplaceRoutes);

// Global error handler
app.onError((err, c) => {
    console.error("[API ERROR]", (err as { code?: string }).code || "", err.message);
    if (err.message.includes("Unauthorized")) return c.json({ success: false, message: "Unauthorized" }, 401);
    if (err.message.includes("Forbidden")) return c.json({ success: false, message: err.message }, 403);
    return c.json({ success: false, message: err.message || "Internal server error" }, 500);
});

export default app;

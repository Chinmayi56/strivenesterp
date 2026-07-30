import express from "express";
import path from "path";
import { spawn } from "child_process";
import { createProxyMiddleware } from "http-proxy-middleware";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const FASTAPI_PORT = 8000;

async function startServer() {
  const app = express();

  // 1. Spawn FastAPI Uvicorn Backend Process
  console.log("Starting FastAPI Backend process on port 8000...");
  const pythonEnv = {
    ...process.env,
    PYTHONPATH: `/usr/local/lib/python3.11/dist-packages:/usr/lib/python3/dist-packages:${path.join(process.cwd(), "backend")}`,
    ENVIRONMENT: process.env.ENVIRONMENT || "development",
    DATABASE_URL: process.env.DATABASE_URL || "sqlite:///./strivenest.db",
  };

  const fastApiProcess = spawn(
    "/usr/bin/python3",
    ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
    {
      cwd: path.join(process.cwd(), "backend"),
      env: pythonEnv,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  fastApiProcess.stdout.on("data", (data) => {
    console.log(`[FastAPI]: ${data.toString().trim()}`);
  });

  fastApiProcess.stderr.on("data", (data) => {
    console.error(`[FastAPI Stderr]: ${data.toString().trim()}`);
  });

  process.on("exit", () => {
    fastApiProcess.kill();
  });

  // 2. Proxy API, Docs, ReDoc, and OpenAPI to FastAPI on port 8000
  const fastApiProxy = createProxyMiddleware({
    target: `http://127.0.0.1:${FASTAPI_PORT}`,
    changeOrigin: true,
  });

  app.use("/api/v1", fastApiProxy);
  app.use("/docs", fastApiProxy);
  app.use("/redoc", fastApiProxy);
  app.use("/openapi.json", fastApiProxy);

  // 3. Internal endpoint to trigger Pytest suite and return results to UI
  app.get("/api/internal/run-tests", (req, res) => {
    const testProc = spawn(
      "/usr/bin/python3",
      ["-m", "pytest", "backend/tests/", "-v", "--tb=short"],
      {
        cwd: process.cwd(),
        env: pythonEnv,
      }
    );

    let stdout = "";
    let stderr = "";

    testProc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    testProc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    testProc.on("close", (code) => {
      res.json({
        success: code === 0,
        exitCode: code,
        output: stdout,
        errors: stderr,
      });
    });
  });

  // 4. Vite Middleware or Static Production Serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Proxying FastAPI backend from http://127.0.0.1:${FASTAPI_PORT}`);
  });
}

startServer();

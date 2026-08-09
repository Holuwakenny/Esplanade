import express from "express";
import path from "path";
import http from "http";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const PYTHON_PORT = 5000;

// Start Python Backend Process
let pythonProcess: ReturnType<typeof spawn> | null = null;

function startPythonBackend() {
  console.log("[Node Server] Spawning Python 3.10 backend server.py...");
  pythonProcess = spawn("python3", ["server.py"], {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  pythonProcess.on("error", (err) => {
    console.error("[Node Server] Failed to start Python backend:", err);
  });

  pythonProcess.on("exit", (code, signal) => {
    console.log(`[Node Server] Python backend exited with code ${code}, signal ${signal}`);
  });
}

startPythonBackend();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  // Proxy /api requests to Python backend
  app.use("/api", (req, res) => {
    const targetPath = `/api${req.url}`;
    const options: http.RequestOptions = {
      hostname: "127.0.0.1",
      port: PYTHON_PORT,
      path: targetPath,
      method: req.method,
      headers: {
        ...req.headers,
        host: `127.0.0.1:${PYTHON_PORT}`,
      },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on("error", (err) => {
      console.error("[Node Proxy Error]:", err.message);
      res.status(502).json({
        error: "Python Backend Service Unavailable",
        details: err.message,
      });
    });

    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader("Content-Type", "application/json");
      proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }

    req.pipe(proxyReq, { end: true });
  });

  // Vite middleware for dev or Static files for prod
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
    console.log(`[Node Server] Esplanade 6 App running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Node Server] Fatal Error during startup:", err);
});

// Cleanup python process on shutdown
process.on("SIGINT", () => {
  if (pythonProcess) pythonProcess.kill();
  process.exit();
});
process.on("SIGTERM", () => {
  if (pythonProcess) pythonProcess.kill();
  process.exit();
});

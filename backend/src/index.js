import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer as createHttpServer } from "http";
import { createServer as createHttpsServer } from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  createApolloServer,
  getGraphQLMiddleware,
} from "./graphql/apolloServer.js";
import { connectDB } from "./config/database.js";
import { initializeSocket } from "./sockets/socketHandler.js";
import usuariosRoutes from "./routes/usuariosRoutes.js";
import voluntariadosRoutes from "./routes/voluntariadosRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const HTTPS_PORT = process.env.HTTPS_PORT || 4443;
const USE_HTTPS = process.env.USE_HTTPS === "true";

// middlewares
app.use(cors());
app.use(express.json());

// servir archivos estaticos del frontend
app.use(express.static(path.join(__dirname, "../../frontend")));

// ruta principal
app.get("/", (req, res) => {
  res.json({
    mensaje: "api de voluntariados - backend con graphql, mongodb y websockets",
    version: "4.0.0",
    https_enabled: USE_HTTPS,
    endpoints: {
      graphql: USE_HTTPS
        ? `https://localhost:${HTTPS_PORT}/graphql`
        : `http://localhost:${PORT}/graphql`,
      rest_usuarios: USE_HTTPS
        ? `https://localhost:${HTTPS_PORT}/api/usuarios`
        : `http://localhost:${PORT}/api/usuarios`,
      rest_voluntariados: USE_HTTPS
        ? `https://localhost:${HTTPS_PORT}/api/voluntariados`
        : `http://localhost:${PORT}/api/voluntariados`,
      websocket: "socket.io habilitado",
    },
    database: "mongodb atlas",
    features: [
      "graphql",
      "rest api",
      "websockets",
      "mongoose",
      "roles",
      USE_HTTPS ? "https" : "http",
    ],
    info: "usa /graphql para consultas graphql",
  });
});

// crear servidor (http o https segun configuracion)
let server;

if (USE_HTTPS) {
  try {
    const certPath = path.join(__dirname, "cert");
    const httpsOptions = {
      key: fs.readFileSync(path.join(certPath, "server.key")),
      cert: fs.readFileSync(path.join(certPath, "server.cert")),
    };
    server = createHttpsServer(httpsOptions, app);
    console.log("[ssl] certificados https cargados correctamente");
  } catch (error) {
    console.error("[ssl error] no se pudieron cargar los certificados https");
    console.error("[ssl error] ejecuta: npm run generate-cert");
    console.error("[ssl error] o desactiva https en .env (USE_HTTPS=false)");
    process.exit(1);
  }
} else {
  server = createHttpServer(app);
}

// iniciar servidor
async function startServer() {
  try {
    // conectar a mongodb
    console.log("[inicio] conectando a mongodb atlas...");
    await connectDB();

    // inicializar websockets
    console.log("[inicio] inicializando websockets...");
    initializeSocket(server);

    // crear servidor apollo graphql
    console.log("[inicio] creando servidor apollo graphql...");
    const apolloServer = await createApolloServer();

    // integrar graphql con express
    app.use("/graphql", getGraphQLMiddleware(apolloServer));

    // rutas rest
    app.use("/api/usuarios", usuariosRoutes);
    app.use("/api/voluntariados", voluntariadosRoutes);

    // ruta 404
    app.use((req, res) => {
      res.status(404).json({
        ok: false,
        mensaje: "endpoint no encontrado",
        ruta: req.url,
      });
    });

    // manejo de errores
    app.use((err, req, res, next) => {
      console.error("[error]", err);
      res.status(500).json({
        ok: false,
        mensaje: "error interno del servidor",
        error: err.message,
      });
    });

    // iniciar servidor
    const serverPort = USE_HTTPS ? HTTPS_PORT : PORT;
    const protocol = USE_HTTPS ? "https" : "http";

    server.listen(serverPort, () => {
      console.log("");
      console.log("════════════════════════════════════════════════");
      console.log("  SERVIDOR INICIADO CORRECTAMENTE");
      console.log("════════════════════════════════════════════════");
      console.log("");
      console.log(`protocolo: ${protocol.toUpperCase()}`);
      console.log(`url base: ${protocol}://localhost:${serverPort}`);
      console.log("base de datos: mongodb atlas");
      console.log("");
      console.log("endpoints:");
      console.log(`  - graphql: ${protocol}://localhost:${serverPort}/graphql`);
      console.log(
        `  - rest usuarios: ${protocol}://localhost:${serverPort}/api/usuarios`
      );
      console.log(
        `  - rest voluntariados: ${protocol}://localhost:${serverPort}/api/voluntariados`
      );
      console.log("  - websocket: socket.io habilitado");
      console.log(
        "  - frontend: ${protocol}://localhost:${serverPort}/index.html"
      );
      console.log("");
      console.log(
        "features: mongoose, graphql, websockets, roles, " +
          (USE_HTTPS ? "https ✅" : "http")
      );
      console.log("");
      if (USE_HTTPS) {
        console.log("⚠️  ADVERTENCIA: usando certificado autofirmado");
        console.log("   acepta el certificado en el navegador");
      }
      console.log("");
    });
  } catch (error) {
    console.error(
      "[error fatal] no se pudo iniciar el servidor:",
      error.message
    );
    console.error("detalles:", error);
    process.exit(1);
  }
}

startServer();

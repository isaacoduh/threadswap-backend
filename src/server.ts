import "dotenv/config";
import http from 'http'
import { createApp } from "@/app";
import { ensureRedisSessionConnected } from "@/common/redis/redis.session.client";
import { createSocketServer } from "./modules/realtime/socket/socket.server";

const port = Number(process.env.PORT ?? 8080);

async function main() {
  await ensureRedisSessionConnected();

 
  const app = createApp();
  const httpServer = http.createServer(app);
  
  // attach socket.io
  createSocketServer(httpServer);

  httpServer.listen(port, () => {
    console.log(`[backend-api] listening on :${port}`);
  });
}

main().catch((err) => {
  console.error("[backend-api] failed to start", err);
  process.exit(1);
});
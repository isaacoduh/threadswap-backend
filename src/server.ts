import "dotenv/config";
import { createApp } from "@/app";
import { ensureRedisSessionConnected } from "@/common/redis/redis.session.client";

const port = Number(process.env.PORT ?? 8080);

async function main() {
  await ensureRedisSessionConnected();

  const app = createApp();
  app.listen(port, () => console.log(`[backend-api] listening on :${port}`));
}

main().catch((err) => {
  console.error("[backend-api] failed to start", err);
  process.exit(1);
});
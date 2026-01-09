import "dotenv/config"
import { startExampleWorker } from "@/modules/jobs/jobs/example.worker"

async function main() {
    startExampleWorker();
    console.log("[worker] started")
}

main().catch((err) => {
    console.error("[worker] failed to start", err);
    process.exit(1)
})
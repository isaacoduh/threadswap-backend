import "dotenv/config"
import {createApp} from "@/app";

const port = Number(process.env.PORT ?? 3000);

async function main () {
    const app = createApp();

    app.listen(port, () => {
        // Keep it simple—wire a real logger later
        console.log(`[backend-api] listening on :${port}`);
    });
}

main().catch((err) => {
    console.error("[backend-api] failed to start", err);
    process.exit(1);
});
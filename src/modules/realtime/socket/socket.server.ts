import type {Server as HttpServer} from "http";
import { Server } from "socket.io";
import { verifyAccessToken } from "@/modules/auth/services/token.service";

export function createSocketServer(httpServer: HttpServer) {
    const io = new Server(httpServer,  {
        // keep aligned with your REST CORS approach
        cors: {
        origin: process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()).filter(Boolean) ?? true,
        credentials: true
        },
        // optional: set a custom path if you want
        // path: "/ws"
    })

    io.use((socket, next) => {
        try {
            const token = 
                (socket.handshake.auth?.token as string | undefined) ||
                (socket.handshake.headers.authorization?.toString().startsWith("Beaer ")
                    ? socket.handshake.headers.authorization.toString().slice("Bearer ".length)
                    : undefined
                );
            if (!token) return next(new Error("Missing token"));
            const payload = verifyAccessToken(token)
            socket.data.user = {id: payload.sub, email: payload.email}
            return next()
        } catch (error) {
            console.log(`Error: ${error}`)
            return next(new Error("Invalid or expired token"))
        }
    });
    
    io.on("connection", (socket) => {
        // with socket.data.user
        socket.emit("ready", {ok: true, user: socket.data.user});
        socket.on("ping", () => {
            socket.emit("pong", {t: Date.now()})
        })
        socket.on("disconnect", () => {

        });
    });

    return io
}
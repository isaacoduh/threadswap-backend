import {prisma} from "@db/prisma";
import {hashPassword, verifyPassword} from "@modules/auth/services/password.service";
import {signAcessToken} from "@modules/auth/services/token.service.";

export async function register(emailRaw: string, password: string) {
    const email = emailRaw.trim().toLowerCase();

    if(!email || !password || password.length < 8){
        return {status: 400 as const, body: {type: "validation_error", detail: "Invalid email or password"}};
    }

    const existing = await prisma.user.findUnique({where: {
        email
    }})
    if(existing) {
        return {status: 400 as const, body: {type: "conflict", detail: "Email already registered"}};
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
        data: {email, passwordHash },
        select: {id: true, email: true, createdAt: true}
    });

    const token = signAcessToken({sub: user.id, email: user.email});

    return {status: 201 as const, body: {user, token}};
}

export async function login(emailRaw: string, password: string) {
    const email = emailRaw.trim().toLowerCase();
    if(!email || !password) {
        return {status: 400 as const, body: {
            type: "validation_error",
            detail: "Invalid email or password"
        }}
    }


    const user = await prisma.user.findUnique({where: {email}})
    if (!user) {
        return {
            status: 401 as const,
            body: { type: "auth_error", detail: "Invalid credentials" }
        };
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if(!ok) {
        return {status: 401 as const, body: {
            type: "auth_error",
            detail: "Invalid credentials"
        }}
    }
    const token = signAcessToken({sub: user.id, email: user.email});

    return {status: 200 as const, body: {
        user: {id: user.id, email: user.email},
        token: token
    }}
}
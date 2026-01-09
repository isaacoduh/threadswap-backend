import {z} from "zod";

const boolFromString = z.string().transform((v) => v.toLowerCase())
    .refine((v) => ["true", "false"].includes(v), "Must be true/false")
    .transform((v) => v === "true");

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(8080),

    // Core
    CORS_ORIGIN: z.string().optional(),

    // Auth
    JWT_SECRET: z.string().min(8, "JWT_SECRET must be at least 20 chars"),
    JWT_EXPIRES_IN: z.string().default("7d"),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),

    // Postgres (Prisma)
    DATABASE_URL: z.string().min(1),

    // Redis
    REDIS_URL: z.string().min(1),
    SESSION_SECRET: z.string().min(20),
    SESSION_COOKIE_NAME: z.string().default("threadswap.sid"),
    SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 14),

    // S3
    AWS_REGION: z.string().min(1).optional(),
    AWS_S3_BUCKET: z.string().min(1).optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),

    // BullMQ
    BULLMQ_PREFIX: z.string().default("threadswap"),

    // Feature flags (optional)
    START_WORKER: boolFromString.optional()
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  // Print all issues clearly and crash fast
  // eslint-disable-next-line no-console
  console.error("[env] invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env: Env = parsed.data;

export const corsOrigins = env.CORS_ORIGIN?.split(",").map((s) => s.trim()).filter(Boolean);
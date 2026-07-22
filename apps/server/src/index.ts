import { createContext } from "@mailhog/api/context";
import { appRouter } from "@mailhog/api/routers/index";
import { auth } from "@mailhog/auth";
import { env } from "@mailhog/env/server";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { z } from "zod";
import prisma from "@mailhog/db";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

const inboundEmailSchema = z.object({
  id: z.string().min(1).max(200),
  toAddress: z
    .string()
    .email()
    .transform((value) => value.toLowerCase()),
  fromAddress: z.string().min(1).max(320),
  fromName: z.string().max(320).nullable().optional(),
  subject: z.string().max(998).nullable().optional(),
  htmlContent: z.string().max(2_000_000).nullable().optional(),
  textContent: z.string().max(2_000_000).nullable().optional(),
  attachments: z.string().max(5_000_000).nullable().optional(),
  receivedAt: z.string().datetime().optional(),
});

function secretsMatch(
  provided: string | undefined,
  expected: string | undefined,
) {
  if (!provided || !expected || provided.length !== expected.length)
    return false;
  let result = 0;
  for (let index = 0; index < expected.length; index += 1) {
    result |= provided.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return result === 0;
}

app.post("/api/inbound/email", async (c) => {
  if (
    !secretsMatch(c.req.header("x-inbound-secret"), env.INBOUND_EMAIL_SECRET)
  ) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const parsed = inboundEmailSchema.safeParse(
    await c.req.json().catch(() => null),
  );
  if (!parsed.success) return c.json({ error: "Invalid email payload" }, 400);

  const payload = parsed.data;
  const domainName = payload.toAddress.split("@")[1];
  const domain = await prisma.domain.findFirst({
    where: { hostname: domainName, status: "ready" },
  });
  if (!domain)
    return c.json({ error: "Recipient domain is not provisioned" }, 404);

  await prisma.email.upsert({
    where: { id: payload.id },
    create: {
      id: payload.id,
      domainId: domain.id,
      toAddress: payload.toAddress,
      fromAddress: payload.fromAddress,
      fromName: payload.fromName ?? null,
      subject: payload.subject ?? null,
      htmlContent: payload.htmlContent ?? null,
      textContent: payload.textContent ?? null,
      attachments: payload.attachments ?? null,
      receivedAt: payload.receivedAt
        ? new Date(payload.receivedAt)
        : new Date(),
    },
    update: {},
  });

  return c.json({ success: true });
});

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context: context,
  });

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  const apiResult = await apiHandler.handle(c.req.raw, {
    prefix: "/api-reference",
    context: context,
  });

  if (apiResult.matched) {
    return c.newResponse(apiResult.response.body, apiResult.response);
  }

  await next();
});

app.get("/", (c) => {
  return c.text("OK");
});

export default app;

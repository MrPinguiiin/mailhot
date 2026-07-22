import { auth } from "@mailhog/auth";
import prisma from "@mailhog/db";
import type { PrismaClient } from "@mailhog/db/client";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions): Promise<{
  db: PrismaClient;
  session: Awaited<ReturnType<typeof auth.api.getSession>>;
}> {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });
  return {
    db: prisma,
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

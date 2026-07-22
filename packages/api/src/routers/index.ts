import type { RouterClient } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure } from "../index";
import { configureEmailRouting, validateCloudflareDomain } from "../cloudflare";
import { env } from "@mailhog/env/server";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      user: context.session?.user,
    };
  }),
  ownerDashboard: protectedProcedure.handler(async ({ context }) => {
    const ownerId = context.session.user.id;
    const [clients, emails] = await Promise.all([
      context.db.client.findMany({
        where: { ownerId },
        include: { domains: true },
        orderBy: { createdAt: "desc" },
      }),
      context.db.email.count({
        where: { domain: { client: { ownerId } }, isDeleted: false },
      }),
    ]);
    return { clients, emailCount: emails };
  }),
  createClient: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(80) }))
    .handler(async ({ input, context }) => {
      const baseSlug = slugify(input.name) || `client-${Date.now()}`;
      let slug = baseSlug;
      let suffix = 1;
      while (await context.db.client.findUnique({ where: { slug } }))
        slug = `${baseSlug}-${suffix++}`;
      return context.db.client.create({
        data: { ownerId: context.session.user.id, name: input.name, slug },
      });
    }),
  setupClient: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        domain: z.string().min(4).max(253),
        cloudflareToken: z.string().min(20),
      }),
    )
    .handler(async ({ input, context }) => {
      const client = await context.db.client.findFirst({
        where: { id: input.clientId, ownerId: context.session.user.id },
      });
      if (!client) throw new Error("Client not found");
      const hostname = input.domain
        .toLowerCase()
        .trim()
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");
      const domain = await context.db.domain.upsert({
        where: { clientId_hostname: { clientId: client.id, hostname } },
        update: { status: "validating" },
        create: { clientId: client.id, hostname, status: "validating" },
      });
      const job = await context.db.setupJob.create({
        data: {
          clientId: client.id,
          domainId: domain.id,
          status: "running",
          currentStep: "validating_cloudflare",
        },
      });
      try {
        if (!env.CF_EMAIL_WORKER_NAME)
          throw new Error("CF_EMAIL_WORKER_NAME belum dikonfigurasi di server");
        const zone = await validateCloudflareDomain(
          input.cloudflareToken,
          hostname,
        );
        await context.db.setupJob.update({
          where: { id: job.id },
          data: { currentStep: "configuring_email_routing" },
        });
        await configureEmailRouting(
          input.cloudflareToken,
          zone.id,
          env.CF_EMAIL_WORKER_NAME,
        );
        await context.db.domain.update({
          where: { id: domain.id },
          data: { zoneId: zone.id, status: "ready" },
        });
        await context.db.client.update({
          where: { id: client.id },
          data: { status: "ready" },
        });
        return context.db.setupJob.update({
          where: { id: job.id },
          data: {
            status: "completed",
            currentStep: "email_routing_configured",
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Cloudflare setup failed";
        await context.db.domain.update({
          where: { id: domain.id },
          data: { status: "failed" },
        });
        return context.db.setupJob.update({
          where: { id: job.id },
          data: {
            status: "failed",
            currentStep: "provisioning_failed",
            errorMessage: message,
          },
        });
      }
    }),
  clientPage: publicProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ input, context }) => {
      const client = await context.db.client.findUnique({
        where: { slug: input.slug },
        include: {
          domains: { select: { id: true, hostname: true, status: true } },
        },
      });
      if (!client) throw new Error("Client not found");
      return {
        id: client.id,
        name: client.name,
        slug: client.slug,
        status: client.status,
        domains: client.domains,
      };
    }),
  inbox: publicProcedure
    .input(z.object({ slug: z.string(), address: z.string().email() }))
    .handler(async ({ input, context }) => {
      const domain = await context.db.domain.findFirst({
        where: {
          client: { slug: input.slug },
          hostname: input.address.split("@")[1],
          status: "ready",
        },
      });
      if (!domain) return [];
      return context.db.email.findMany({
        where: {
          domainId: domain.id,
          toAddress: input.address.toLowerCase(),
          isDeleted: false,
        },
        orderBy: { receivedAt: "desc" },
        select: {
          id: true,
          toAddress: true,
          fromAddress: true,
          fromName: true,
          subject: true,
          textContent: true,
          htmlContent: true,
          receivedAt: true,
          isRead: true,
        },
      });
    }),
  deleteEmail: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        emailId: z.string(),
        address: z.string().email(),
      }),
    )
    .handler(async ({ input, context }) => {
      const result = await context.db.email.updateMany({
        where: {
          id: input.emailId,
          toAddress: input.address.toLowerCase(),
          domain: { client: { slug: input.slug } },
        },
        data: { isDeleted: true },
      });
      return { success: result.count === 1 };
    }),
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;

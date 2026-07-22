import { z } from "zod";
import { ORPCError } from "@orpc/server";

type CloudflareResponse<T> = {
  success: boolean;
  result: T;
  errors?: Array<{ message?: string }>;
};

async function cloudflareRequest<T>(
  token: string,
  path: string,
  init: RequestInit = {},
) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const body = (await response.json()) as CloudflareResponse<T>;
  if (!response.ok || !body.success) {
    throw new ORPCError("BAD_REQUEST", {
      message: body.errors?.[0]?.message ?? "Cloudflare API request failed",
    });
  }
  return body.result;
}

type EmailRoutingRule = {
  id: string;
  name?: string;
  enabled: boolean;
  matchers?: Array<{ type: string }>;
  actions?: Array<{ type: string; value?: string[] }>;
};

export async function fetchCloudflareZones(token: string) {
  await cloudflareRequest(token, "/user/tokens/verify");
  return cloudflareRequest<Array<{ id: string; name: string; status: string }>>(
    token,
    "/zones?per_page=50",
  );
}

export async function validateCloudflareDomain(
  token: string,
  hostname: string,
) {
  await cloudflareRequest(token, "/user/tokens/verify");
  const result = await cloudflareRequest<
    Array<{ id: string; name: string; status: string }>
  >(
    token,
    `/zones?name=${encodeURIComponent(hostname)}&status=active&per_page=1`,
  );
  const zone = result[0];
  if (!zone || zone.name !== hostname) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Domain tidak ditemukan atau belum aktif di Cloudflare",
    });
  }
  return zone;
}

export async function configureEmailRouting(
  token: string,
  zoneId: string,
  workerName: string,
) {
  await cloudflareRequest(token, `/zones/${zoneId}/email/routing/settings`, {
    method: "PUT",
    body: JSON.stringify({ enabled: true }),
  });

  const rules = await cloudflareRequest<EmailRoutingRule[]>(
    token,
    `/zones/${zoneId}/email/routing/rules`,
  );
  const existing = rules.find((rule) => rule.name === "mailhog-catch-all");
  const payload = {
    name: "mailhog-catch-all",
    enabled: true,
    matchers: [{ type: "all" }],
    actions: [{ type: "worker", value: [workerName] }],
  };

  if (existing) {
    await cloudflareRequest(
      token,
      `/zones/${zoneId}/email/routing/rules/${existing.id}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );
  } else {
    await cloudflareRequest(token, `/zones/${zoneId}/email/routing/rules`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}

import { ORPCError } from "@orpc/server";

type CloudflareResponse<T> = {
  success: boolean;
  result: T;
  errors?: Array<{ message?: string }>;
};

type CloudflareZone = {
  id: string;
  name: string;
  status: string;
  account?: { id: string };
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

export async function fetchCloudflareZones(token: string) {
  return cloudflareRequest<Array<{ id: string; name: string; status: string }>>(
    token,
    "/zones?per_page=50",
  );
}

export async function validateCloudflareDomain(
  token: string,
  hostname: string,
) {
  const result = await cloudflareRequest<
    CloudflareZone[]
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

export async function assertWorkerExists(
  token: string,
  zoneId: string,
  workerName: string,
) {
  const zone = await cloudflareRequest<CloudflareZone>(
    token,
    `/zones/${zoneId}`,
  );
  const accountId = zone.account?.id;
  if (!accountId) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Cloudflare account untuk zone tidak ditemukan",
    });
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${encodeURIComponent(workerName)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (response.status === 401 || response.status === 403) {
    throw new ORPCError("BAD_REQUEST", {
      message:
        "Token Cloudflare tidak memiliki akses Workers Scripts:Read/Edit.",
    });
  }
  if (response.status === 404) {
    throw new ORPCError("BAD_REQUEST", {
      message: `Worker ${workerName} belum ditemukan di Cloudflare. Deploy Worker tersebut terlebih dahulu atau beri token permission Workers Scripts:Edit.`,
    });
  }
  if (!response.ok) {
    throw new ORPCError("BAD_REQUEST", {
      message: `Gagal memeriksa Worker ${workerName} di Cloudflare (${response.status}).`,
    });
  }
}

export async function configureEmailRouting(
  token: string,
  zoneId: string,
  workerName: string,
) {
  const routing = await cloudflareRequest<{ enabled: boolean }>(
    token,
    `/zones/${zoneId}/email/routing`,
  );
  if (!routing.enabled) {
    await cloudflareRequest(token, `/zones/${zoneId}/email/routing`, {
      method: "PATCH",
      body: JSON.stringify({ enabled: true }),
    });
  }

  const rules = await cloudflareRequest<
    Array<{
      id: string;
      name?: string;
      matchers?: Array<{ type: string }>;
      actions?: Array<{ type: string; value?: string[] }>;
    }>
  >(token, `/zones/${zoneId}/email/routing/rules`);
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
      { method: "PUT", body: JSON.stringify(payload) },
    );
  } else {
    await cloudflareRequest(token, `/zones/${zoneId}/email/routing/rules`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}

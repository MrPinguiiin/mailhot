import { ORPCError } from "@orpc/server";

type CloudflareResponse<T> = {
  success: boolean;
  result: T;
  errors?: Array<{ message?: string }>;
};

async function cloudflareRequest<T>(token: string, path: string) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const body = (await response.json()) as CloudflareResponse<T>;
  if (!response.ok || !body.success) {
    throw new ORPCError("BAD_REQUEST", {
      message: body.errors?.[0]?.message ?? "Cloudflare API request failed",
    });
  }
  return body.result;
}

export async function validateCloudflareDomain(token: string, hostname: string) {
  await cloudflareRequest(token, "/user/tokens/verify");
  const result = await cloudflareRequest<Array<{ id: string; name: string; status: string }>>(
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

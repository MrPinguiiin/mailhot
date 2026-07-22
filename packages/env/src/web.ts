import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const serverUrlSchema = z.union([
  z.url(),
  z
    .string()
    .regex(/^\/(?!\/)/, "Use an absolute URL or a same-origin path like /api"),
]);

export const env = createEnv({
  clientPrefix: "PUBLIC_",
  client: {
    PUBLIC_SERVER_URL: serverUrlSchema,
  },
  runtimeEnv: (import.meta as any).env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});

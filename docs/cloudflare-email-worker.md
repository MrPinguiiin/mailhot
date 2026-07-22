# Cloudflare Email Worker

The inbound worker parses incoming MIME messages at Cloudflare and forwards a safe, structured payload to the MailHog API. The API stores the message in the matching ready tenant domain.

## Provisioning flow

The owner setup form now runs this sequence for a client domain:

1. Verify the client token with Cloudflare.
2. Find the active zone for the submitted hostname.
3. Enable Email Routing for the zone.
4. Create or update the idempotent `mailhog-catch-all` rule.
5. Point the rule to the configured Worker name.
6. Mark the domain as `ready` only after all Cloudflare calls succeed.

If any step fails, the domain is marked `failed` and the setup job records the error. The token is not persisted.

## Setup

1. Copy `apps/email-worker/wrangler.toml.example` to `apps/email-worker/wrangler.toml`.
2. Set `INGEST_URL` to the deployed server endpoint.
3. Set `CF_EMAIL_WORKER_NAME` on the MailHog server to the deployed Worker name, for example `mailhog-email-ingest`.
4. Generate a secret with at least 32 characters.
5. Set the same secret on the server as `INBOUND_EMAIL_SECRET` and on the Worker:

```bash
wrangler secret put INBOUND_EMAIL_SECRET
```

6. Deploy from the workspace root:

```bash
bun install
bun run --filter @mailhog/email-worker deploy
```

7. Add `CF_EMAIL_WORKER_NAME` to the server environment. Client setup will automatically enable Email Routing and create/update the `mailhog-catch-all` rule for each zone. Manual routing configuration is not needed after that.

The Worker intentionally does not store Cloudflare tokens or email content locally. A failed API response throws from the email handler so Cloudflare can retry delivery.

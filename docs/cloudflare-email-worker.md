# Cloudflare Email Worker

The inbound worker parses incoming MIME messages at Cloudflare and forwards a safe, structured payload to the MailHog API. The API stores the message in the matching ready tenant domain.

## Setup

1. Copy `apps/email-worker/wrangler.toml.example` to `apps/email-worker/wrangler.toml`.
2. Set `INGEST_URL` to the deployed server endpoint.
3. Generate a secret with at least 32 characters.
4. Set the same secret on the server as `INBOUND_EMAIL_SECRET` and on the Worker:

```bash
wrangler secret put INBOUND_EMAIL_SECRET
```

5. Deploy from the workspace root:

```bash
bun install
bun run --filter @mailhog/email-worker deploy
```

6. In Cloudflare Email Routing, create a catch-all or address route for the provisioned domain and select this Worker as the destination.

The Worker intentionally does not store Cloudflare tokens or email content locally. A failed API response throws from the email handler so Cloudflare can retry delivery.

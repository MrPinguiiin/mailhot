import PostalMime from "postal-mime";

type Address = { address?: string; name?: string };

function addressValue(value: string | Address | Address[] | undefined) {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0]?.address;
  return value.address;
}

function encodeAttachments(attachments: Array<Record<string, unknown>> | undefined) {
  return JSON.stringify((attachments ?? []).map((attachment) => ({
    filename: attachment.filename,
    mimeType: attachment.mimeType,
    disposition: attachment.disposition,
    contentId: attachment.contentId,
  })));
}

export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    const parsed = await new PostalMime().parse(message.raw);
    const toAddress = addressValue(parsed.to as string | Address | Address[] | undefined)?.toLowerCase();
    if (!toAddress) throw new Error("Inbound email has no recipient");

    const from = parsed.from as string | Address | undefined;
    const response = await fetch(env.INGEST_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-inbound-secret": env.INBOUND_EMAIL_SECRET,
      },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        toAddress,
        fromAddress: addressValue(from) ?? "unknown",
        fromName: typeof from === "object" && from ? from.name ?? null : null,
        subject: parsed.subject ?? null,
        htmlContent: parsed.html ?? null,
        textContent: parsed.text ?? null,
        attachments: encodeAttachments(parsed.attachments as Array<Record<string, unknown>> | undefined),
        receivedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) throw new Error(`Inbound ingest failed with status ${response.status}`);
  },
};

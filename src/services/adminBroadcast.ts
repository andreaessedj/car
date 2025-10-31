// src/services/adminBroadcast.ts
export type SegmentKey =
  | "ALL_USERS"
  | "VIP_ACTIVE"
  | "VIP_EXPIRING_7D"
  | "NO_BIO"
  | "NO_NAME";

export async function sendBroadcast({
  segment,
  subject,
  message,
  batchSize = 300,
  pauseMs = 20000,
}: {
  segment: SegmentKey;
  subject: string;
  message: string;
  batchSize?: number;
  pauseMs?: number;
}) {
  const res = await fetch("/functions/v1/admin-broadcast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ segment, subject, message, batchSize, pauseMs }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Broadcast fallito: ${res.status} ${err}`);
  }
  return res.json();
}

import { createHash, randomBytes } from "crypto";

const ACCEPTANCE_TOKEN_BYTES = 32;

export function generateAcceptanceToken() {
  return randomBytes(ACCEPTANCE_TOKEN_BYTES).toString("base64url");
}

export function hashAcceptanceToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function getAcceptanceBaseUrl(request: Request) {
  const configuredUrl = process.env.BATIFLOW_APP_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  return new URL(request.url).origin;
}

export function buildAcceptanceUrl(baseUrl: string, token: string) {
  return `${baseUrl.replace(/\/+$/, "")}/accepter-devis/${encodeURIComponent(
    token
  )}`;
}


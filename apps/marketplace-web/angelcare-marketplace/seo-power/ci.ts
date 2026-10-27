import "server-only";
import { createPublicKey, verify } from "node:crypto";
import { NextResponse } from "next/server";
import { safeRead, hash } from "./network";
import { db } from "./repository";
import { jsonBody, failure } from "./api";
import { record, text, SeoFault } from "./model";
const issuer = "https://token.actions.githubusercontent.com",
  audience = "angelcare-seo-power",
  repo = "ANGELCARE-MOROCCO/ANGELCARE-OPS-OS-V.1",
  ref = "refs/heads/upgrade/next-angelcare-upgrade";
let keys: { at: number; values: Record<string, unknown>[] } = {
  at: 0,
  values: [],
};
export function validateClaims(
  claims: Record<string, unknown>,
  now = Date.now() / 1000,
) {
  if (
    claims.iss !== issuer ||
    claims.aud !== audience ||
    claims.repository !== repo ||
    claims.ref !== ref ||
    claims.workflow_ref !==
      repo + "/.github/workflows/build-marketplace-ghcr-oneoff.yml@" + ref ||
    !["push", "workflow_dispatch"].includes(String(claims.event_name)) ||
    Number(claims.exp) < now - 20 ||
    Number(claims.nbf) > now + 20 ||
    !Number.isFinite(Number(claims.exp)) ||
    !Number.isFinite(Number(claims.nbf)) ||
    !/^\d+$/.test(String(claims.run_id)) ||
    !/^[a-f0-9]{40}$/.test(String(claims.sha))
  )
    throw new SeoFault(
      "CI_IDENTITY_REFUSED",
      "Identité de livraison non autorisée.",
      403,
    );
  return claims;
}
export async function verifyIdentity(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3 || token.length > 20000)
    throw new SeoFault("CI_TOKEN_INVALID", "Jeton CI invalide.", 403);
  let head: Record<string, unknown>, claims: Record<string, unknown>;
  try {
    head = record(JSON.parse(Buffer.from(parts[0], "base64url").toString()));
    claims = record(JSON.parse(Buffer.from(parts[1], "base64url").toString()));
  } catch {
    throw new SeoFault("CI_TOKEN_INVALID", "Jeton CI invalide.", 403);
  }
  if (head.alg !== "RS256" || typeof head.kid !== "string")
    throw new SeoFault("CI_ALGORITHM_REFUSED", "Signature CI refusée.", 403);
  validateClaims(claims);
  if (
    Date.now() - keys.at > 1800000 ||
    !keys.values.some((k) => k.kid === head.kid)
  ) {
    const response = await safeRead(new URL(issuer + "/.well-known/jwks"), {
      origin: issuer,
      maxBytes: 100000,
      allowedPath: (p) => {
        if (p !== "/.well-known/jwks")
          throw new SeoFault("CI_KEYS_REFUSED", "Chemin de clés inattendu.");
      },
    });
    if (response.statusCode !== 200)
      throw new SeoFault(
        "CI_KEYS_UNAVAILABLE",
        "Clés GitHub indisponibles.",
        503,
      );
    const list = record(JSON.parse(response.body.toString())).keys;
    if (!Array.isArray(list))
      throw new SeoFault(
        "CI_KEYS_UNAVAILABLE",
        "Clés GitHub indisponibles.",
        503,
      );
    keys = { at: Date.now(), values: list.map(record) };
  }
  const key = keys.values.find((k) => k.kid === head.kid && k.kty === "RSA");
  if (
    !key ||
    !verify(
      "RSA-SHA256",
      Buffer.from(parts[0] + "." + parts[1]),
      createPublicKey({
        key: key as import("node:crypto").JsonWebKey,
        format: "jwk",
      }),
      Buffer.from(parts[2], "base64url"),
    )
  )
    throw new SeoFault("CI_SIGNATURE_REFUSED", "Signature CI invalide.", 403);
  return claims;
}
export async function receiveCi(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const token =
        request.headers.get("authorization")?.replace(/^Bearer /, "") || "",
      claims = await verifyIdentity(token),
      body = await jsonBody(request, 200000),
      results = record(body.results);
    if (
      body.sourceSha !== claims.sha ||
      !Array.isArray(results.pages) ||
      results.pages.length !== 3
    )
      throw new SeoFault(
        "CI_REPORT_REFUSED",
        "Le rapport ne correspond pas au commit attesté.",
      );
    const summary = {
      candidate: true,
      sourceSha: claims.sha,
      runUrl: "https://github.com/" + repo + "/actions/runs/" + claims.run_id,
      results,
    };
    const client = await db(),
      existing = await client
        .from("ac_seo_power_ci")
        .select("*")
        .eq("run_id", String(claims.run_id))
        .eq("source", "github-actions-oidc")
        .maybeSingle();
    if (existing.error)
      throw new SeoFault(
        "CI_STORE_UNAVAILABLE",
        "Réception CI indisponible.",
        503,
      );
    if (existing.data) {
      if (hash(existing.data.results) !== hash(summary))
        throw new SeoFault(
          "CI_REPORT_CONFLICT",
          "Ce run possède déjà une autre preuve.",
          409,
        );
      return NextResponse.json({ data: existing.data, requestId });
    }
    const inserted = await client
      .from("ac_seo_power_ci")
      .insert({
        source_sha: claims.sha,
        run_id: String(claims.run_id),
        source: "github-actions-oidc",
        results: summary,
      })
      .select("*")
      .single();
    if (inserted.error)
      throw new SeoFault(
        "CI_STORE_UNAVAILABLE",
        "Réception CI non confirmée.",
        503,
      );
    return NextResponse.json({ data: inserted.data, requestId });
  } catch (e) {
    return failure(e, requestId);
  }
}

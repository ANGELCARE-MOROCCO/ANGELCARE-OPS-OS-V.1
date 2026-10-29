import "server-only";
import { timingSafeEqual } from "node:crypto";
import { checkLinks, inspectPage } from "./crawler";
import { db, getChange, projectRow, rpc } from "./repository";
import {
  type ChangePatch,
  type Page,
  type Row,
  findings,
  record,
  SeoFault,
  targetUrl,
} from "./model";
import { hash, safeRead } from "./network";
import { publicIndexNowKey } from "./public";
import { refresh } from "./actions";
import { recovery } from "./operations-model";
import { growthTick } from "./growth-service";

export async function authorizedWorker(token: string) {
  if (token.length < 40 || token.length > 200) return false;
  const client = await db(),
    r = await client
      .from("ac_seo_power_runtime")
      .select("token_hash,enabled")
      .eq("singleton", true)
      .single();
  const expected = String(r.data?.token_hash || ""),
    actual = hash(token);
  return (
    r.data?.enabled === true &&
    expected.length === 64 &&
    timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  );
}
async function processBatch(projectId: string | null = null) {
  const started = Date.now(),
    results: Row[] = [];
  for (let i = 0; i < 2 && Date.now() - started < 15000; i++) {
    const claimed = await rpc("ac_seo_power_claim", { p_project: projectId });
    if (!claimed) break;
    const job = record(claimed),
      project = projectRow(job.project),
      page = job.page as Page;
    let result: Row = {},
      error: string | null = null;
    try {
      if (job.kind === "crawl") {
        const facts = await inspectPage(project, page.path);
        result = { facts, findings: findings(facts, project) };
      } else if (job.kind === "links") {
        if (!page.facts)
          throw new SeoFault(
            "CRAWL_REQUIRED",
            "Explorez cette page avant de vérifier ses liens.",
          );
        const links = page.facts.links,
          offset = Number(record(job.payload).offset || 0),
          slice = links.slice(offset, offset + 3),
          checked = await checkLinks(
            project,
            slice.map((l) => new URL(l.url).pathname),
          );
        result = {
          checked,
          checkedCount: slice.length,
          total: links.length,
          nextOffset: offset + 3 < links.length ? offset + 3 : null,
        };
      } else if (job.kind === "verify") {
        const change = await getChange(String(record(job.payload).changeId)),
          patch = change.patch as ChangePatch,
          facts = await inspectPage(project, page.path);
        const checks = {
          http: facts.status === 200,
          indexable: !/noindex/i.test(facts.robots),
          title: !patch.title || facts.title === patch.title,
          description:
            !patch.description || facts.description === patch.description,
          canonical:
            !patch.canonicalPath ||
            facts.canonical ===
              new URL(patch.canonicalPath, project.origin).href,
          links:
            !patch.relatedPaths?.length ||
            patch.relatedPaths.every((p) => facts.related.includes(p)),
          schema:
            !patch.schema ||
            facts.schemas.some((value) => {
              const v = record(value);
              return (
                ["WebPage", "CollectionPage"].includes(String(v["@type"])) &&
                v["@id"] ===
                  new URL(page.path, project.origin).href + "#webpage"
              );
            }),
          revision:
            facts.seoPower === "r1:" + project.world &&
            facts.revision === String(change.id),
        };
        result = {
          verified: Object.values(checks).every(Boolean),
          checks,
          facts,
          checkedAt: new Date().toISOString(),
          changeId: change.id,
        };
      } else if (job.kind === "indexnow") {
        if (!project.policy.indexNowEnabled)
          throw new SeoFault(
            "INDEXNOW_DISABLED",
            "IndexNow n’est pas activé pour cet univers.",
          );
        if (!page.indexable || page.http_status !== 200)
          throw new SeoFault(
            "NOT_INDEXABLE",
            "Une URL publique vérifiée est requise.",
          );
        const key = await publicIndexNowKey();
        if (!key)
          throw new SeoFault(
            "INDEXNOW_KEY_REQUIRED",
            "Clé de propriété indisponible.",
          );
        const url = targetUrl(page.path, project),
          submission = {
            host: url.host,
            key,
            keyLocation: project.origin + "/seo-power-indexnow-key.txt",
            urlList: [url.href],
          };
        const response = await safeRead(
          new URL("https://api.indexnow.org/indexnow"),
          {
            origin: "https://api.indexnow.org",
            method: "POST",
            body: JSON.stringify(submission),
            maxBytes: 100000,
            timeoutMs: 8000,
            allowedPath: (p) => {
              if (p !== "/indexnow")
                throw new SeoFault("INDEXNOW_ENDPOINT", "Endpoint inattendu.");
            },
          },
        );
        if (![200, 202].includes(response.statusCode))
          throw new SeoFault(
            [400, 401, 403, 422].includes(response.statusCode)
              ? "INDEXNOW_CONFIGURATION_REFUSED"
              : "INDEXNOW_REFUSED",
            "IndexNow HTTP " + response.statusCode,
            502,
          );
        result = {
          accepted: true,
          indexed: null,
          status: response.statusCode,
          url: url.href,
          submittedAt: new Date().toISOString(),
          meaning:
            "Réception de notification uniquement ; indexation non confirmée.",
        };
      } else throw new SeoFault("UNKNOWN_JOB", "Type de tâche inconnu.");
    } catch (e) {
      error = e instanceof Error ? e.message : "Exécution interrompue.";
      const code = e instanceof SeoFault ? e.code : "EXECUTION_FAILED";
      result = {
        code,
        recovery: recovery(code).kind,
        evidence: record(e).evidence || null,
      };
    }
    try {
      const finished = await rpc("ac_seo_power_finish", {
        p_id: job.id,
        p_token: job.lease_token,
        p_result: result,
        p_error: error,
      });
      results.push({
        id: job.id,
        kind: job.kind,
        projectId: project.id,
        verified: result.verified,
        ...record(finished),
        ...(error ? { error } : {}),
      });
      try {
        if (!error && job.kind === "crawl") {
          const facts = record(result.facts),
            paths = (Array.isArray(facts.links) ? facts.links : [])
              .map((v) => new URL(String(record(v).url)).pathname)
              .slice(0, project.policy.linksPerPage);
          if (paths.length) {
            const client = await db(),
              count = await client
                .from("ac_seo_power_pages")
                .select("id", { count: "exact", head: true })
                .eq("project_id", project.id);
            if (count.error)
              throw new SeoFault(
                "DISCOVERY_READ_FAILED",
                "Inventaire de découverte indisponible.",
                503,
              );
            if ((count.count || 0) < 10000) {
              const added = await client
                .from("ac_seo_power_pages")
                .upsert(
                  paths.slice(0, 10000 - (count.count || 0)).map((path) => ({
                    project_id: project.id,
                    path,
                    locale: path.split("/")[2],
                    kind: "native",
                  })),
                  { onConflict: "project_id,path", ignoreDuplicates: true },
                )
                .select("id");
              if (added.error)
                throw new SeoFault(
                  "DISCOVERY_WRITE_FAILED",
                  "Découverte non enregistrée.",
                  503,
                );
              if (record(job.payload).discover === true)
                for (const row of (added.data || []).slice(0, 10))
                  await rpc("ac_seo_power_enqueue", {
                    p_page: row.id,
                    p_kind: "crawl",
                    p_payload: { discover: true },
                  });
            }
          }
          if (
            project.policy.autoCanonical &&
            facts.status === 200 &&
            !facts.canonical &&
            !/noindex/i.test(String(facts.robots)) &&
            facts.seoPower === "r1:" + project.world &&
            facts.sourceStamp
          ) {
            const actor = "00000000-0000-4000-8000-000000000001";
            const call = async (action: string, payload: Row, suffix: string) =>
              record(
                await rpc("ac_seo_power_command", {
                  p_action: action,
                  p_payload: payload,
                  p_actor: actor,
                  p_request: String(job.id) + "-" + suffix,
                  p_hash: hash({ action, payload, actor, scope: "global" }),
                }),
              );
            const draft = await call(
              "propose",
              {
                pageId: page.id,
                baseHash: facts.contentHash,
                patch: {
                  canonicalPath: page.path,
                  sourceStamp: facts.sourceStamp,
                },
                reason:
                  "Règle autonome approuvée : ajouter uniquement la canonique absente sur une page native publique vérifiée.",
              },
              "canonical-draft",
            );
            const approved = await call(
              "approve",
              { id: draft.id, version: draft.version },
              "canonical-approve",
            );
            await call(
              "publish",
              {
                id: approved.id,
                version: approved.version,
                liveHash: facts.contentHash,
              },
              "canonical-publish",
            );
            refresh(page.path);
          }
        }
        if (
          !error &&
          job.kind === "links" &&
          result.nextOffset !== null &&
          result.nextOffset !== undefined
        )
          await rpc("ac_seo_power_enqueue", {
            p_page: page.id,
            p_kind: "links",
            p_payload: { offset: result.nextOffset },
          });
        if (
          !error &&
          job.kind === "verify" &&
          result.verified === true &&
          project.policy.indexNowEnabled
        )
          await rpc("ac_seo_power_enqueue", {
            p_page: page.id,
            p_kind: "indexnow",
            p_payload: {},
          });
      } catch (followupError) {
        const warning = {
          code:
            followupError instanceof SeoFault
              ? followupError.code
              : "FOLLOWUP_FAILED",
          message:
            followupError instanceof Error
              ? followupError.message
              : "Suite non confirmée.",
          at: new Date().toISOString(),
        };
        await rpc("ac_seo_power_followup", {
          p_id: job.id,
          p_warning: warning,
        });
        Object.assign(results[results.length - 1], { followup: warning });
      }
    } catch (e) {
      const unconfirmed = {
        id: job.id,
        projectId: project.id,
        state: "unconfirmed",
        error: e instanceof Error ? e.message : "Résultat non confirmé.",
      };
      const prior = results.find((r) => r.id === job.id);
      if (prior) Object.assign(prior, unconfirmed);
      else results.push(unconfirmed);
    }
  }
  return {
    results,
    elapsedMs: Date.now() - started,
    remaining: "Les tâches non traitées restent dans la file persistante.",
  };
}

export async function runBatch(
  projectId: string | null = null,
  source: "manual" | "scheduler" = "manual",
) {
  const requestStarted = Date.now();
  const executionId = await rpc("ac_seo_power_execution", {
    p_project: projectId,
    p_source: source,
  });
  try {
    const growth = await growthTick(projectId);
    const batch =
      Date.now() - requestStarted < 15000
        ? await processBatch(projectId)
        : {
            results: [] as Row[],
            elapsedMs: Date.now() - requestStarted,
            remaining:
              "Exploration reportée au prochain lot après le passage Growth.",
          };
    const problems = batch.results.filter(
      (r) =>
        r.error ||
        r.state === "unconfirmed" ||
        r.state === "failed" ||
        r.verified === false ||
        r.followup,
    ).length;
    const answer = {
      ...batch,
      elapsedMs: Date.now() - requestStarted,
      growth,
      problems: problems + (record(growth).error ? 1 : 0),
      executionId,
    };
    await rpc("ac_seo_power_execution", {
      p_id: executionId,
      p_result: answer,
    });
    return answer;
  } catch (e) {
    const fatal = e instanceof SeoFault ? e.code : "EXECUTION_INTERRUPTED";
    await rpc("ac_seo_power_execution", {
      p_id: executionId,
      p_result: { fatal, problems: 1 },
    });
    throw e;
  }
}

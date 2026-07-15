const http = require("http");

const base = process.env.SAAS_FACTORY_BASE_URL || "http://localhost:3000";

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const url = new URL(path, base);

    const req = http.request(
      url,
      {
        method,
        headers: payload
          ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
          : {},
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode, data: data.slice(0, 500) }));
      }
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

(async () => {
  console.log("SAAS FACTORY PHASE 7 OPS SMOKE");
  console.log("==============================");
  console.log(`Base: ${base}`);

  const checks = [
    ["GET", "/api/saas-factory/ops/probes/run"],
    ["GET", "/api/saas-factory/ops/probes/results"],
    ["GET", "/api/saas-factory/ops/modules/snapshot"],
    ["POST", "/api/saas-factory/ops/queue/enqueue", { queue_name: "factory-smoke", job_type: "smoke_test", priority: "normal" }],
    ["POST", "/api/saas-factory/ops/queue/process", { limit: 5 }],
  ];

  let failed = false;

  for (const [method, path, body] of checks) {
    try {
      const result = await request(method, path, body);
      const ok = result.status >= 200 && result.status < 300;
      console.log(`${ok ? "✓" : "✗"} ${method} ${path} ${result.status}`);
      if (!ok) {
        failed = true;
        console.log(result.data);
      }
    } catch (error) {
      failed = true;
      console.log(`✗ ${method} ${path} ${error.message}`);
    }
  }

  if (failed) process.exit(1);
  console.log("Ready.");
})();

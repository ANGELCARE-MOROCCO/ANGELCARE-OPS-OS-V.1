import { array, object, text, type Data } from "./types";
import { classificationAnswer } from "./detail-experience";
export function gradeClassification(d: Data, input: Data) {
  if (d.sortingEnabled !== true) throw Error("INVALID_OPERATION");
  const rule = array(d.sortRules).find((r) => r.id === input.ruleId),
    cards = array(d.cards),
    groups = array(d.sortGroups).filter((g) => g.ruleId === input.ruleId),
    values = object(input.values);
  if (
    !rule ||
    Object.keys(values).length !== cards.length ||
    Object.keys(values).some((id) => !cards.some((c) => c.id === id)) ||
    Object.values(values).some((id) => !groups.some((g) => g.id === id))
  )
    throw Error("INVALID_CHOICES");
  const results = cards.map((c) => ({
    id: text(c.id),
    correct: (classificationAnswer(c.answer)[text(rule.id)] || []).includes(
      text(values[text(c.id)]),
    ),
  }));
  return {
    correct: results.every((r) => r.correct),
    answered: results.length,
    total: cards.length,
    results,
  };
}
export function gradeSoundPair(d: Data, input: Data) {
  if (d.soundMatchingEnabled !== true) throw Error("INVALID_OPERATION");
  const items = array(d.soundItems),
    a = items.find((i) => i.id === input.audioId && i.kind === "audio"),
    b = items.find((i) => i.id === input.imageId && i.kind === "image");
  if (!a || !b) throw Error("INVALID_CHOICES");
  return { correct: !!text(a.answer) && a.answer === b.answer };
}
export interface BridgeConfig {
  span: number;
  strength: number;
  targetLoad: number;
  edgeBudget: number;
}
export interface BridgeNode {
  id: string;
  x: number;
  y: number;
}
export interface BridgeMember {
  id: string;
  a: string;
  b: string;
  length: number;
}
export function bridgeConfig(row: Data): BridgeConfig {
  const c = {
    span: Number(row.span),
    strength: Number(row.strength),
    targetLoad: Number(row.targetLoad),
    edgeBudget: Number(row.edgeBudget),
  };
  if (
    !Number.isInteger(c.span) ||
    c.span < 2 ||
    c.span > 6 ||
    !Number.isInteger(c.edgeBudget) ||
    c.edgeBudget < 2 ||
    c.edgeBudget > 40 ||
    !Number.isFinite(c.strength) ||
    c.strength < 1 ||
    c.strength > 500 ||
    !Number.isFinite(c.targetLoad) ||
    c.targetLoad < 1 ||
    c.targetLoad > 2000
  )
    throw Error("INVALID_BRIDGE");
  return c;
}
export function bridgeGeometry(c: BridgeConfig) {
  const nodes: BridgeNode[] = [],
    members: BridgeMember[] = [];
  for (let y = 0; y < 2; y++)
    for (let x = 0; x <= c.span; x++) nodes.push({ id: `${x}-${y}`, x, y });
  const add = (ax: number, ay: number, bx: number, by: number) => {
    const a = `${ax}-${ay}`,
      b = `${bx}-${by}`;
    members.push({
      id: a + ":" + b,
      a,
      b,
      length: Math.hypot(ax - bx, ay - by),
    });
  };
  for (let x = 0; x <= c.span; x++) {
    add(x, 0, x, 1);
    if (x < c.span) {
      add(x, 0, x + 1, 0);
      add(x, 1, x + 1, 1);
      add(x, 0, x + 1, 1);
      add(x, 1, x + 1, 0);
    }
  }
  return { nodes, members };
}
/** Bounded classroom capacity-flow model. It is not a structural safety calculation. */
export function testBridge(c: BridgeConfig, input: unknown) {
  const { nodes, members } = bridgeGeometry(c);
  if (
    !Array.isArray(input) ||
    input.length > 40 ||
    new Set(input).size !== input.length ||
    input.some(
      (id) => typeof id !== "string" || !members.some((m) => m.id === id),
    )
  )
    throw Error("INVALID_CHOICES");
  const selected = input as string[],
    n = nodes.length + 1,
    s = n - 1,
    t = nodes.findIndex((v) => v.id === `${Math.floor(c.span / 2)}-0`),
    cap = Array.from({ length: n }, () => Array(n).fill(0) as number[]);
  for (const id of selected) {
    const m = members.find((v) => v.id === id)!,
      a = nodes.findIndex((v) => v.id === m.a),
      b = nodes.findIndex((v) => v.id === m.b);
    cap[a][b] += c.strength / m.length;
    cap[b][a] += c.strength / m.length;
  }
  for (const id of ["0-0", `${c.span}-0`])
    cap[s][nodes.findIndex((v) => v.id === id)] = 100000;
  let flow = 0;
  for (let round = 0; round < 400; round++) {
    const prev = Array(n).fill(-1),
      q = [s];
    prev[s] = s;
    for (let k = 0; k < q.length && prev[t] < 0; k++)
      for (let v = 0; v < n; v++)
        if (prev[v] < 0 && cap[q[k]][v] > 1e-8) {
          prev[v] = q[k];
          q.push(v);
        }
    if (prev[t] < 0) break;
    let amount = Infinity;
    for (let v = t; v !== s; v = prev[v])
      amount = Math.min(amount, cap[prev[v]][v]);
    for (let v = t; v !== s; v = prev[v]) {
      cap[prev[v]][v] -= amount;
      cap[v][prev[v]] += amount;
    }
    flow += amount;
  }
  const capacity = Math.floor(flow * 100) / 100;
  return {
    capacity,
    targetLoad: c.targetLoad,
    members: selected.length,
    budget: c.edgeBudget,
    connected: capacity > 0,
    correct: capacity >= c.targetLoad && selected.length <= c.edgeBudget,
  };
}
export function gradeBridge(d: Data, input: Data) {
  const challenge = array(d.bridgeChallenges).find(
    (c) => c.id === input.challengeId,
  );
  if (d.engine !== "bridge" || !challenge) throw Error("INVALID_OPERATION");
  return testBridge(bridgeConfig(challenge), input.members);
}

export function gradeTaskActivity(d: Data, input: Data) {
  const tasks = array(d.tasks),
    values = object(input.values),
    selected = Array.isArray(input.selected) ? input.selected : [],
    pair = Array.isArray(input.pair) ? input.pair : [],
    targets = Array.isArray(input.targetIds)
      ? input.targetIds
      : tasks.map((t) => t.id);
  if (
    tasks.length > 500 ||
    [...Object.keys(values), ...selected, ...pair, ...targets].some(
      (id) => typeof id !== "string" || !tasks.some((t) => t.id === id),
    ) ||
    Object.values(values).some((v) => typeof v !== "string" || v.length > 4000)
  )
    throw Error("INVALID_CHOICES");
  let correct = false;
  if (["matching", "memory"].includes(text(d.engine)))
    correct =
      pair.length === 2 &&
      pair[0] !== pair[1] &&
      !!text(tasks.find((t) => t.id === pair[0])?.answer) &&
      text(tasks.find((t) => t.id === pair[0])?.answer) ===
        text(tasks.find((t) => t.id === pair[1])?.answer);
  else if (d.engine === "sequence")
    correct =
      selected.length === tasks.length &&
      new Set(selected).size === tasks.length &&
      selected.every(
        (id, i) =>
          text(tasks.find((t) => t.id === id)?.answer) === String(i + 1),
      );
  else
    correct =
      targets.length > 0 &&
      targets.every(
        (id) =>
          Object.hasOwn(values, text(id)) &&
          values[text(id)] === tasks.find((t) => t.id === id)?.answer,
      );
  return { correct };
}

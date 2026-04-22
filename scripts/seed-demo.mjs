#!/usr/bin/env node
/**
 * Demo seed script — populates ManuTracker with realistic data.
 *
 * Usage:
 *   1. Clean the DB:  bash scripts/clean-docker-db.sh
 *   2. Wait for backend to restart (~3s)
 *   3. Run:  node scripts/seed-demo.mjs
 *
 * Creates:
 *   - 8 stations (realistic medical device manufacturing)
 *   - 4 pipelines (4–9 steps each, realistic durations)
 *   - 3 customer orders → auto-created jobs
 *   - Tracking events to bring 2 orders to completed, 1 in progress
 */

const API = process.env.API_URL ?? "http://localhost:3000";

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function put(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PUT ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

function isoMinutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

// ─── Stations ────────────────────────────────────────────────
const stationDefs = [
  { name: "Receiving",    location: "Building A — Dock 1",  slotCapacity: 6 },
  { name: "Inspection",   location: "Building A — QC Lab",  slotCapacity: 4 },
  { name: "CNC Milling",  location: "Building B — Bay 1",   slotCapacity: 2 },
  { name: "Polishing",    location: "Building B — Bay 2",   slotCapacity: 3 },
  { name: "Laser Etch",   location: "Building B — Bay 3",   slotCapacity: 2 },
  { name: "Coating",      location: "Building C — Cleanroom", slotCapacity: 1 },
  { name: "Sterilisation", location: "Building C — Autoclave", slotCapacity: 2 },
  { name: "Final QA",     location: "Building A — QC Lab",  slotCapacity: 4 },
];

console.log("Creating stations...");
const stations = [];
for (const def of stationDefs) {
  const s = await post("/stations", def);
  stations.push(s);
  console.log(`  ✓ ${s.name} (${s.id})`);
}

const stationByName = Object.fromEntries(stations.map((s) => [s.name, s]));

// ─── Pipelines ───────────────────────────────────────────────
// Each step: [stationName, minDurationSeconds, maxDurationSeconds, maxCapacity]
const pipelineDefs = [
  {
    name: "Hip Implant",
    productType: "Hip Implant",
    description: "Full hip implant manufacturing — 8 stations",
    steps: [
      ["Receiving",     30,  120,  10],
      ["Inspection",    120, 300,  8],
      ["CNC Milling",   600, 1200, 5],
      ["Polishing",     300, 600,  5],
      ["Laser Etch",    180, 360,  5],
      ["Coating",       900, 1800, 5],
      ["Sterilisation", 1200, 2400, 5],
      ["Final QA",      180, 600,  8],
    ],
  },
  {
    name: "Knee Implant",
    productType: "Knee Implant",
    description: "Knee prosthesis line — 7 stations",
    steps: [
      ["Receiving",     30,  90,   10],
      ["Inspection",    90,  240,  6],
      ["CNC Milling",   480, 960,  4],
      ["Polishing",     240, 480,  4],
      ["Coating",       600, 1200, 4],
      ["Sterilisation", 900, 1800, 4],
      ["Final QA",      120, 420,  6],
    ],
  },
  {
    name: "Bone Screw",
    productType: "Bone Screw",
    description: "Small part fast-track — 4 stations",
    steps: [
      ["Receiving",     15,  45,   50],
      ["CNC Milling",   120, 300,  20],
      ["Coating",       180, 360,  20],
      ["Final QA",      60,  180,  30],
    ],
  },
  {
    name: "Surgical Plate",
    productType: "Surgical Plate",
    description: "Trauma plate line — 6 stations",
    steps: [
      ["Receiving",     20,  60,   15],
      ["Inspection",    60,  180,  10],
      ["CNC Milling",   360, 720,  6],
      ["Laser Etch",    120, 240,  6],
      ["Sterilisation", 600, 1200, 6],
      ["Final QA",      90,  300,  10],
    ],
  },
];

console.log("\nCreating pipelines...");
const pipelines = [];
for (const def of pipelineDefs) {
  const p = await post("/pipelines", {
    name: def.name,
    description: def.description,
    productType: def.productType,
    steps: def.steps.map(([stationName, minDurationSeconds, maxDurationSeconds, maxCapacity]) => ({
      stationId: stationByName[stationName].id,
      minDurationSeconds,
      maxDurationSeconds,
      maxCapacity,
    })),
  });
  pipelines.push(p);
  console.log(`  ✓ ${p.name} — ${p.steps.length} steps`);
}

// ─── Customer Orders ─────────────────────────────────────────
// Order 1: completed (Hip Implant × 5, Bone Screw × 20)
// Order 2: completed (Knee Implant × 3)
// Order 3: in progress (Hip Implant × 4, Surgical Plate × 6, Bone Screw × 10)

const orderDefs = [
  {
    customerName: "Acme Orthopaedics",
    notes: "Priority order — expedite coating",
    dueDate: "2026-04-20",
    lines: [
      { productType: "Hip Implant", quantity: 5 },
      { productType: "Bone Screw", quantity: 20 },
    ],
    goal: "completed",
  },
  {
    customerName: "MedTech Solutions",
    notes: "",
    dueDate: "2026-04-22",
    lines: [
      { productType: "Knee Implant", quantity: 3 },
    ],
    goal: "completed",
  },
  {
    customerName: "Summit Health Group",
    notes: "New account — first order",
    dueDate: "2026-05-01",
    lines: [
      { productType: "Hip Implant", quantity: 4 },
      { productType: "Surgical Plate", quantity: 6 },
      { productType: "Bone Screw", quantity: 10 },
    ],
    goal: "in_progress",
  },
];

console.log("\nCreating customer orders...");
const orders = [];
for (const def of orderDefs) {
  const o = await post("/customer-orders", {
    customerName: def.customerName,
    notes: def.notes,
    dueDate: def.dueDate,
    lines: def.lines,
  });
  orders.push({ ...o, goal: def.goal });
  console.log(`  ✓ ${o.orderNumber} — ${def.customerName} (goal: ${def.goal})`);
}

// ─── Fetch all created jobs ──────────────────────────────────
const jobsRes = await fetch(`${API}/jobs`);
const allJobs = await jobsRes.json();
console.log(`\n${allJobs.length} jobs created from orders`);

// ─── Helper: simulate a job passing through its pipeline ─────
async function simulateJobThrough(job, stepsToComplete, timeOffsetMinutes) {
  const pipelineRes = await fetch(`${API}/pipelines/${job.pipelineId}`);
  const pipeline = await pipelineRes.json();
  const steps = pipeline.steps.slice(0, stepsToComplete);
  let minutesCursor = timeOffsetMinutes;

  for (const step of steps) {
    const station = stations.find((s) => s.id === step.stationId);
    const eyeId = station?.eyeId ?? `eye-sim-${step.stationId.slice(-6)}`;
    const dwellSeconds = step.minDurationSeconds
      ? step.minDurationSeconds + Math.floor(Math.random() * (step.maxDurationSeconds - step.minDurationSeconds))
      : 30 + Math.floor(Math.random() * 120);

    // Arrive
    await post("/events", {
      trayCode: job.trayCode,
      stationId: step.stationId,
      eyeId,
      capturedAt: isoMinutesAgo(minutesCursor),
      phase: "arrived",
    });

    minutesCursor -= dwellSeconds / 60;

    // Depart
    await post("/events", {
      trayCode: job.trayCode,
      stationId: step.stationId,
      eyeId,
      capturedAt: isoMinutesAgo(minutesCursor),
      phase: "departed",
    });

    minutesCursor -= 0.5; // 30s transit between stations
  }

  return minutesCursor;
}

// For "in progress" jobs: arrive at a station but don't depart
async function simulateJobPartial(job, stepsComplete, timeOffsetMinutes) {
  let cursor = await simulateJobThrough(job, stepsComplete, timeOffsetMinutes);

  // Arrive at next station (still there)
  const pipelineRes = await fetch(`${API}/pipelines/${job.pipelineId}`);
  const pipeline = await pipelineRes.json();
  const nextStep = pipeline.steps[stepsComplete];
  if (nextStep) {
    const station = stations.find((s) => s.id === nextStep.stationId);
    const eyeId = station?.eyeId ?? `eye-sim-${nextStep.stationId.slice(-6)}`;
    await post("/events", {
      trayCode: job.trayCode,
      stationId: nextStep.stationId,
      eyeId,
      capturedAt: isoMinutesAgo(cursor),
      phase: "arrived",
    });
  }
}

// ─── Simulate tracking events ────────────────────────────────
console.log("\nSimulating tracking events...");

// Group jobs by order
function jobsForOrder(order) {
  return allJobs.filter((j) =>
    order.lines.some((l) => l.productType === j.productType)
  );
}

// Order 1 — completed: all jobs run full pipeline (~4 hours ago)
const order1Jobs = jobsForOrder(orders[0]);
console.log(`  Order 1 (${orders[0].orderNumber}): ${order1Jobs.length} jobs → completing all`);
for (let i = 0; i < order1Jobs.length; i++) {
  const job = order1Jobs[i];
  const pRes = await fetch(`${API}/pipelines/${job.pipelineId}`);
  const pipeline = await pRes.json();
  await simulateJobThrough(job, pipeline.steps.length, 240 + i * 30);
  process.stdout.write(".");
}
console.log(" done");

// Order 2 — completed: all jobs run full pipeline (~2 hours ago)
const order2Jobs = jobsForOrder(orders[1]);
console.log(`  Order 2 (${orders[1].orderNumber}): ${order2Jobs.length} jobs → completing all`);
for (let i = 0; i < order2Jobs.length; i++) {
  const job = order2Jobs[i];
  const pRes = await fetch(`${API}/pipelines/${job.pipelineId}`);
  const pipeline = await pRes.json();
  await simulateJobThrough(job, pipeline.steps.length, 120 + i * 20);
  process.stdout.write(".");
}
console.log(" done");

// Order 3 — in progress: mix of states
const order3Jobs = jobsForOrder(orders[2]);
console.log(`  Order 3 (${orders[2].orderNumber}): ${order3Jobs.length} jobs → partial progress`);
for (let i = 0; i < order3Jobs.length; i++) {
  const job = order3Jobs[i];
  const pRes = await fetch(`${API}/pipelines/${job.pipelineId}`);
  const pipeline = await pRes.json();
  const totalSteps = pipeline.steps.length;

  if (i === 0) {
    // First job: 60% through, currently at a station
    const stepsComplete = Math.max(1, Math.floor(totalSteps * 0.6));
    await simulateJobPartial(job, stepsComplete, 45 + i * 5);
  } else if (i < order3Jobs.length / 2) {
    // Some jobs: ~30% through, currently at a station
    const stepsComplete = Math.max(1, Math.floor(totalSteps * 0.3));
    await simulateJobPartial(job, stepsComplete, 30 + i * 3);
  } else if (i < order3Jobs.length - 2) {
    // Some jobs: just started, at first station
    await simulateJobPartial(job, 0, 15 + i * 2);
  } else {
    // Last couple: still pending (no events)
  }
  process.stdout.write(".");
}
console.log(" done");

// ─── Summary ─────────────────────────────────────────────────
console.log("\n═══ Seed complete ═══");
console.log(`  ${stations.length} stations`);
console.log(`  ${pipelines.length} pipelines`);
console.log(`  ${orders.length} customer orders`);
console.log(`  ${allJobs.length} jobs`);
console.log("\nOpen http://localhost:5173 to see all states.");

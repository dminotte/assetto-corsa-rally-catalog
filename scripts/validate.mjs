// Checks donnees.json with the same rules as the Assetto Rally Times server, so a contributor sees the problem
// before the maintainer does. No dependency: `node scripts/validate.mjs [file]` (default: donnees.json).
// The server remains the final gate: it runs the same checks before accepting an update.
import { readFileSync } from "node:fs";

const file = process.argv[2] || "donnees.json";
const RAW_NAME_PATTERN = /^[A-Za-z0-9_]{1,80}$/;
const MAX_PROBLEMS = 30;

export function validateCatalog(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return ["The file must be a JSON object."];
  const problems = [];
  const add = (message) => {
    if (problems.length < MAX_PROBLEMS) problems.push(message);
  };
  const text = (value) => typeof value === "string" && value.trim().length > 0;
  const hasLabels = (item) => text(item?.labels?.fr) && text(item?.labels?.en);
  const cars = Array.isArray(payload.cars) ? payload.cars : [];
  const courses = Array.isArray(payload.stages) ? payload.stages : [];
  if (cars.length === 0) add("The list of cars (cars) is missing or empty.");
  if (courses.length === 0) add("The list of courses (stages) is missing or empty.");
  const regionIds = new Set((Array.isArray(payload.regions) ? payload.regions : []).map((region) => region?.id).filter(Boolean));

  const checkAliases = (owner, label, seen) => {
    if (owner.sav_aliases === undefined) return;
    if (!Array.isArray(owner.sav_aliases)) {
      add(`${label}: sav_aliases must be a list.`);
      return;
    }
    for (const raw of owner.sav_aliases) {
      if (typeof raw !== "string" || !RAW_NAME_PATTERN.test(raw)) {
        add(`${label}: invalid in-game name "${String(raw).slice(0, 40)}" (letters, digits and _ only, 80 characters at most).`);
      } else if (seen.has(raw)) {
        add(`${label}: the in-game name "${raw}" is already used by ${seen.get(raw)}.`);
      } else {
        seen.set(raw, label);
      }
    }
  };
  const checkItem = (item, label, ids) => {
    if (!text(item?.id)) {
      add(`${label}: missing id.`);
      return false;
    }
    if (ids.has(item.id)) add(`${label}: duplicate id.`);
    ids.add(item.id);
    if (!text(item.name)) add(`${label}: missing name.`);
    if (!hasLabels(item)) add(`${label}: labels.fr and labels.en are required.`);
    return true;
  };

  const carIds = new Set();
  const carAliases = new Map();
  for (const car of cars) {
    const label = `Car ${car?.id || "?"}`;
    if (checkItem(car, label, carIds)) checkAliases(car, label, carAliases);
  }

  const courseIds = new Set();
  const specialIds = new Set();
  const stageAliases = new Map();
  for (const course of courses) {
    const label = `Course ${course?.id || "?"}`;
    if (!checkItem(course, label, courseIds)) continue;
    if (regionIds.size > 0 && !regionIds.has(course.region)) add(`${label}: unknown region "${course.region}".`);
    const specials = Array.isArray(course.specials) ? course.specials : [];
    if (specials.length === 0) add(`${label}: no special.`);
    for (const special of specials) {
      const specialLabel = `Special ${special?.id || "?"}`;
      if (checkItem(special, specialLabel, specialIds)) checkAliases(special, specialLabel, stageAliases);
    }
  }

  for (const key of ["modes", "weather"]) {
    const table = payload[key];
    if (table !== undefined && (!table || typeof table !== "object" || Array.isArray(table) || Object.values(table).some((value) => typeof value !== "string"))) {
      add(`${key}: must map text to text.`);
    }
  }
  return problems;
}

// Run as a command (not when imported by a test).
if (process.argv[1] && process.argv[1].endsWith("validate.mjs")) {
  let payload;
  try {
    payload = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    console.error(`${file}: not valid JSON (${error.message}).`);
    process.exit(1);
  }
  const problems = validateCatalog(payload);
  if (problems.length > 0) {
    console.error(`${file}: ${problems.length} problem(s)${problems.length >= MAX_PROBLEMS ? " (list truncated)" : ""}:`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  const specials = payload.stages.reduce((sum, course) => sum + course.specials.length, 0);
  console.log(`${file}: OK (${payload.cars.length} cars, ${payload.stages.length} courses, ${specials} specials).`);
}

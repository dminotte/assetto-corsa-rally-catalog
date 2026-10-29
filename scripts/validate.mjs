// Checks data.json, so a contributor sees a problem before the maintainer does.
// No dependency: `node scripts/validate.mjs [file]` (default: data.json).
import { readFileSync } from "node:fs";

const file = process.argv[2] || "data.json";
const SCHEMA_VERSION = 3;
// An id or alias is a name of the game in lowercase, letters and digits only (see README).
const NAME_PATTERN = /^[a-z0-9]{1,80}$/;
// A country's id is its ISO code; "other" is the nationality that is none.
const COUNTRY_ID_PATTERN = /^([a-z]{2}(-[a-z0-9]{1,8})?|other)$/;
const LANGUAGES = ["fr", "en"];
const MAX_PROBLEMS = 30;

// The game's challenges (medals): two optional lists that go together. Ids are the game's own (letters, digits, underscores, case kept).
const CHALLENGE_ID_PATTERN = /^[A-Za-z0-9_]{1,80}$/;
const CHALLENGE_KIND_PATTERN = /^[a-z]{3,20}$/;

function checkChallenges(payload, { stages, cars, weather }, add, text) {
  const hasGroups = payload.challengeGroups !== undefined;
  const hasChallenges = payload.challenges !== undefined;
  if (!hasGroups && !hasChallenges) return;
  if (!hasGroups || !hasChallenges) {
    add("challengeGroups and challenges go together.");
    return;
  }
  if (!Array.isArray(payload.challengeGroups) || payload.challengeGroups.length === 0) add("The list challengeGroups is missing or empty.");
  if (!Array.isArray(payload.challenges) || payload.challenges.length === 0) add("The list challenges is missing or empty.");
  const list = (value) => (Array.isArray(value) ? value : []);
  const groups = new Map();
  for (const group of list(payload.challengeGroups)) {
    if (!CHALLENGE_ID_PATTERN.test(String(group?.id))) add(`Challenge group "${group?.id}": invalid id.`);
    else if (groups.has(group.id)) add(`Challenge group ${group.id}: duplicate id.`);
    else groups.set(group.id, group);
    if (!CHALLENGE_KIND_PATTERN.test(String(group?.kind))) add(`Challenge group ${group?.id}: invalid kind.`);
    for (const field of ["name", "shortName"]) if (!text(group?.[field])) add(`Challenge group ${group?.id}: missing ${field}.`);
    for (const field of ["labels", "shortLabels"]) if (!text(group?.[field]?.en)) add(`Challenge group ${group?.id}: missing ${field}.en.`);
  }
  const ids = new Set();
  const used = new Set();
  for (const item of list(payload.challenges)) {
    const label = `Challenge ${item?.id}`;
    if (!CHALLENGE_ID_PATTERN.test(String(item?.id))) add(`Challenge "${item?.id}": invalid id.`);
    else if (ids.has(item.id)) add(`${label}: duplicate id.`);
    else ids.add(item.id);
    if (!groups.has(item?.group)) add(`${label}: unknown group "${item?.group}".`);
    else used.add(item.group);
    if (!text(item?.name)) add(`${label}: missing name.`);
    if (!text(item?.labels?.en)) add(`${label}: missing labels.en.`);
    if (!stages.has(item?.stage)) add(`${label}: unknown stage "${item?.stage}".`);
    if (!cars.has(item?.car)) add(`${label}: unknown car "${item?.car}".`);
    if (!weather.has(item?.weather)) add(`${label}: unknown weather "${item?.weather}".`);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(item?.startTime))) add(`${label}: startTime must be "HH:MM".`);
    if (item?.type === "time") {
      const marks = [item.gold, item.silver, item.bronze];
      if (!marks.every((mark) => Number.isInteger(mark) && mark > 0) || !(item.gold <= item.silver && item.silver <= item.bronze)) add(`${label}: gold, silver and bronze must be increasing whole seconds.`);
    } else if (item?.type === "position") {
      if (["gold", "silver", "bronze"].some((field) => item[field] !== undefined)) add(`${label}: a position challenge has no target times.`);
    } else {
      add(`${label}: unknown type "${item?.type}" (time or position).`);
    }
  }
  for (const id of groups.keys()) if (!used.has(id)) add(`Challenge group ${id}: no challenge.`);
}

export function validateCatalog(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return ["The file must be a JSON object."];
  const problems = [];
  const add = (message) => {
    if (problems.length < MAX_PROBLEMS) problems.push(message);
  };
  const text = (value) => typeof value === "string" && value.trim().length > 0 && value === value.trim();

  if (payload.schemaVersion !== SCHEMA_VERSION) add(`schemaVersion must be ${SCHEMA_VERSION}.`);
  if (!text(payload.gameVersion)) add("gameVersion is missing.");

  // Checks what every item of a list has, and returns the items by id.
  // Ids and aliases are all names of their list: each one names a single item.
  const checkList = (key, kind, idPattern = NAME_PATTERN) => {
    const items = payload[key];
    const byId = new Map();
    if (!Array.isArray(items) || items.length === 0) {
      add(`The list ${key} is missing or empty.`);
      return byId;
    }
    const names = new Map();
    const claim = (name, label) => {
      if (names.has(name)) add(`${label}: "${name}" already names ${names.get(name)}.`);
      else names.set(name, label);
    };
    for (const item of items) {
      const label = `${kind} ${item?.id || "?"}`;
      if (typeof item?.id !== "string" || !idPattern.test(item.id)) {
        add(`${label}: invalid id (lowercase letters and digits only).`);
        continue;
      }
      claim(item.id, label);
      byId.set(item.id, item);
      if (!text(item.name)) add(`${label}: missing name.`);
      if (item.labels !== undefined) {
        const labels = item.labels && typeof item.labels === "object" && !Array.isArray(item.labels) ? item.labels : null;
        if (!labels || Object.keys(labels).length === 0) add(`${label}: labels must hold at least one language.`);
        for (const [language, value] of Object.entries(labels ?? {})) {
          if (!LANGUAGES.includes(language)) add(`${label}: unknown label language "${language}".`);
          else if (!text(value)) add(`${label}: empty ${language} label.`);
          else if (value === item.name) add(`${label}: the ${language} label is the same as name, leave it out.`);
        }
      }
      if (item.aliases !== undefined) {
        if (!Array.isArray(item.aliases) || item.aliases.length === 0) {
          add(`${label}: aliases must be a non-empty list.`);
          continue;
        }
        for (const alias of item.aliases) {
          if (typeof alias !== "string" || !NAME_PATTERN.test(alias)) add(`${label}: invalid alias "${String(alias).slice(0, 40)}" (lowercase letters and digits only).`);
          else claim(alias, label);
        }
      }
    }
    return byId;
  };
  const refers = (item, field, targets, kind) => {
    if (!targets.has(item[field])) add(`${kind} ${item.id}: unknown ${field} "${item[field]}".`);
  };

  const countries = checkList("countries", "Country", COUNTRY_ID_PATTERN);
  for (const country of countries.values()) {
    if (country.flag !== undefined && country.flag !== false) add(`Country ${country.id}: flag is only written as false, for a nationality without a flag.`);
  }
  const surfaces = checkList("surfaces", "Surface");
  const locations = checkList("locations", "Location");
  for (const location of locations.values()) {
    refers(location, "country", countries, "Location");
    const shares = location.surfaces && typeof location.surfaces === "object" && !Array.isArray(location.surfaces) ? Object.entries(location.surfaces) : [];
    if (shares.length === 0) add(`Location ${location.id}: surfaces must give the share of each surface in percent.`);
    for (const [surface, share] of shares) {
      if (!surfaces.has(surface)) add(`Location ${location.id}: unknown surface "${surface}".`);
      if (!Number.isInteger(share) || share <= 0) add(`Location ${location.id}: the share of "${surface}" must be a whole percentage.`);
    }
    const total = shares.reduce((sum, [, share]) => sum + (Number(share) || 0), 0);
    if (shares.length > 0 && total !== 100) add(`Location ${location.id}: surface shares add up to ${total}, not 100.`);
  }

  const tracks = checkList("tracks", "Track");
  for (const track of tracks.values()) refers(track, "location", locations, "Track");
  const stages = checkList("stages", "Stage");
  for (const stage of stages.values()) {
    refers(stage, "track", tracks, "Stage");
    if (stage.shortName !== undefined && (!text(stage.shortName) || stage.shortName === stage.name)) {
      add(`Stage ${stage.id}: shortName must be a short name different from name, or left out.`);
    }
    if (!(typeof stage.lengthKm === "number" && stage.lengthKm > 0)) add(`Stage ${stage.id}: lengthKm must be a positive number.`);
  }
  for (const track of tracks.values()) {
    if (![...stages.values()].some((stage) => stage.track === track.id)) add(`Track ${track.id}: no stage.`);
  }

  const groups = checkList("groups", "Group");
  const classes = checkList("classes", "Class");
  for (const carClass of classes.values()) refers(carClass, "group", groups, "Class");
  const cars = checkList("cars", "Car");
  for (const car of cars.values()) {
    refers(car, "class", classes, "Car");
    refers(car, "group", groups, "Car");
    if (classes.has(car.class) && classes.get(car.class).group !== car.group) add(`Car ${car.id}: its group is not the group of its class.`);
    for (const field of ["manufacturer", "drivetrain"]) if (!text(car[field])) add(`Car ${car.id}: missing ${field}.`);
  }

  checkList("modes", "Mode");
  const weather = checkList("weather", "Weather");
  checkChallenges(payload, { stages, cars, weather }, add, text);
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
  const count = (key) => `${payload[key].length} ${key}`;
  console.log(`${file}: OK for game ${payload.gameVersion} (${["locations", "tracks", "stages", "cars", "countries"].map(count).join(", ")}).`);
}

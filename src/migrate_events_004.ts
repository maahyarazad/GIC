/**
 * One-off migration for feature 004 (Events – direct attendance confirmation).
 *
 * Converts feature 003's board meeting requests to event attendances:
 *   approved                                  → confirmed (the invitation outcome becomes the confirmation outcome)
 *   pending, upcoming event, seat available   → confirmed (oldest first, up to capacity)
 *   pending, over capacity or past event      → cancelled (listed so the admin can contact them)
 *   declined                                  → cancelled
 * then recomputes every event's confirmedCount, drops the 003-only fields and indexes, and
 * points the site-data nav link from /boardroom to /events.
 *
 * Dry run by default; idempotent (a second --apply reports 0 changes).
 *
 *   npx tsx src/migrate_events_004.ts                    # dry run
 *   npx tsx src/migrate_events_004.ts --apply            # write
 *   npx tsx src/migrate_events_004.ts --apply --notify   # also email migrated pending → confirmed members
 *   npx tsx src/migrate_events_004.ts --recount [--apply] # only recompute confirmedCount
 */
import path from "path";
import fs from "fs/promises";
import { connectToDatabase, closeDatabaseConnection, getCollection } from "./db";
import { EventAttendanceModel } from "./models/eventAttendance.model";
import { sendConfirmation } from "./services/eventNotifications";

const APPLY = process.argv.includes("--apply");
const NOTIFY = process.argv.includes("--notify");
const RECOUNT_ONLY = process.argv.includes("--recount");

const BLUEPRINT_PATH = path.join(process.cwd(), "file_storage", "client_blueprint.json");

type Move = {
  id: unknown;
  from: string;
  to: "confirmed" | "cancelled";
  confirmation: Record<string, unknown> | null;
  reason?: string;
  row: any;
};

const NOT_SENT = { status: "not_sent", attemptedAt: null, error: null };

const label = (event: any) =>
  `${new Date(event.startsAt).toISOString().slice(0, 16).replace("T", " ")}Z  ${event.title}`;

/**
 * Recomputes confirmedCount for every event; returns the events whose stored value was off.
 * `planned` (dry run only) adds the not-yet-written status moves, so the preview shows final counts.
 */
async function recount(planned: Move[] = []): Promise<number> {
  const events = getCollection("boardmeetings");
  const attendances = getCollection("boardmeetingrequests");

  let drift = 0;
  for (const event of await events.find().toArray()) {
    const stored = await attendances.countDocuments({ meetingId: event._id, status: "confirmed" });
    const actual = stored + planned.filter((m) => m.to === "confirmed" && String(m.row.meetingId) === String(event._id)).length;
    // A missing field (events created by feature 003) counts as drift, so it gets written.
    if (event.confirmedCount !== actual) {
      drift++;
      console.log(`  ${label(event)}: confirmedCount ${event.confirmedCount ?? "unset"} → ${actual}`);
      if (APPLY) await events.updateOne({ _id: event._id }, { $set: { confirmedCount: actual } });
    }
  }
  console.log(drift === 0 ? "confirmedCount: no drift" : `confirmedCount: ${drift} event(s) ${APPLY ? "fixed" : "would be fixed"}`);
  return drift;
}

/** Plans the status moves for one event's rows (oldest first). */
function planEvent(event: any, rows: any[], now: Date): Move[] {
  const isPast = new Date(event.startsAt).getTime() <= now.getTime();
  const capacity = event.capacity ?? 10;

  // Rows already migrated (and approved ones, which become confirmed) hold seats first.
  let confirmedSoFar = rows.filter((r) => r.status === "confirmed" || r.status === "approved").length;
  const moves: Move[] = [];

  for (const row of rows) {
    if (row.status === "approved") {
      moves.push({
        id: row._id,
        from: "approved",
        to: "confirmed",
        confirmation: row.notifications?.invitation ?? { status: "sent", attemptedAt: row.decision?.at ?? null, error: null },
        row,
      });
    } else if (row.status === "pending") {
      if (!isPast && confirmedSoFar < capacity) {
        confirmedSoFar++;
        moves.push({
          id: row._id,
          from: "pending",
          to: "confirmed",
          confirmation: NOTIFY ? { status: "pending", attemptedAt: null, error: null } : NOT_SENT,
          row,
        });
      } else {
        moves.push({ id: row._id, from: "pending", to: "cancelled", confirmation: NOT_SENT, reason: isPast ? "past event" : "over capacity", row });
      }
    } else if (row.status === "declined") {
      moves.push({ id: row._id, from: "declined", to: "cancelled", confirmation: NOT_SENT, reason: "declined", row });
    }
  }
  return moves;
}

async function migrateStatuses(): Promise<Move[]> {
  const events = getCollection("boardmeetings");
  const attendances = getCollection("boardmeetingrequests");
  const now = new Date();
  const allMoves: Move[] = [];

  for (const event of await events.find().sort({ startsAt: 1 }).toArray()) {
    const rows = await attendances.find({ meetingId: event._id }).sort({ createdAt: 1 }).toArray();
    const moves = planEvent(event, rows, now);
    if (moves.length === 0) continue;

    const count = (status: string) => rows.filter((r) => r.status === status).length;
    const after = (status: "confirmed" | "cancelled") =>
      count(status) + moves.filter((m) => m.to === status).length;
    console.log(
      `  ${label(event)} (capacity ${event.capacity ?? 10}): ` +
      `pending ${count("pending")}, approved ${count("approved")}, declined ${count("declined")} → ` +
      `confirmed ${after("confirmed")}, cancelled ${after("cancelled")}`
    );
    allMoves.push(...moves);
  }

  if (APPLY) {
    for (const move of allMoves) {
      await attendances.updateOne(
        { _id: move.id as any },
        {
          $set: { status: move.to, "notifications.confirmation": move.confirmation },
          $unset: { decision: "", "notifications.receipt": "", "notifications.invitation": "" },
        }
      );
    }
  }

  const cancelled = allMoves.filter((m) => m.to === "cancelled");
  if (cancelled.length > 0) {
    console.log(`\nMembers moved to cancelled (${cancelled.length}):`);
    for (const m of cancelled) {
      console.log(`  ${m.row.reference}  ${m.row.requester?.name} <${m.row.requester?.email}>  (${m.reason})`);
    }
  }
  console.log(allMoves.length === 0 ? "Statuses: 0 changes" : `Statuses: ${allMoves.length} row(s) ${APPLY ? "migrated" : "would be migrated"}`);
  return allMoves;
}

/** Walks the site data for nav entries pointing at /boardroom. */
function patchNavLinks(node: any, changes: string[]): void {
  if (Array.isArray(node)) {
    node.forEach((child) => patchNavLinks(child, changes));
    return;
  }
  if (!node || typeof node !== "object") return;
  if (node.path === "/boardroom") {
    changes.push(`"${node.label}" ${node.path} → "Events" /events`);
    node.label = "Events";
    node.path = "/events";
  }
  for (const key of ["navLinks", "children", "links"]) {
    if (key in node) patchNavLinks(node[key], changes);
  }
}

async function migrateNavLink(): Promise<void> {
  let raw: string;
  try {
    raw = await fs.readFile(BLUEPRINT_PATH, "utf-8");
  } catch {
    console.log(`Nav link: ${BLUEPRINT_PATH} not found – skipped (edit it in Dashboard → Website Data)`);
    return;
  }

  const json = raw.trim() ? JSON.parse(raw) : {};
  const changes: string[] = [];
  patchNavLinks(json.navLinks, changes);

  if (changes.length === 0) {
    console.log("Nav link: 0 changes");
    return;
  }
  changes.forEach((change) => console.log(`  ${change}`));
  if (APPLY) await fs.writeFile(BLUEPRINT_PATH, JSON.stringify(json, null, 2), "utf-8");
  console.log(`Nav link: ${changes.length} entr${changes.length === 1 ? "y" : "ies"} ${APPLY ? "updated" : "would be updated"}`);
}

async function main() {
  console.log(APPLY ? "Mode: APPLY\n" : "Mode: dry run (pass --apply to write)\n");
  await connectToDatabase();

  if (RECOUNT_ONLY) {
    await recount();
    return;
  }

  const moves = await migrateStatuses();
  await recount(APPLY ? [] : moves);

  if (APPLY) {
    // Replaces 003's { status, createdAt } index with { meetingId, status, createdAt }.
    // Targeted rather than syncIndexes(), which drops and rebuilds every index whose options
    // differ, leaving a window without the unique { meetingId, userId } guard.
    const attendances = getCollection("boardmeetingrequests");
    const legacyIndex = "status_1_createdAt_-1";
    if (await attendances.indexExists(legacyIndex)) {
      await attendances.dropIndex(legacyIndex);
      console.log(`Index dropped: ${legacyIndex}`);
    }
    await EventAttendanceModel.createIndexes();
    console.log("Indexes ensured");
  }

  await migrateNavLink();

  const toNotify = moves.filter((m) => m.from === "pending" && m.to === "confirmed");
  if (NOTIFY && toNotify.length > 0) {
    if (!APPLY) {
      console.log(`\n--notify: ${toNotify.length} confirmation email(s) would be sent`);
    } else {
      console.log(`\nSending ${toNotify.length} confirmation email(s):`);
      for (const move of toNotify) {
        console.log(`  ${move.row.reference}  ${move.row.requester?.email}: ${await sendConfirmation(move.id)}`);
      }
    }
  }
}

main()
  .catch((error) => {
    console.error("Events migration failed:", error);
    process.exitCode = 1;
  })
  .finally(() => closeDatabaseConnection());

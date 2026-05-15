import fs from "fs/promises";
import path from "path";

export async function loadClientBlueprint() {
  try {
    const filePath = path.join(
      process.cwd(),
      "file_storage",
      "client_blueprint.json"
    );

    const raw = await fs.readFile(filePath, "utf-8");

    if (!raw || !raw.trim()) return {};

    return JSON.parse(raw);
  } catch (err) {
    console.error("client_blueprint.json load failed:", err.message);
    return {};
  }
}
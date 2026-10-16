import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "dist");

// Build if dist does not exist
if (!existsSync(distDir)) {
  console.log("Generating dist with build.mjs...");
  spawnSync(process.execPath, [join(__dirname, "build.mjs")], { stdio: "inherit" });
}

const app = express();
const port = parseInt(process.env.PORT || "3000", 10);
const host = process.env.HOST || "0.0.0.0";

app.use(express.static(distDir));

app.get("*", (req, res) => {
  res.sendFile(join(distDir, "index.html"));
});

app.listen(port, host, () => {
  console.log(`JAMFLEX server running at http://${host}:${port}`);
});

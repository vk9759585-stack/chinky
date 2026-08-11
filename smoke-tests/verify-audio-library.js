const fs = require("fs");
const path = require("path");
const catalog = require("../data/audioCatalog");

const audioRoot = path.resolve(__dirname, "..", "audio-library");
const keys = new Set();
const files = new Set();

if (!fs.existsSync(path.join(audioRoot, "LICENSE.md"))) {
  throw new Error("Audio library license is missing");
}

for (const item of catalog) {
  if (keys.has(item.key)) throw new Error(`Duplicate audio key: ${item.key}`);
  if (files.has(item.file)) throw new Error(`Duplicate audio file: ${item.file}`);
  if (!["music", "shorts", "shayari"].includes(item.category)) {
    throw new Error(`Invalid audio category: ${item.category}`);
  }
  keys.add(item.key);
  files.add(item.file);

  const filePath = path.join(audioRoot, item.file);
  const data = fs.readFileSync(filePath);
  if (data.length < 44 || data.toString("ascii", 0, 4) !== "RIFF" || data.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error(`Invalid WAV file: ${item.file}`);
  }
  const byteRate = data.readUInt32LE(28);
  const dataSize = data.readUInt32LE(40);
  const actualDuration = dataSize / byteRate;
  if (Math.abs(actualDuration - item.duration) > 0.1) {
    throw new Error(`Duration mismatch for ${item.file}: ${actualDuration}s`);
  }
}

process.stdout.write(`Audio library verified (${catalog.length} original tracks).\n`);

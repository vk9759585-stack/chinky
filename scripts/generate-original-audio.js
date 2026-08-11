const fs = require("fs");
const path = require("path");
const catalog = require("../data/audioCatalog");

const sampleRate = 16000;
const outputDirectory = path.resolve(__dirname, "..", "audio-library");

const trackSettings = {
  "udaan-beat": { root: 220, bpm: 112, style: "beat", progression: [0, 5, 7, 3] },
  "sukoon-lofi": { root: 196, bpm: 76, style: "lofi", progression: [0, 3, 5, 2] },
  "raat-chill": { root: 174.61, bpm: 82, style: "ambient", progression: [0, 5, 2, 7] },
  "quick-pop": { root: 261.63, bpm: 132, style: "pop", progression: [0, 7, 5, 7] },
  "comedy-bounce": { root: 233.08, bpm: 124, style: "bounce", progression: [0, 4, 7, 10] },
  "reveal-rise": { root: 164.81, bpm: 96, style: "rise", progression: [0, 2, 5, 9] },
  "alfaaz-piano": { root: 220, bpm: 64, style: "piano", progression: [0, 3, 7, 5] },
  "dil-ki-baat": { root: 196, bpm: 68, style: "piano", progression: [0, 5, 3, 7] },
  "khamoshi-ambient": { root: 146.83, bpm: 58, style: "ambient", progression: [0, 7, 5, 2] }
};

const semitone = (root, amount) => root * Math.pow(2, amount / 12);
const smooth = (value) => value * value * (3 - 2 * value);

function envelope(phase, attack = 0.08, release = 0.18) {
  if (phase < attack) return smooth(phase / attack);
  if (phase > 1 - release) return smooth((1 - phase) / release);
  return 1;
}

function seededNoise(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff * 2 - 1;
  };
}

function renderTrack(item) {
  const settings = trackSettings[item.key];
  const sampleCount = Math.floor(item.duration * sampleRate);
  const pcm = Buffer.alloc(sampleCount * 2);
  const beatSeconds = 60 / settings.bpm;
  const random = seededNoise(item.key.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0));

  for (let i = 0; i < sampleCount; i += 1) {
    const time = i / sampleRate;
    const beat = time / beatSeconds;
    const beatIndex = Math.floor(beat);
    const beatPhase = beat - beatIndex;
    const barIndex = Math.floor(beatIndex / 4);
    const chordOffset = settings.progression[barIndex % settings.progression.length];
    const root = semitone(settings.root, chordOffset);
    const third = semitone(root, settings.style === "piano" || settings.style === "ambient" ? 3 : 4);
    const fifth = semitone(root, 7);
    let value = 0;

    const pad =
      Math.sin(2 * Math.PI * root * time) * 0.17 +
      Math.sin(2 * Math.PI * third * time) * 0.11 +
      Math.sin(2 * Math.PI * fifth * time) * 0.09;

    if (["ambient", "piano", "lofi"].includes(settings.style)) {
      const pulse = envelope(beatPhase, 0.04, settings.style === "ambient" ? 0.65 : 0.45);
      const noteChoice = [root, third, fifth, semitone(root, 12)][beatIndex % 4];
      const bell = Math.sin(2 * Math.PI * noteChoice * time) * pulse * 0.28;
      const air = random() * 0.012;
      value = pad * (settings.style === "ambient" ? 0.7 : 0.46) + bell + air;
    } else {
      const kickPhase = beatPhase * beatSeconds;
      const kickFrequency = 90 - Math.min(kickPhase * 90, 48);
      const kick = Math.sin(2 * Math.PI * kickFrequency * kickPhase) * Math.exp(-kickPhase * 16) * 0.48;
      const hatPhase = (beat * 2) % 1;
      const hat = random() * Math.exp(-hatPhase * 28) * 0.09;
      const bass = Math.sin(2 * Math.PI * root / 2 * time) * 0.22;
      const leadFrequency = [root, fifth, third, semitone(root, 12)][beatIndex % 4];
      const lead = Math.sin(2 * Math.PI * leadFrequency * time) * envelope(beatPhase, 0.03, 0.45) * 0.18;
      value = kick + hat + bass + lead + pad * 0.28;

      if (settings.style === "rise") {
        const rise = time / item.duration;
        value += random() * rise * rise * 0.13;
      }
      if (settings.style === "bounce") {
        value += Math.sin(2 * Math.PI * semitone(root, 12) * time) * envelope(beatPhase, 0.02, 0.7) * 0.1;
      }
    }

    const fadeIn = Math.min(time / 0.08, 1);
    const fadeOut = Math.min((item.duration - time) / 0.18, 1);
    const mastered = Math.tanh(value * 1.25) * Math.max(0, Math.min(fadeIn, fadeOut));
    pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, mastered)) * 32767), i * 2);
  }

  return wav(pcm);
}

function wav(pcm) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

fs.mkdirSync(outputDirectory, { recursive: true });
for (const item of catalog) {
  const target = path.join(outputDirectory, item.file);
  fs.writeFileSync(target, renderTrack(item));
  process.stdout.write(`Generated ${item.file} (${item.duration}s)\n`);
}

// Procedural ambient score for the tour video (no downloaded music): warm pad chords + soft bell/piano-like arpeggio +
// sub bass, through a small stereo Schroeder reverb. Deterministic (seeded). 48 kHz 16-bit stereo WAV.
//   node tools/tour_music.mjs out.wav 480      (or import { writeMusic })
import fs from 'node:fs';

export function writeMusic(file, seconds, { sr = 48000, bpm = 66 } = {}) {
  const N = Math.ceil(seconds * sr), L = new Float32Array(N), R = new Float32Array(N);
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // D major, gentle: Dmaj9 · Bm11 · Gmaj9 · A6sus · (repeat) — midi notes of each chord (low → high)
  const prog = [[50, 57, 61, 64, 66, 69], [47, 54, 57, 62, 64, 66], [43, 50, 54, 57, 59, 62], [45, 52, 57, 59, 62, 64],
                [50, 57, 62, 66, 69, 71], [47, 54, 59, 62, 66, 69], [43, 55, 59, 62, 66, 67], [45, 52, 57, 61, 64, 66]];
  const beat = 60 / bpm, bar = beat * 4, chordLen = bar * 2;   // ≈ 7.3 s per chord
  const TAU = 2 * Math.PI;
  const nCh = Math.ceil(seconds / chordLen) + 1;
  // pad: each chord crossfades into the next with long raised-cosine envelopes; slightly detuned pairs = chorus
  for (let c = 0; c < nCh; c++) {
    const ch = prog[c % prog.length], t0 = c * chordLen - 1.5, len = chordLen + 3.0;
    const s0 = Math.max(0, Math.floor(t0 * sr)), s1 = Math.min(N, Math.floor((t0 + len) * sr));
    for (let v = 1; v < ch.length; v++) {
      const f = hz(ch[v]), amp = 0.045 / (1 + (v - 1) * 0.18), pan = (v % 2 ? -0.35 : 0.35) * (v / ch.length), ph1 = rnd() * TAU, ph2 = rnd() * TAU;
      for (let s = s0; s < s1; s++) {
        const t = s / sr, u = (t - t0) / len, env = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 1.6);
        const lfo = 1 + 0.12 * Math.sin(TAU * 0.11 * t + v);
        const x = (Math.sin(TAU * f * 1.0015 * t + ph1) + Math.sin(TAU * f * 0.9985 * t + ph2) + 0.18 * Math.sin(TAU * 2 * f * t)) * amp * env * lfo;
        L[s] += x * (1 - pan); R[s] += x * (1 + pan);
      }
    }
    // sub bass: root, slow swell
    const fb = hz(ch[0] - 12);
    for (let s = s0; s < s1; s++) { const t = s / sr, u = (t - t0) / len, env = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 2); const x = Math.sin(TAU * fb * t) * 0.07 * env; L[s] += x; R[s] += x; }
    // soft bell / piano arpeggio: 8th notes on beats with gentle velocities, upper octave, fast attack, exponential decay
    const pattern = [1, 3, 2, 4, 5, 3, 4, 2];
    for (let k = 0; k < 8; k++) {
      if (rnd() < 0.28) continue;                      // leave space
      const tn = c * chordLen + k * beat + 0.04 * rnd();
      const m = ch[pattern[k] % ch.length] + 12, f = hz(m), vel = 0.035 + 0.03 * rnd(), pan = rnd() * 0.8 - 0.4;
      const a = Math.floor(tn * sr), b = Math.min(N, a + Math.floor(4.0 * sr));
      for (let s = Math.max(0, a); s < b; s++) {
        const t = (s - a) / sr, att = Math.min(1, t / 0.006), e1 = Math.exp(-t / 1.1), e2 = Math.exp(-t / 0.25);
        const x = vel * att * (Math.sin(TAU * f * t) * e1 + 0.22 * Math.sin(TAU * 2 * f * t) * e2 + 0.06 * Math.sin(TAU * 3.01 * f * t) * e2);
        L[s] += x * (1 - pan); R[s] += x * (1 + pan);
      }
    }
  }
  // stereo Schroeder reverb (4 combs + 2 allpasses per side), 30 % wet
  const verb = (inp, off) => {
    const out = new Float32Array(N), combs = [1557, 1617, 1491, 1422].map(d => Math.round((d + off) * sr / 44100));
    for (const d of combs) { const buf = new Float32Array(d); let i = 0, lp = 0; for (let s = 0; s < N; s++) { const y = buf[i]; lp = y * 0.6 + lp * 0.4; buf[i] = inp[s] + lp * 0.84; out[s] += y * 0.25; i = (i + 1) % d; } }
    for (const d0 of [556, 441]) { const d = Math.round((d0 + off) * sr / 44100), buf = new Float32Array(d); let i = 0; for (let s = 0; s < N; s++) { const bo = buf[i], y = -out[s] + bo; buf[i] = out[s] + bo * 0.5; out[s] = y; i = (i + 1) % d; } }
    return out;
  };
  const vl = verb(L, 0), vr = verb(R, 23);
  let peak = 0;
  for (let s = 0; s < N; s++) { L[s] = L[s] * 0.75 + vl[s] * 0.32; R[s] = R[s] * 0.75 + vr[s] * 0.32; peak = Math.max(peak, Math.abs(L[s]), Math.abs(R[s])); }
  // master: normalise to −6 dBFS peak, 3 s fade in, 5 s fade out
  const g = 0.5 / (peak || 1), fin = 3 * sr, fout = 5 * sr;
  const pcm = Buffer.alloc(44 + N * 4);
  for (let s = 0; s < N; s++) {
    const f = Math.min(1, s / fin, (N - s) / fout), e = f * f * (3 - 2 * f);
    pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[s] * g * e)) * 32767), 44 + s * 4);
    pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[s] * g * e)) * 32767), 46 + s * 4);
  }
  pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + N * 4, 4); pcm.write('WAVE', 8); pcm.write('fmt ', 12); pcm.writeUInt32LE(16, 16);
  pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(2, 22); pcm.writeUInt32LE(sr, 24); pcm.writeUInt32LE(sr * 4, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34);
  pcm.write('data', 36); pcm.writeUInt32LE(N * 4, 40);
  fs.writeFileSync(file, pcm);
  return file;
}

if (process.argv[1] && process.argv[1].endsWith('tour_music.mjs')) { const f = process.argv[2] || 'music.wav'; writeMusic(f, +(process.argv[3] || 60)); console.log('wrote', f); }

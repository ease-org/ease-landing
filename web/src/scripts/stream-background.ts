/**
 * The hero's background: bundles of strands drifting right to left, drawn as Gaussian-process
 * posteriors.
 *
 * Every strand is a sample from a squared-exponential GP prior (random Fourier features, so
 * the field is stationary and infinite), and the whole field moves at a constant speed.
 * Observations (pins) ride along with it. Right of "today" a pin is not yet observed: its
 * noise is effectively infinite and the strands spread as the prior does. As it crosses
 * today its noise falls smoothly to zero, and the strands are pulled onto the lived line
 * there by Matheron's rule, f_post(x) = f(x) + k(x, P) (K + N)⁻¹ (y − f(P)). So the future
 * fans out on the right and collapses into the lived path as it becomes the past, the same
 * picture as the app's future stream. No pin ever appears or vanishes abruptly, so nothing
 * pops.
 *
 * Quiet on purpose: slow, faint, masked away from the text, paused when off-screen or when
 * the tab is hidden, one still frame under prefers-reduced-motion, and a pause control
 * (WCAG 2.2.2).
 */

type Rng = () => number;

function mulberry32(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng: Rng): number {
  const u = Math.max(1e-12, rng());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/** A sample path of a zero-mean SE-kernel GP, via M random Fourier features. */
class GpSample {
  private w: Float64Array;
  private p: Float64Array;
  private a: Float64Array;
  private scale: number;
  constructor(rng: Rng, lengthscale: number, sigma: number, m = 20) {
    this.w = new Float64Array(m);
    this.p = new Float64Array(m);
    this.a = new Float64Array(m);
    for (let i = 0; i < m; i++) {
      this.w[i] = gauss(rng) / lengthscale;
      this.p[i] = rng() * 2 * Math.PI;
      this.a[i] = gauss(rng);
    }
    this.scale = sigma * Math.sqrt(2 / m);
  }
  at(u: number): number {
    let s = 0;
    for (let i = 0; i < this.w.length; i++) s += this.a[i] * Math.cos(this.w[i] * u + this.p[i]);
    return this.scale * s;
  }
}

/** Cholesky solve for a small SPD system, in place on copies. */
function cholesky(K: number[][]): number[][] {
  const n = K.length;
  const L = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = K[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      L[i][j] = i === j ? Math.sqrt(Math.max(s, 1e-9)) : s / L[j][j];
    }
  }
  return L;
}
function cholSolve(L: number[][], b: number[]): number[] {
  const n = b.length;
  const y = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    let s = b[i];
    for (let k = 0; k < i; k++) s -= L[i][k] * y[k];
    y[i] = s / L[i][i];
  }
  const x = new Array<number>(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i];
    for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k];
    x[i] = s / L[i][i];
  }
  return x;
}

const sstep = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};

interface BundleSpec {
  y: number;          // centre, as a fraction of the height
  lengthscale: number; // px
  sigma: number;      // prior std, px
  speed: number;      // px per second, right to left
  strands: number;
  alpha: number;      // overall opacity of the bundle
  seed: number;
}

class Bundle {
  private rng: Rng;
  private lived: GpSample;
  private strands: { f: GpSample; accent: boolean }[];
  private pins: number[] = []; // world positions
  private nextPin: number;
  constructor(readonly spec: BundleSpec) {
    this.rng = mulberry32(spec.seed);
    this.lived = new GpSample(this.rng, spec.lengthscale * 1.3, spec.sigma * 0.55);
    this.strands = Array.from({ length: spec.strands }, (_, i) => ({
      f: new GpSample(this.rng, spec.lengthscale, spec.sigma),
      accent: i < 2,
    }));
    this.nextPin = -spec.lengthscale * 6;
  }

  /** Keep pins covering [left, right] in world coordinates, spaced one to two and a half lengthscales. */
  private refill(left: number, right: number) {
    const l = this.spec.lengthscale;
    this.pins = this.pins.filter((u) => u > left - 4 * l);
    if (this.nextPin < left - 4 * l) this.nextPin = left - 4 * l;
    while (this.nextPin < right + 4 * l) {
      this.pins.push(this.nextPin);
      this.nextPin += l * (1 + 1.5 * this.rng());
    }
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, todayX: number, colors: Colors) {
    const { lengthscale: l, sigma, speed, alpha } = this.spec;
    const shift = speed * t;            // world u = screen x + shift
    const cy = this.spec.y * h;
    this.refill(shift, w + shift);

    // Observation weight: 0 right of today (unobserved), 1 once a pin is a lengthscale past it.
    const active: { u: number; noise: number }[] = [];
    for (const u of this.pins) {
      const x = u - shift;
      const wgt = sstep((todayX - x) / l + 0.35);
      if (wgt < 1e-3) continue;
      const noise = sigma * sigma * (1 / wgt - 1) + 0.25;
      active.push({ u, noise });
    }
    const k = (d: number) => sigma * sigma * Math.exp((-d * d) / (2 * l * l));
    const n = active.length;
    let L: number[][] | null = null;
    if (n > 0) {
      const K = active.map((a, i) => active.map((b, j) => k(a.u - b.u) + (i === j ? a.noise : 0)));
      L = cholesky(K);
    }
    const yP = active.map((a) => this.lived.at(a.u));

    // Samples across the width, and the kernel row against the active pins at each.
    const step = 14;
    const xs: number[] = [];
    for (let x = -step; x <= w + step; x += step) xs.push(x);
    const kx = xs.map((x) => active.map((a) => k(x + shift - a.u)));

    // The strands: posterior samples.
    for (const s of this.strands) {
      const alphaVec = L ? cholSolve(L, active.map((a, j) => yP[j] - s.f.at(a.u))) : [];
      ctx.beginPath();
      xs.forEach((x, i) => {
        let v = s.f.at(x + shift);
        for (let j = 0; j < n; j++) v += kx[i][j] * alphaVec[j];
        const y = cy + v;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = s.accent ? colors.deep : colors.mid;
      ctx.globalAlpha = alpha * (s.accent ? 0.55 : 0.28);
      ctx.lineWidth = s.accent ? 1.5 : 1;
      ctx.stroke();
    }

    // The lived line and its observations, left of today only.
    ctx.beginPath();
    let started = false;
    for (const x of xs) {
      if (x > todayX) break;
      const y = cy + this.lived.at(x + shift);
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = colors.deep;
    ctx.globalAlpha = alpha * 0.6;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = colors.deep;
    for (const a of active) {
      const x = a.u - shift;
      if (x < -4 || x > todayX) continue;
      ctx.globalAlpha = alpha * 0.75 * sstep((todayX - x) / (0.6 * l));
      ctx.beginPath();
      ctx.arc(x, cy + this.lived.at(a.u), 2.6, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

interface Colors { mid: string; deep: string; ground: string }

export function startStreamBackground(canvas: HTMLCanvasElement, toggle: HTMLButtonElement | null) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const css = getComputedStyle(document.documentElement);
  const colors: Colors = {
    mid: css.getPropertyValue("--ice-mid").trim() || "#7fb3d8",
    deep: css.getPropertyValue("--ice-deep").trim() || "#3d7db2",
    ground: css.getPropertyValue("--ground").trim() || "#fbf6ed",
  };
  const bundles = [
    new Bundle({ y: 0.2, lengthscale: 120, sigma: 38, speed: 16, strands: 12, alpha: 0.9, seed: 7 }),
    new Bundle({ y: 0.5, lengthscale: 170, sigma: 52, speed: 10, strands: 10, alpha: 0.55, seed: 19 }),
    new Bundle({ y: 0.8, lengthscale: 95, sigma: 30, speed: 22, strands: 12, alpha: 0.8, seed: 31 }),
  ];

  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  let paused = false;
  try { paused = localStorage.getItem("ease-motion") === "paused"; } catch { /* storage may be blocked */ }
  let visible = true;
  let w = 0, h = 0, dpr = 1;
  let clock = 40;           // seconds of flow already "elapsed", so the first frame is a full field
  let last = 0;
  let intro = 0;            // 0 → 1 over the first seconds: the strands flow in from the right
  let raf = 0;

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    frame();
  };

  const todayX = () => (w < 640 ? w * 0.62 : w * 0.583);

  function frame() {
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, w, h);
    for (const b of bundles) b.draw(ctx!, w, h, clock, todayX(), colors);
    if (intro < 1) {
      // Reveal from the right with a soft leading edge.
      const edge = w * (1 - sstep(intro));
      const g = ctx!.createLinearGradient(edge - 160, 0, edge, 0);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,1)");
      ctx!.globalCompositeOperation = "destination-in";
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, w, h);
      ctx!.globalCompositeOperation = "source-over";
    }
  }

  const running = () => !paused && visible && !reduce.matches && document.visibilityState === "visible";

  function loop(now: number) {
    raf = 0;
    if (!running()) return;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    // About 30 frames a second is plenty for something this slow.
    if (last && now - last < 32) { raf = requestAnimationFrame(loop); return; }
    last = now;
    clock += dt;
    if (intro < 1) intro = Math.min(1, intro + dt / 2.6);
    frame();
    raf = requestAnimationFrame(loop);
  }
  const kick = () => {
    if (running() && !raf) { last = 0; raf = requestAnimationFrame(loop); }
  };

  const syncToggle = () => {
    if (!toggle) return;
    toggle.hidden = reduce.matches;
    toggle.textContent = paused ? (toggle.dataset.play ?? "Play background motion") : (toggle.dataset.pause ?? "Pause background motion");
    toggle.setAttribute("aria-pressed", String(paused));
  };
  toggle?.addEventListener("click", () => {
    paused = !paused;
    try { localStorage.setItem("ease-motion", paused ? "paused" : "playing"); } catch { /* ignore */ }
    if (paused) intro = 1;
    syncToggle();
    frame();
    kick();
  });

  if (reduce.matches || paused) intro = 1;
  reduce.addEventListener?.("change", () => { if (reduce.matches) intro = 1; syncToggle(); frame(); kick(); });
  document.addEventListener("visibilitychange", kick);
  new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    kick();
  }).observe(canvas);
  new ResizeObserver(resize).observe(canvas);

  syncToggle();
  resize();
  kick();
}

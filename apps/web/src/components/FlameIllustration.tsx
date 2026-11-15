import { useEffect, useRef } from "react";

/*
 * ILLUSTRATIVE ANIMATION, NOT A PHYSICAL SIMULATION.
 * A particle sketch of the challenge's opening idea: with buoyancy a flame is a
 * flickering teardrop; without it, a diffusion-fed sphere. The left emitter is a
 * 1 g reference; the right one follows the gravity label chosen in the brief.
 * Nothing here is computed from data and nothing feeds the analysis.
 */

const COLORS: [number, number, number][] = [
  [255, 246, 228], // white-hot core
  [255, 206, 104], // yellow soot
  [255, 136, 60], // orange
  [196, 66, 34], // cooling soot
  [92, 156, 255], // blue
  [58, 98, 214], // deep blue edge
];

/** Display-only mapping of gravity labels to a relative buoyancy for the sketch. */
const GRAVITY: Record<string, number> = { microgravity: 0, lunar: 0.166, martian: 0.38, earth: 1 };

export function sketchGravity(label: string | null): number | null {
  if (!label) return null;
  return GRAVITY[label.trim().toLowerCase()] ?? null;
}

/*
 * Budget. The glow is made of soft, blurred sprites, so it is drawn at a reduced
 * internal resolution and scaled up by CSS; the loss is not visible but the
 * pixel work drops several times. Particle spawn is cut and capped, with each
 * particle brighter so the flame keeps its look.
 */
const RENDER_SCALE = 0.6; // canvas pixels per CSS pixel, independent of devicePixelRatio
const SPAWN_BASE = 3; // was 7 per emitter per step
const ALPHA_BOOST = 2.1;
const MAX_PARTICLES = 500; // per emitter
const STEP_MS = 1000 / 60;

interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; seed: number }

function makeSprites(): HTMLCanvasElement[] {
  return COLORS.map(([r, g, b]) => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const x = c.getContext("2d")!;
    const grad = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, `rgba(${r},${g},${b},0.9)`);
    grad.addColorStop(0.35, `rgba(${r},${g},${b},0.35)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = grad;
    x.fillRect(0, 0, 64, 64);
    return c;
  });
}

function pickColor(t: number, micro: number): number {
  if (t < 0.06) return 0;
  if (micro > 0.6) {
    if (t < 0.55) return 4;
    if (t < 0.8) return Math.random() < micro * 0.85 ? 5 : 2;
    return Math.random() < 0.25 ? 3 : 5;
  }
  if (t < 0.35) return micro > 0.3 && Math.random() < micro ? 4 : 1;
  if (t < 0.7) return 2;
  return 3;
}

function FlameCanvas({ g, o2, flow, label }: { g: number; o2: number; flow: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const params = useRef({ g, o2, flow });
  params.current = { g, o2, flow };

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d", { alpha: true, desynchronized: true });
    if (!canvas || !ctx) return;
    const sprites = makeSprites();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0, frame = 0, lastStep = 0;
    const emitters: { particles: Particle[]; fixedG: number | null }[] = [{ particles: [], fixedG: 1 }, { particles: [], fixedG: null }];

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      if (Math.abs(r.width - w) < 0.5 && Math.abs(r.height - h) < 0.5) return;
      w = r.width; h = r.height;
      canvas.width = Math.max(1, Math.round(w * RENDER_SCALE)); canvas.height = Math.max(1, Math.round(h * RENDER_SCALE));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const step = () => {
      frame++;
      const { o2: O, g: G, flow: F } = params.current;
      ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      const scale = Math.min(w / 2, h) / 210; // smaller flames: room to breathe in a narrow column
      const o2k = 0.55 + Math.min(O, 100) / 55;

      emitters.forEach((em, idx) => {
        const gg = em.fixedG ?? G;
        const micro = 1 - Math.min(1, gg);
        const cx = (w / 4) * (idx === 0 ? 1 : 3);
        const cy = h * (0.42 + 0.22 * (1 - micro));
        const flowPx = (em.fixedG ? 0 : F) * 0.0016 * scale;
        const spawn = em.particles.length < MAX_PARTICLES ? Math.round(SPAWN_BASE * o2k) : 0;
        for (let i = 0; i < spawn; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = (0.55 + Math.random() * 0.7) * scale * o2k * (0.5 + micro * 0.6);
          em.particles.push({
            x: cx + Math.cos(a) * 4 * scale, y: cy + Math.sin(a) * 4 * scale,
            vx: Math.cos(a) * sp * (1 - 0.65 * (1 - micro)), vy: Math.sin(a) * sp * (1 - 0.5 * (1 - micro)),
            life: 0, max: (48 + Math.random() * 36) * (1 + micro * 0.5), seed: Math.random() * 6.28,
          });
        }
        const buoy = 0.045 * gg * scale;
        const flicker = gg > 0.25 ? Math.sin(frame * 0.32 + idx) * 0.06 * gg * scale : 0;
        const ps = em.particles;
        const sizeK = scale * (0.8 + 0.25 * o2k);
        // Fewer particles than the original sketch, so each one carries proportionally more light.
        const alphaK = (micro > 0.6 ? 0.15 : 0.17) * ALPHA_BOOST;
        let n = 0;
        for (let i = 0; i < ps.length; i++) {
          const p = ps[i]!;
          p.life++;
          const t = p.life / p.max;
          if (t >= 1) continue;
          p.vy -= buoy;
          p.vx += flowPx + flicker * Math.sin(p.seed + p.life * 0.2);
          if (gg > 0.2) p.vx += (cx - p.x) * 0.0028 * gg;
          p.vx *= 0.985; p.vy *= 0.985;
          p.x += p.vx; p.y += p.vy;
          const size = (8 + 26 * Math.sin(Math.PI * Math.min(1, t * 1.1))) * sizeK;
          ctx.globalAlpha = Math.sin(Math.PI * t) * alphaK;
          ctx.drawImage(sprites[pickColor(t, micro)]!, p.x - size / 2, p.y - size / 2, size, size);
          ps[n++] = p;
        }
        ps.length = n;
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(20,10,10,0.9)";
        ctx.beginPath(); ctx.arc(cx, cy, 3.2 * scale, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = "lighter";
      });
      ctx.globalAlpha = 1;
    };

    let io: IntersectionObserver | undefined;
    if (reduce) {
      for (let i = 0; i < 90; i++) step();
    } else {
      // A few frames up front so a throttled or freshly opened view never shows an empty tile.
      for (let i = 0; i < 60; i++) step();
      // The sketch advances per step, so capping steps at 60 Hz keeps its speed and cost
      // the same on 120/144 Hz displays.
      const loop = (now: number) => {
        if (now - lastStep >= STEP_MS - 1) { lastStep = now; step(); }
        raf = requestAnimationFrame(loop);
      };
      io = new IntersectionObserver(([entry]) => {
        cancelAnimationFrame(raf);
        raf = entry?.isIntersecting ? requestAnimationFrame(loop) : 0;
      });
      io.observe(canvas);
    }
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io?.disconnect(); };
  }, []);

  return <canvas ref={ref} className="flame-canvas" role="img" aria-label={label} />;
}

/** Empty-state explainer: Earth flame next to the flame at the gravity chosen in the brief. */
export default function FlameIllustration({ gravityLabel, o2, flow }: { gravityLabel: string | null; o2: number | null; flow: number | null }) {
  const g = sketchGravity(gravityLabel);
  const shownG = g ?? 0;
  const name = g === null ? "microgravity" : gravityLabel!.trim().toLowerCase();
  const shape = shownG < 0.05 ? "near-spherical, diffusion-fed" : shownG < 0.5 ? "squat, weakly buoyant" : "buoyant teardrop";
  return <figure className="flame-ill" aria-labelledby="flame-ill-title">
    <p className="cap flame-title" id="flame-ill-title">Why gravity matters</p>
    <div className="flame-view">
      <FlameCanvas g={shownG} o2={o2 ?? 21} flow={flow ?? 5}
        label={`Illustrative animation: a candle-like flame at 1 g next to one at ${name}. Not a physical simulation.`} />
      <span className="flame-tag">Illustrative · not a simulation</span>
      <div className="flame-lbl l">Earth · 1 g<span>buoyant teardrop</span></div>
      <div className="flame-lbl r">{name[0]!.toUpperCase() + name.slice(1)}{g === null ? "" : ` · ${shownG} g`}<span>{shape}</span></div>
      <i className="flame-divider" aria-hidden="true" />
    </div>
    <figcaption>
      Without buoyancy, hot gases do not rise: the flame becomes a dim sphere fed by diffusion, so Earth results cannot
      simply be reused for habitats. It follows the brief’s gravity, oxygen and flow.
      {g === null && gravityLabel ? ` “${gravityLabel}” has no preset; microgravity is shown.` : ""}
    </figcaption>
  </figure>;
}

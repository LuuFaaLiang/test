/**
 * dev-hero.js — decides IF and WHEN to start the 3D developer scene.
 *
 * Loaded as <script type="module">. Three.js is only downloaded when:
 *   - the stage is near the viewport,
 *   - the device looks capable,
 *   - WebGL is available.
 * Otherwise the static portrait card (the "fallback") stays on screen,
 * so the rest of the page is never blocked or broken.
 */
const stage = document.getElementById("dev-stage");

if (stage) {
  const canvas = stage.querySelector("canvas");
  const status = stage.querySelector("[data-stage-status]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const conn = navigator.connection || {};
  const lowPower =
    conn.saveData === true ||
    /(^|-)2g$/.test(conn.effectiveType || "") ||
    (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);

  const hasWebGL = () => {
    try {
      const c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch { return false; }
  };

  const useFallback = (why) => {
    stage.dataset.state = "fallback";
    if (status) status.textContent = why;
  };

  if (lowPower) useFallback("Showing a lightweight view on this device.");
  else if (!hasWebGL()) useFallback("3D isn't supported in this browser.");
  else {
    const start = async () => {
      stage.dataset.state = "loading";
      try {
        const [THREE, { createWorkspace }] = await Promise.all([
          import("three"),
          import("./dev-scene.js"),
        ]);
        const isSmall = window.matchMedia("(max-width: 640px)").matches;
        const ws = createWorkspace(THREE, canvas, { lowPower: isSmall, faceSrc: stage.dataset.face });

        const fit = () => {
          const r = stage.getBoundingClientRect();
          ws.resize(Math.max(1, r.width), Math.max(1, r.height));
        };
        fit();
        new ResizeObserver(fit).observe(stage);

        stage.dataset.state = "ready";
        if (status) status.textContent = "Interactive 3D developer scene";

        // Reduced motion: render ONE calm frame, no loop.
        if (reduceMotion) { ws.update(0.016, 1.2); ws.render(); return; }

        let running = true, visible = true, last = performance.now(), t = 0;
        let frames = 0, slowSince = 0;
        const loop = (now) => {
          requestAnimationFrame(loop);
          if (!running || !visible || document.hidden) { last = now; return; }
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now; t += dt;
          ws.update(dt, t);
          ws.render();

          // Safety net: if the device can't keep up, drop to the static fallback.
          frames++;
          if (t > 3 && dt > 0.045) { slowSince += dt; } else if (dt < 0.03) { slowSince = Math.max(0, slowSince - dt); }
          if (slowSince > 2.5) { running = false; ws.dispose(); useFallback("Switched to a lighter view for smoother scrolling."); }
        };
        requestAnimationFrame(loop);

        new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.05 }).observe(stage);
      } catch (err) {
        console.warn("[dev-hero] 3D scene failed, using fallback:", err);
        useFallback("3D scene couldn't load.");
      }
    };

    // Wait for the page to be interactive, then start when the stage is near view.
    const kick = () => {
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((es) => {
          if (es.some((e) => e.isIntersecting)) { io.disconnect(); start(); }
        }, { rootMargin: "200px" });
        io.observe(stage);
      } else start();
    };
    if (document.readyState === "complete") kick();
    else window.addEventListener("load", () => setTimeout(kick, 150), { once: true });
  }
}

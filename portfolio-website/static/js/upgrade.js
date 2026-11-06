/* ===== Professional upgrade layer: particles, glow, tilt, magnetic, spotlight ===== */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover)").matches;

  // Navbar scrolled state
  const nav = document.getElementById("navbar");
  const onScroll = () => nav && nav.classList.toggle("scrolled", window.scrollY > 20);
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // Section titles: draw underline when visible
  const io = new IntersectionObserver((es) => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); }
  }), { threshold: 0.6 });
  document.querySelectorAll(".section-title").forEach(t => io.observe(t));

  if (reduce) return;

  // Particle network in hero
  const canvas = document.getElementById("particles");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let w, h, pts = [], mouse = { x: -999, y: -999 };
    const dark = () => document.documentElement.classList.contains("dark");
    const resize = () => {
      w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight;
      const n = Math.min(70, Math.floor(w * h / 18000));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4 }));
    };
    resize(); window.addEventListener("resize", resize);
    canvas.parentElement.addEventListener("mousemove", e => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    let visible = true;
    new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(canvas);
    (function draw() {
      requestAnimationFrame(draw);
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      const c = dark() ? "148,163,255" : "99,102,241";
      pts.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, 6.283); ctx.fillStyle = `rgba(${c},.7)`; ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 120) { ctx.strokeStyle = `rgba(${c},${.22 * (1 - d / 120)})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
        const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (dm < 150) { ctx.strokeStyle = `rgba(124,58,237,${.4 * (1 - dm / 150)})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
      });
    })();
  }

  if (!fine) return;

  // Cursor glow
  const glow = document.getElementById("cursor-glow");
  if (glow) window.addEventListener("mousemove", e => {
    document.body.classList.add("has-glow");
    glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  }, { passive: true });

  // Spotlight + 3D tilt on cards
  document.querySelectorAll(".project-card, .cert-card, .exp-card, .edu-card, .tool-card").forEach(card => {
    card.classList.add("spot");
    card.addEventListener("mousemove", e => {
      const r = card.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty("--mx", x + "px"); card.style.setProperty("--my", y + "px");
      if (card.classList.contains("project-card")) {
        const rx = ((y / r.height) - .5) * -8, ry = ((x / r.width) - .5) * 8;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
      }
    });
    card.addEventListener("mouseleave", () => { card.style.transform = ""; });
  });

  // Magnetic buttons
  document.querySelectorAll(".btn-primary, .btn-secondary, .hero-social a").forEach(b => {
    b.classList.add("magnetic");
    b.addEventListener("mousemove", e => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .28}px)`;
    });
    b.addEventListener("mouseleave", () => { b.style.transform = ""; });
  });
})();

/* ===== KHQR: enlarge dialog + copy pay link ===== */
(() => {
  const dlg = document.getElementById("khqr-dialog");
  const open = document.getElementById("khqr-open");
  if (dlg && open && typeof dlg.showModal === "function") {
    open.addEventListener("click", () => dlg.showModal());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  }
  const copy = document.getElementById("copy-pay-link");
  if (copy) {
    const label = copy.querySelector("span");
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(copy.dataset.link);
        label.textContent = "Link copied";
      } catch {
        label.textContent = "Press Ctrl+C to copy";
        const r = document.createRange(); r.selectNodeContents(label);
      }
      setTimeout(() => (label.textContent = "Copy pay link"), 2200);
    });
  }
})();

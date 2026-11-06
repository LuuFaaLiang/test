document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initAOS();
  initDarkMode();
  initMobileMenu();
  initTypedHero();
  initScrollProgress();
  initScrollSpy();
  initBackToTop();
  initCounters();
  initSkillBars();
  initProjectFilters();
  initCertificateModal();
  initContactForm();
  document.getElementById("year").textContent = new Date().getFullYear();
});

/* ---------- Loading screen ---------- */
function initLoadingScreen() {
  window.addEventListener("load", () => {
    const el = document.getElementById("loading-screen");
    setTimeout(() => el.classList.add("loaded"), 300);
  });
}

/* ---------- AOS ---------- */
function initAOS() {
  if (window.AOS) {
    AOS.init({ duration: 700, once: true, offset: 60 });
  }
}

/* ---------- Dark mode with persisted preference ---------- */
function initDarkMode() {
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (saved === "dark" || (!saved && prefersDark)) root.classList.add("dark");

  toggle.addEventListener("click", () => {
    root.classList.toggle("dark");
    localStorage.setItem("theme", root.classList.contains("dark") ? "dark" : "light");
  });
}

/* ---------- Mobile menu ---------- */
function initMobileMenu() {
  const btn = document.getElementById("mobile-menu-btn");
  const menu = document.getElementById("mobile-menu");
  btn.addEventListener("click", () => {
    const isHidden = menu.classList.toggle("hidden");
    btn.setAttribute("aria-expanded", String(!isHidden));
  });
  menu.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => menu.classList.add("hidden"))
  );
}

/* ---------- Typed.js hero role text ---------- */
function initTypedHero() {
  const el = document.getElementById("typed-role");
  if (!el || !window.Typed) return;
  new Typed(el, {
    strings: ["IT Student", "Python Developer", "Frontend Developer", "Future Software Engineer"],
    typeSpeed: 45,
    backSpeed: 25,
    backDelay: 1400,
    loop: true,
  });
}

/* ---------- Scroll progress bar ---------- */
function initScrollProgress() {
  const bar = document.getElementById("scroll-progress");
  window.addEventListener("scroll", () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = `${docHeight > 0 ? (scrollTop / docHeight) * 100 : 0}%`;
  });
}

/* ---------- Scroll-spy navigation ---------- */
function initScrollSpy() {
  const sections = document.querySelectorAll("main section[id]");
  const links = document.querySelectorAll(".nav-link");
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((link) => {
            link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
          });
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((section) => observer.observe(section));
}

/* ---------- Back to top ---------- */
function initBackToTop() {
  const btn = document.getElementById("back-to-top");
  window.addEventListener("scroll", () => {
    const show = window.scrollY > 500;
    btn.classList.toggle("opacity-0", !show);
    btn.classList.toggle("pointer-events-none", !show);
  });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/* ---------- Animated counters ---------- */
function initCounters() {
  const counters = document.querySelectorAll(".stat-number[data-count]");
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseInt(el.dataset.count, 10);
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 40));
    const tick = () => {
      current = Math.min(current + step, target);
      el.textContent = current;
      if (current < target) requestAnimationFrame(tick);
    };
    tick();
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animate(entry.target);
        obs.unobserve(entry.target);
      }
    });
  });
  counters.forEach((el) => observer.observe(el));
}

/* ---------- Skill bar fill on scroll into view ---------- */
function initSkillBars() {
  const bars = document.querySelectorAll(".skill-bar-fill");
  if (!bars.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.width = `${entry.target.dataset.width}%`;
        obs.unobserve(entry.target);
      }
    });
  });
  bars.forEach((bar) => observer.observe(bar));
}

/* ---------- Project search + technology filter ---------- */
function initProjectFilters() {
  const search = document.getElementById("project-search");
  const chips = document.querySelectorAll("#project-filters .filter-chip");
  const cards = document.querySelectorAll(".project-card");
  const noResults = document.getElementById("no-results");
  if (!cards.length) return;

  let activeFilter = "all";

  const applyFilters = () => {
    const query = (search.value || "").trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach((card) => {
      const matchesTech = activeFilter === "all" || card.dataset.tech.split(",").includes(activeFilter);
      const matchesQuery = !query || card.dataset.title.includes(query);
      const visible = matchesTech && matchesQuery;
      card.style.display = visible ? "" : "none";
      if (visible) visibleCount++;
    });

    noResults.classList.toggle("hidden", visibleCount !== 0);
  };

  search.addEventListener("input", applyFilters);
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      activeFilter = chip.dataset.filter;
      applyFilters();
    });
  });
}

/* ---------- Certificate category filter + modal ---------- */
function initCertificateModal() {
  const filterChips = document.querySelectorAll("[data-cert-filter]");
  const cards = document.querySelectorAll(".cert-card");

  filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      filterChips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      const filter = chip.dataset.certFilter;
      cards.forEach((card) => {
        card.style.display = filter === "all" || card.dataset.category === filter ? "" : "none";
      });
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      alert(`${card.dataset.title}\nIssued by: ${card.dataset.issuer}\n\n(Add a real certificate image or PDF to enable download.)`);
    });
  });
}

/* ---------- Contact form: client-side validation + async submit ---------- */
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const successMsg = document.getElementById("form-success");
  const generalError = document.getElementById("form-general-error");
  const submitText = document.getElementById("submit-text");
  const spinner = document.getElementById("submit-spinner");

  const rules = {
    name: (v) => (v.trim().length >= 2 ? "" : "Please enter your name (2+ characters)."),
    email: (v) => (/^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$/.test(v.trim()) ? "" : "Please enter a valid email."),
    subject: (v) => (v.trim().length >= 3 ? "" : "Subject must be at least 3 characters."),
    message: (v) => (v.trim().length >= 10 ? "" : "Message must be at least 10 characters."),
  };

  const showFieldError = (field, msg) => {
    const el = form.querySelector(`[data-error-for="${field}"]`);
    if (el) el.textContent = msg;
  };

  const validateAll = () => {
    let valid = true;
    Object.entries(rules).forEach(([field, rule]) => {
      const value = form.elements[field].value;
      const error = rule(value);
      showFieldError(field, error);
      if (error) valid = false;
    });
    return valid;
  };

  form.querySelectorAll("input, textarea").forEach((input) => {
    input.addEventListener("blur", () => {
      if (rules[input.name]) showFieldError(input.name, rules[input.name](input.value));
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    successMsg.classList.add("hidden");
    generalError.classList.add("hidden");

    if (!validateAll()) return;

    submitText.textContent = "Sending...";
    spinner.classList.remove("hidden");

    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        successMsg.classList.remove("hidden");
        form.reset();
      } else if (data.errors) {
        Object.entries(data.errors).forEach(([field, msg]) => showFieldError(field, msg));
        if (data.errors._general) {
          generalError.textContent = data.errors._general;
          generalError.classList.remove("hidden");
        }
      }
    } catch (err) {
      generalError.textContent = "Network error — please try again.";
      generalError.classList.remove("hidden");
    } finally {
      submitText.textContent = "Send message";
      spinner.classList.add("hidden");
    }
  });
}

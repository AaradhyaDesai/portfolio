const year = document.querySelector("#year");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const revealItems = document.querySelectorAll(".reveal");
const scenes = document.querySelectorAll(".scroll-scene");
const canvas = document.querySelector("#threatCanvas");
const ctx = canvas.getContext("2d");

year.textContent = new Date().getFullYear();

navToggle.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

siteNav.addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    siteNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

revealItems.forEach((item) => revealObserver.observe(item));

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateScrollScenes() {
  const viewportCenter = window.innerHeight / 2;

  scenes.forEach((scene) => {
    const rect = scene.getBoundingClientRect();
    const centerOffset = rect.top + rect.height / 2 - viewportCenter;
    const progress = clamp(1 - Math.abs(centerOffset) / (window.innerHeight * 0.9), 0, 1);
    const travel = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0, 1);

    scene.classList.toggle("scene-active", progress > 0.34);
    scene.style.setProperty("--scene-progress", travel.toFixed(3));
    scene.style.setProperty("--scene-scale", (0.94 + progress * 0.12).toFixed(3));
    scene.style.setProperty("--scene-glow", (0.12 + progress * 0.42).toFixed(3));
    scene.style.setProperty("--glow-x", `${28 + travel * 48}%`);
    scene.style.setProperty("--glow-y", `${18 + progress * 54}%`);
  });
}

window.addEventListener("scroll", updateScrollScenes, { passive: true });
window.addEventListener("resize", updateScrollScenes);
updateScrollScenes();

let width = 0;
let height = 0;
let nodes = [];
let animationFrame;

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = Math.min(80, Math.max(36, Math.floor(width / 18)));
  nodes = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.42,
    vy: (Math.random() - 0.5) * 0.42,
    size: Math.random() * 1.8 + 0.8
  }));
}

function drawThreatMap() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(5, 7, 13, 0.3)";
  ctx.fillRect(0, 0, width, height);

  nodes.forEach((node, index) => {
    node.x += node.vx;
    node.y += node.vy;

    if (node.x < 0 || node.x > width) node.vx *= -1;
    if (node.y < 0 || node.y > height) node.vy *= -1;

    for (let nextIndex = index + 1; nextIndex < nodes.length; nextIndex += 1) {
      const next = nodes[nextIndex];
      const dx = node.x - next.x;
      const dy = node.y - next.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 145) {
        const alpha = (1 - distance / 145) * 0.18;
        ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();
      }
    }

    ctx.fillStyle = index % 9 === 0 ? "rgba(124, 255, 107, 0.86)" : "rgba(34, 211, 238, 0.68)";
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
    ctx.fill();
  });

  animationFrame = requestAnimationFrame(drawThreatMap);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
drawThreatMap();

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cancelAnimationFrame(animationFrame);
  } else {
    drawThreatMap();
  }
});

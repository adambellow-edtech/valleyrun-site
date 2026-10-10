// Valley Run site: a live synthwave valley, scroll reveals and the soundtrack.
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- The valley: setting sun, mountains, a neon floor rolling toward you.
  const canvas = document.querySelector("canvas.valley");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0, dpr = 1, stars = [];
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.round(W * H / 9000) }, () => ({
        x: Math.random() * W, y: Math.random() * H * 0.55, r: Math.random() * 1.4 + 0.3, t: Math.random() * 6
      }));
    }
    size();
    window.addEventListener("resize", size);

    function mountains(horizon, t) {
      ctx.beginPath();
      ctx.moveTo(0, horizon);
      for (let x = 0; x <= W; x += 8) {
        const y = horizon - 28 - 26 * Math.sin(x / 90 + 1.3) - 16 * Math.sin(x / 37) - 10 * Math.sin(x / 13 + t * 0.0001);
        ctx.lineTo(x, Math.min(horizon, y));
      }
      ctx.lineTo(W, horizon); ctx.closePath();
      ctx.fillStyle = "#14082e"; ctx.fill();
      ctx.strokeStyle = "rgba(255,61,154,0.8)"; ctx.lineWidth = 1.5; ctx.stroke();
    }

    function frame(t) {
      const horizon = H * 0.58;
      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, "#0B0A23"); sky.addColorStop(0.6, "#2a0f4a"); sky.addColorStop(1, "#ff3d9a");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon);
      // Stars
      for (const s of stars) {
        ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(s.t + t / 1400));
        ctx.fillStyle = "#fff"; ctx.fillRect(s.x, s.y, s.r, s.r);
      }
      ctx.globalAlpha = 1;
      // Sun, striped, sitting on the horizon
      const cx = W * 0.72, r = Math.min(W, H) * 0.2, cy = horizon - r * 0.35;
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
      const sun = ctx.createLinearGradient(0, cy - r, 0, cy + r);
      sun.addColorStop(0, "#FFE36B"); sun.addColorStop(0.55, "#FFA24C"); sun.addColorStop(1, "#FF3D9A");
      ctx.fillStyle = sun; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.fillStyle = "#2a0f4a";
      for (let i = 0; i < 7; i++) {
        const y = cy + r * (0.05 + i * 0.14) + ((t / 60) % (r * 0.14));
        ctx.fillRect(cx - r, y, r * 2, 2 + i * 1.6);
      }
      ctx.restore();
      ctx.shadowColor = "#FFA24C"; ctx.shadowBlur = 0;
      mountains(horizon, t);
      // Floor
      const floor = ctx.createLinearGradient(0, horizon, 0, H);
      floor.addColorStop(0, "#1b0838"); floor.addColorStop(1, "#0B0A23");
      ctx.fillStyle = floor; ctx.fillRect(0, horizon, W, H - horizon);
      ctx.strokeStyle = "rgba(118,238,228,0.55)"; ctx.lineWidth = 1;
      // Lines running to the vanishing point
      const vx = W * 0.6;
      for (let i = -24; i <= 24; i++) {
        ctx.beginPath(); ctx.moveTo(vx + i * 6, horizon); ctx.lineTo(vx + i * W * 0.09, H); ctx.stroke();
      }
      // Rows rolling toward you
      const speed = reduce ? 0 : (t / 1000) % 1;
      for (let i = 0; i < 18; i++) {
        const z = (i + speed) / 18;
        const y = horizon + (H - horizon) * Math.pow(z, 2.2);
        ctx.globalAlpha = 0.15 + 0.85 * z;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Horizon glow
      const glow = ctx.createLinearGradient(0, horizon - 2, 0, horizon + 30);
      glow.addColorStop(0, "rgba(255,61,154,0.9)"); glow.addColorStop(1, "rgba(255,61,154,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, horizon - 2, W, 32);
      if (!reduce && visible) requestAnimationFrame(frame);
    }
    let visible = true;
    new IntersectionObserver(([e]) => {
      const was = visible; visible = e.isIntersecting;
      if (visible && !was) requestAnimationFrame(frame);
    }).observe(canvas);
    requestAnimationFrame(frame);
  }

  // ---- Reveal sections as they scroll in.
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          e.target.style.transitionDelay = (i % 4) * 90 + "ms";
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add("in"));
  }

  // ---- The soundtrack: off until asked for, then fades in.
  const btn = document.querySelector(".sound");
  const audio = document.querySelector("audio.soundtrack");
  if (btn && audio) {
    const label = btn.querySelector(".label");
    let fade;
    function ramp(to, done) {
      clearInterval(fade);
      fade = setInterval(() => {
        const v = audio.volume + (to > audio.volume ? 0.05 : -0.05);
        audio.volume = Math.max(0, Math.min(1, v));
        if (Math.abs(audio.volume - to) < 0.06) { audio.volume = to; clearInterval(fade); if (done) done(); }
      }, 50);
    }
    btn.addEventListener("click", () => {
      const on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", String(on));
      label.textContent = on ? "Soundtrack on" : "Play the soundtrack";
      if (on) {
        audio.volume = 0;
        audio.play().then(() => ramp(0.7)).catch(() => {
          btn.setAttribute("aria-pressed", "false"); label.textContent = "Play the soundtrack";
        });
      } else {
        ramp(0, () => audio.pause());
      }
    });
  }
})();

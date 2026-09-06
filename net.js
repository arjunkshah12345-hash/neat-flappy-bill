(function (global) {
  const INPUT_META = [
    { name: "AHEAD", hint: "DX" },
    { name: "HEIGHT", hint: "Y" },
    { name: "CEILING", hint: "TOP" },
    { name: "FLOOR", hint: "BOT" },
    { name: "FALL", hint: "VY" },
  ];

  const GOLD = "#ffe680";
  const INK = "#e8edf5";
  const MUTED = "#9fb4c8";
  const BLUE = "#4f8ec9";
  const HIDDEN = "#c47a5f";
  const EXCITE = "#3dce7a";
  const INHIBIT = "#e45b5b";

  const displayPos = new Map();
  const flapTrace = [];
  const TRACE = 140;
  let clock = 0;

  function pix(ctx, s, text, x, y, color, scale) {
    if (s && s.text) {
      s.text(ctx, text, Math.round(x), Math.round(y), color, scale || 1);
      return;
    }
    ctx.fillStyle = color;
    ctx.font = "10px ui-monospace, monospace";
    ctx.textBaseline = "top";
    ctx.fillText(String(text).toUpperCase(), x, y);
  }

  function textW(s, text, scale) {
    if (s && s.textWidth) return s.textWidth(String(text), scale || 1);
    return String(text).length * 6 * (scale || 1);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easePositions(target) {
    const seen = new Set();
    for (const [id, t] of target) {
      seen.add(id);
      const cur = displayPos.get(id);
      if (!cur) {
        displayPos.set(id, { x: t.x, y: t.y });
        continue;
      }
      displayPos.set(id, {
        x: lerp(cur.x, t.x, 0.22),
        y: lerp(cur.y, t.y, 0.22),
      });
    }
    for (const id of displayPos.keys()) {
      if (!seen.has(id)) displayPos.delete(id);
    }
  }

  function quad(t, a, c, b) {
    const u = 1 - t;
    return {
      x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
      y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
    };
  }

  function control(a, b, i) {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const lift = ((i % 7) - 3) * 10;
    return { x: mx, y: my + lift };
  }

  function drawPanel(ctx, w, h) {
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#18233f";
    ctx.fillRect(1, 1, w - 2, 1);
    ctx.fillRect(1, 1, 1, h - 2);
    ctx.fillStyle = "#0d1326";
    ctx.fillRect(3, 3, w - 6, h - 6);

    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "#4f8ec9";
    ctx.lineWidth = 1;
    for (let x = 24; x < w; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 8);
      ctx.lineTo(x + 0.5, h - 8);
      ctx.stroke();
    }
    for (let y = 24; y < h; y += 24) {
      ctx.beginPath();
      ctx.moveTo(8, y + 0.5);
      ctx.lineTo(w - 8, y + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMeter(ctx, x, y, w, h, value, color) {
    const v = Math.max(-1, Math.min(1, value));
    ctx.fillStyle = "#18233f";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#2c3a5e";
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    const mid = x + w / 2;
    const mag = Math.abs(v) * ((w - 4) / 2);
    ctx.fillStyle = color;
    if (v >= 0) ctx.fillRect(mid, y + 2, mag, h - 4);
    else ctx.fillRect(mid - mag, y + 2, mag, h - 4);
    ctx.fillStyle = GOLD;
    ctx.fillRect(mid - 0.5, y + 1, 1, h - 2);
  }

  function drawNode(ctx, p, node, act, firing) {
    const glow = act == null ? 0 : Math.abs(act);
    const r = node.type === "output" ? 16 : node.type === "input" ? 11 : 10;
    const base =
      node.type === "input" ? BLUE : node.type === "output" ? GOLD : HIDDEN;

    if (glow > 0.15 || firing) {
      ctx.beginPath();
      ctx.fillStyle = firing
        ? "rgba(255, 230, 128, 0.28)"
        : `rgba(79, 142, 201, ${0.1 + glow * 0.22})`;
      ctx.arc(p.x, p.y, r + 7 + glow * 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.fillStyle = "#0b1020";
    ctx.arc(p.x, p.y, r + 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = base;
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();

    if (act != null) {
      ctx.beginPath();
      ctx.fillStyle = act >= 0 ? "rgba(11, 16, 32, 0.15)" : "rgba(11, 16, 32, 0.55)";
      ctx.moveTo(p.x, p.y);
      ctx.arc(p.x, p.y, r - 2, -Math.PI / 2, -Math.PI / 2 + act * Math.PI, act < 0);
      ctx.closePath();
      ctx.fill();
    }

    ctx.beginPath();
    ctx.strokeStyle = firing ? "#fff6d8" : "rgba(255,255,255,0.35)";
    ctx.lineWidth = firing ? 2 : 1;
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawSynapses(ctx, genome, values, time) {
    genome.genes.forEach((gene, i) => {
      const a = displayPos.get(gene.in);
      const b = displayPos.get(gene.out);
      if (!a || !b) return;
      const c = control(a, b, i);
      const src = values.get(gene.in) || 0;
      const flow = src * gene.weight;
      const mag = Math.abs(gene.weight);
      const excite = gene.weight >= 0;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
      if (!gene.enabled) {
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
      } else {
        ctx.setLineDash([]);
        const alpha = Math.min(1, 0.18 + Math.abs(flow) * 0.55 + mag * 0.12);
        ctx.strokeStyle = excite
          ? `rgba(61, 206, 122, ${alpha})`
          : `rgba(228, 91, 91, ${alpha})`;
        ctx.lineWidth = 1 + Math.min(5, mag * 1.5);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      if (!gene.enabled || Math.abs(flow) < 0.12) return;
      const t = (time * (0.55 + Math.min(1.2, Math.abs(flow))) + i * 0.17) % 1;
      const p = quad(t, a, c, b);
      ctx.beginPath();
      ctx.fillStyle = excite ? GOLD : INHIBIT;
      ctx.arc(p.x, p.y, 2.4 + Math.min(2.2, Math.abs(flow) * 2), 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawInputs(ctx, sprite, inputs, positions, genome) {
    const nodes = genome.nodes.filter((n) => n.type === "input").sort((a, b) => a.id - b.id);
    nodes.forEach((node, i) => {
      const p = positions.get(node.id);
      if (!p) return;
      const meta = INPUT_META[i] || { name: "IN " + i, hint: String(i) };
      const val = inputs[i] || 0;
      const x = 10;
      const y = p.y - 16;
      pix(ctx, sprite, meta.name, x, y, INK, 1);
      pix(ctx, sprite, meta.hint, x + textW(sprite, meta.name, 1) + 8, y, MUTED, 1);
      drawMeter(ctx, x, y + 12, 86, 8, val, val >= 0 ? EXCITE : INHIBIT);
      const label = (val >= 0 ? "+" : "") + val.toFixed(2);
      pix(ctx, sprite, label, x, y + 24, GOLD, 1);
    });
  }

  function drawOutput(ctx, sprite, genome, values, flap, w) {
    const out = genome.nodes.find((n) => n.type === "output");
    if (!out) return;
    const p = displayPos.get(out.id);
    if (!p) return;
    const v = values.get(out.id) || 0;
    pix(ctx, sprite, "FLAP", p.x - textW(sprite, "FLAP", 1) / 2, p.y + 22, flap ? GOLD : MUTED, 1);

    const gx = w - 108;
    const gy = Math.max(36, p.y - 44);
    ctx.fillStyle = "#18233f";
    ctx.fillRect(gx, gy, 96, 92);
    ctx.fillStyle = "#2c3a5e";
    ctx.fillRect(gx + 1, gy + 1, 94, 1);
    pix(ctx, sprite, flap ? "FIRE" : "HOLD", gx + 8, gy + 8, flap ? GOLD : MUTED, 1);

    const barX = gx + 14;
    const barY = gy + 26;
    const barH = 44;
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(barX, barY, 14, barH);
    const mid = barY + barH / 2;
    const mag = Math.abs(v) * (barH / 2 - 2);
    ctx.fillStyle = v >= 0 ? EXCITE : INHIBIT;
    if (v >= 0) ctx.fillRect(barX + 3, mid - mag, 8, mag);
    else ctx.fillRect(barX + 3, mid, 8, mag);
    const threshY = mid - NEAT.FLAP_THRESHOLD * (barH / 2 - 2);
    ctx.fillStyle = GOLD;
    ctx.fillRect(barX, threshY, 14, 1);
    pix(ctx, sprite, "OUT", gx + 36, gy + 28, MUTED, 1);
    pix(ctx, sprite, (v >= 0 ? "+" : "") + v.toFixed(2), gx + 36, gy + 40, flap ? GOLD : INK, 1);
    pix(ctx, sprite, "GATE", gx + 36, gy + 56, MUTED, 1);
    pix(ctx, sprite, "0.10", gx + 36, gy + 68, GOLD, 1);
  }

  function drawTrace(ctx, sprite, w, h, flap) {
    const x = 12;
    const y = h - 48;
    const tw = w - 24;
    const th = 28;
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(x, y, tw, th);
    ctx.fillStyle = "#18233f";
    ctx.fillRect(x, y, tw, 1);

    const threshY = y + th / 2 - NEAT.FLAP_THRESHOLD * (th / 2 - 3);
    ctx.strokeStyle = "rgba(255, 230, 128, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 2, threshY);
    ctx.lineTo(x + tw - 2, threshY);
    ctx.stroke();

    if (flapTrace.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = flap ? GOLD : EXCITE;
      ctx.lineWidth = 1.5;
      flapTrace.forEach((v, i) => {
        const px = x + 2 + ((tw - 4) * i) / (TRACE - 1);
        const py = y + th / 2 - v * (th / 2 - 3);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }
    pix(ctx, sprite, "FLAP TRACE", x + 4, y + th + 4, MUTED, 1);
  }

  function drawLegend(ctx, sprite, w, h, genome) {
    const hidden = genome.nodes.filter((n) => n.type === "hidden").length;
    const live = genome.genes.filter((c) => c.enabled).length;
    const y = 10;
    pix(ctx, sprite, "CHAMP BRAIN", 12, y, GOLD, 1);
    pix(
      ctx,
      sprite,
      hidden + " HIDDEN  " + live + "/" + genome.genes.length + " GENES",
      12,
      y + 12,
      MUTED,
      1
    );
    pix(ctx, sprite, "EXCITE", w - 148, y, EXCITE, 1);
    pix(ctx, sprite, "INHIBIT", w - 86, y, INHIBIT, 1);
  }

  const NetViz = {};

  NetViz.draw = function (canvas, ctx, state) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = canvas.clientWidth || canvas.width || 720;
    const cssH = canvas.clientHeight || Math.round(cssW * (448 / 720));
    const needW = Math.round(cssW * dpr);
    const needH = Math.round(cssH * dpr);
    if (canvas.width !== needW || canvas.height !== needH) {
      canvas.width = needW;
      canvas.height = needH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;

    const w = cssW;
    const h = cssH;
    const genome = state.genome;
    const values = state.values || new Map();
    const inputs = state.inputs || [];
    const flap = !!state.flap;
    clock = state.time || clock + 1 / 60;

    drawPanel(ctx, w, h);
    if (!genome) return;

    const sprite = global.Official;
    const target = NEAT.layoutNetwork(genome, w, h);
    easePositions(target);

    if (state.output != null) {
      flapTrace.push(state.output);
      if (flapTrace.length > TRACE) flapTrace.shift();
    }

    drawSynapses(ctx, genome, values, clock);
    drawInputs(ctx, sprite, inputs, displayPos, genome);

    genome.nodes.forEach((node) => {
      const p = displayPos.get(node.id);
      if (!p) return;
      drawNode(ctx, p, node, values.get(node.id), node.type === "output" && flap);
      if (node.type === "hidden") {
        pix(ctx, sprite, "H" + node.id, p.x + 14, p.y - 4, MUTED, 1);
      }
    });

    drawOutput(ctx, sprite, genome, values, flap, w);
    drawTrace(ctx, sprite, w, h, flap);
    drawLegend(ctx, sprite, w, h, genome);
  };

  NetViz.reset = function () {
    displayPos.clear();
    flapTrace.length = 0;
    clock = 0;
  };

  global.NetViz = NetViz;
})(window);

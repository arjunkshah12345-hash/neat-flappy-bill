(function (global) {
  const INPUT_META = [
    { name: "DX", sub: "ahead" },
    { name: "Y", sub: "height" },
    { name: "TOP", sub: "ceiling" },
    { name: "BOT", sub: "floor" },
    { name: "VY", sub: "fall" },
  ];

  const INK = "#f4f4f5";
  const MUTED = "rgba(255,255,255,0.45)";
  const BLUE = "#7dd3fc";
  const HIDDEN = "#fbbf24";
  const GOLD = "#fafafa";
  const EXCITE = "#4ade80";
  const INHIBIT = "#fb7185";

  const displayPos = new Map();
  let clock = 0;

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
        x: lerp(cur.x, t.x, 0.2),
        y: lerp(cur.y, t.y, 0.2),
      });
    }
    for (const id of [...displayPos.keys()]) {
      if (!seen.has(id)) displayPos.delete(id);
    }
  }

  function typeColor(type) {
    if (type === "input") return BLUE;
    if (type === "output") return GOLD;
    return HIDDEN;
  }

  function drawLayers(ctx, layers, w, h) {
    layers.forEach((layer, i) => {
      const left = i === 0 ? 0 : (layer.x + (layers[i - 1].x || 0)) / 2;
      const right = i === layers.length - 1 ? w : (layer.x + layers[i + 1].x) / 2;
      if (i % 2 === 1) {
        ctx.fillStyle = "rgba(255,255,255,0.025)";
        ctx.fillRect(left, 0, right - left, h);
      }
      ctx.fillStyle = MUTED;
      ctx.font = "500 12px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(layer.label, layer.x, 28);
    });
  }

  function drawSynapses(ctx, genome) {
    genome.genes.forEach((gene) => {
      const a = displayPos.get(gene.in);
      const b = displayPos.get(gene.out);
      if (!a || !b) return;
      const mag = Math.abs(gene.weight);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      if (!gene.enabled) {
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
      } else {
        ctx.setLineDash([]);
        const alpha = Math.min(0.85, 0.15 + mag * 0.35);
        ctx.strokeStyle =
          gene.weight >= 0 ? `rgba(74, 222, 128, ${alpha})` : `rgba(251, 113, 133, ${alpha})`;
        ctx.lineWidth = 1.2 + Math.min(3.5, mag * 1.1);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  function drawNode(ctx, p, node, act, label, sub, firing) {
    const r = node.type === "output" ? 18 : 14;
    const glow = act == null ? 0 : Math.min(1, Math.abs(act));
    ctx.beginPath();
    ctx.fillStyle = firing
      ? "rgba(250,250,250,0.16)"
      : `rgba(255,255,255,${0.03 + glow * 0.08})`;
    ctx.arc(p.x, p.y, r + 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "#161616";
    ctx.arc(p.x, p.y, r + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = typeColor(node.type);
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();

    if (act != null) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(10,10,10,0.35)";
      ctx.moveTo(p.x, p.y);
      ctx.arc(p.x, p.y, r - 3, -Math.PI / 2, -Math.PI / 2 + Math.max(-1, Math.min(1, act)) * Math.PI, act < 0);
      ctx.closePath();
      ctx.fill();
    }

    ctx.beginPath();
    ctx.strokeStyle = firing ? "#fff" : "rgba(255,255,255,0.28)";
    ctx.lineWidth = firing ? 2 : 1;
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = INK;
    ctx.font = "600 12px Outfit, sans-serif";
    ctx.fillText(label, p.x, p.y + r + 16);
    if (sub) {
      ctx.fillStyle = MUTED;
      ctx.font = "400 11px Outfit, sans-serif";
      ctx.fillText(sub, p.x, p.y + r + 30);
    }
  }

  function drawEmptyHidden(ctx, layer, h) {
    const y = h / 2 + 8;
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "rgba(251, 191, 36, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.arc(layer.x, y, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.textAlign = "center";
    ctx.fillStyle = MUTED;
    ctx.font = "400 12px Outfit, sans-serif";
    ctx.fillText("none yet", layer.x, y + 36);
  }

  const NetViz = {};

  NetViz.draw = function (canvas, ctx, state) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = canvas.clientWidth || 960;
    const cssH = canvas.clientHeight || 420;
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

    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, w, h);
    if (!genome) return;

    const layout = NEAT.layoutNetwork(genome, w, h);
    easePositions(layout.pos);
    drawLayers(ctx, layout.layers, w, h);
    drawSynapses(ctx, genome);

    const inputNodes = genome.nodes.filter((n) => n.type === "input").sort((a, b) => a.id - b.id);
    genome.nodes.forEach((node) => {
      const p = displayPos.get(node.id);
      if (!p) return;
      let label = "H" + node.id;
      let sub = "";
      if (node.type === "input") {
        const idx = inputNodes.findIndex((n) => n.id === node.id);
        const meta = INPUT_META[idx] || { name: "IN", sub: String(idx) };
        label = meta.name;
        const val = inputs[idx];
        sub = val == null ? meta.sub : (val >= 0 ? "+" : "") + val.toFixed(2);
      } else if (node.type === "output") {
        label = "FLAP";
        sub = flap ? "fire" : "hold";
      }
      drawNode(ctx, p, node, values.get(node.id), label, sub, node.type === "output" && flap);
    });

    layout.layers.forEach((layer) => {
      if (layer.key === "hidden-empty") drawEmptyHidden(ctx, layer, h);
    });

    ctx.textAlign = "left";
    ctx.font = "400 11px Outfit, sans-serif";
    ctx.fillStyle = EXCITE;
    ctx.fillText("excite", 18, h - 14);
    ctx.fillStyle = INHIBIT;
    ctx.fillText("inhibit", 68, h - 14);
  };

  NetViz.reset = function () {
    displayPos.clear();
    clock = 0;
  };

  global.NetViz = NetViz;
})(window);

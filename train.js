(() => {
  const POP = 50;
  const DT = 1 / 60;
  const FLAP_T = 0.26;

  const game = document.getElementById("game");
  const net = document.getElementById("net");
  const gctx = game.getContext("2d");
  const nctx = net.getContext("2d");
  const $ = (id) => document.getElementById(id);

  Official.init();

  let turbo = Number($("turbo").value);
  let paused = false;
  let pop = NEAT.createPopulation(POP);
  let world;
  let birds;
  let champLive = null;
  let lastAct = null;
  let time = 0;
  let scroll = 0;

  function resetWorld() {
    world = Bill.makeWorld((Math.random() * 1e9) | 0);
    birds = pop.genomes.map(() => {
      const bird = Bill.makeBird();
      bird.flapT = 0;
      return bird;
    });
    champLive = null;
    lastAct = null;
    time = 0;
    scroll = 0;
  }

  function bestAlive() {
    let best = -1;
    let idx = -1;
    birds.forEach((b, i) => {
      if (!b.alive) return;
      const f = Bill.fitness(b, world);
      if (f > best) {
        best = f;
        idx = i;
      }
    });
    return idx;
  }

  function tick() {
    time += DT;
    scroll += Bill.scrollSpeed(world.score) * DT;
    Bill.stepWorld(world, DT);
    birds.forEach((bird, i) => {
      if (!bird.alive) return;
      const ins = Bill.inputs(bird, world);
      const act = NEAT.activate(pop.genomes[i], ins);
      if (act.flap) {
        Bill.flap(bird);
        if (!bird.falling) bird.flapT = FLAP_T;
      }
      Bill.stepBird(bird, world, DT);
      bird.flapT = Math.max(0, (bird.flapT || 0) - DT);
    });

    const bi = bestAlive();
    if (bi >= 0) {
      champLive = pop.genomes[bi];
      lastAct = NEAT.activate(champLive, Bill.inputs(birds[bi], world));
    }

    const alive = birds.filter((b) => b.alive).length;
    const genBest = Math.max(...birds.map((b) => b.score));
    if (genBest > pop.bestScore) pop.bestScore = genBest;

    if (alive === 0) {
      pop.genomes.forEach((g, i) => {
        g.fitness = Bill.fitness(birds[i], world);
      });
      NEAT.nextGeneration(pop);
      resetWorld();
    }

    $("gen").textContent = String(pop.gen);
    $("alive").textContent = String(alive);
    $("score").textContent = String(genBest);
    $("best").textContent = String(pop.bestScore);
    $("species").textContent = String(pop.species || 1);
    $("innov").textContent = String(NEAT.innovationCount());
    $("nodes").textContent = champLive ? String(champLive.nodes.length) : "—";
  }

  function drawGame() {
    const bi = bestAlive();
    const genBest = Math.max(0, ...birds.map((b) => b.score));
    Official.draw(gctx, {
      time,
      scroll,
      columns: world.columns,
      score: genBest,
      best: pop.bestScore,
      birds: birds.map((bird, i) => {
        if (!bird.alive && !bird.falling) return null;
        return {
          y: bird.y,
          vy: bird.vy,
          flapT: bird.flapT || 0,
          alpha: bird.alive ? (i === bi ? 1 : 0.42) : 0.2,
        };
      }),
    });
  }

  function drawNet() {
    nctx.fillStyle = "#0b1020";
    nctx.fillRect(0, 0, net.width, net.height);
    const g = champLive || pop.champ || pop.genomes[0];
    if (!g) return;
    const pos = NEAT.layoutNetwork(g, net.width, net.height);
    const values = lastAct ? lastAct.value : new Map();

    for (const c of g.genes) {
      const a = pos.get(c.in);
      const b = pos.get(c.out);
      if (!a || !b) continue;
      const w = c.weight;
      nctx.beginPath();
      nctx.strokeStyle = c.enabled
        ? w >= 0
          ? `rgba(80, 220, 140, ${Math.min(1, 0.25 + Math.abs(w) * 0.35)})`
          : `rgba(232, 90, 90, ${Math.min(1, 0.25 + Math.abs(w) * 0.35)})`
        : "rgba(255,255,255,0.08)";
      nctx.lineWidth = c.enabled ? 1 + Math.min(4, Math.abs(w) * 1.4) : 1;
      nctx.moveTo(a.x, a.y);
      nctx.lineTo(b.x, b.y);
      nctx.stroke();
    }

    for (const n of g.nodes) {
      const p = pos.get(n.id);
      if (!p) continue;
      const act = values.get(n.id);
      const glow = act == null ? 0 : Math.abs(act);
      nctx.beginPath();
      nctx.fillStyle =
        n.type === "input" ? "#4f8ec9" : n.type === "output" ? "#ffe680" : "#c47a5f";
      nctx.arc(p.x, p.y, 8 + glow * 3, 0, Math.PI * 2);
      nctx.fill();
      nctx.strokeStyle = "rgba(255,255,255,0.35)";
      nctx.lineWidth = 1;
      nctx.stroke();
    }

    nctx.fillStyle = "#9aa4b6";
    nctx.font = "11px ui-monospace, monospace";
    NEAT.INPUT_LABELS.forEach((label, i) => {
      const p = pos.get(i);
      if (p) nctx.fillText(label, 6, p.y + 4);
    });
    const out = g.nodes.find((n) => n.type === "output");
    if (out) {
      const p = pos.get(out.id);
      if (p) nctx.fillText("FLAP", net.width - 34, p.y - 14);
    }
    nctx.fillStyle = "#e8edf5";
    nctx.fillText(
      `hidden ${g.nodes.filter((n) => n.type === "hidden").length}  ·  genes ${g.genes.length}`,
      12,
      net.height - 12
    );
  }

  function frame() {
    if (!paused) {
      const steps = Math.max(1, turbo | 0);
      for (let i = 0; i < steps; i++) tick();
    }
    drawGame();
    drawNet();
    requestAnimationFrame(frame);
  }

  $("turbo").addEventListener("input", () => {
    turbo = Number($("turbo").value);
    $("turboLabel").textContent = turbo + "×";
  });
  $("pause").addEventListener("click", () => {
    paused = !paused;
    $("pause").textContent = paused ? "Resume" : "Pause";
  });
  $("reset").addEventListener("click", () => {
    pop = NEAT.createPopulation(POP);
    resetWorld();
  });

  resetWorld();
  $("turboLabel").textContent = turbo + "×";
  frame();
})();

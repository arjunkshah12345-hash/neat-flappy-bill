(() => {
  const POP = 50;
  const DT = 1 / 60;
  const FLAP_T = 0.26;
  const SPEEDS = [1, 2, 4, 8, 16, 32];

  const game = document.getElementById("game");
  const net = document.getElementById("net");
  const gctx = game.getContext("2d");
  const nctx = net.getContext("2d");
  const $ = (id) => document.getElementById(id);

  Official.init();

  let turbo = 4;
  let paused = false;
  let pop = NEAT.createPopulation(POP);
  let world;
  let birds;
  let champLive = null;
  let lastAct = null;
  let lastInputs = [];
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
    lastInputs = [];
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
      lastInputs = Bill.inputs(birds[bi], world);
      lastAct = NEAT.activate(champLive, lastInputs);
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

  function airborne(bird) {
    if (!bird.alive) return false;
    if (bird.y + Bill.BIRD_H >= Bill.GROUND - 0.5) return false;
    return true;
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
        if (!airborne(bird)) return null;
        return {
          y: bird.y,
          vy: bird.vy,
          flapT: bird.flapT || 0,
          alpha: i === bi ? 1 : 0.42,
        };
      }),
    });
  }

  function drawNet() {
    NetViz.draw(net, nctx, {
      genome: champLive || pop.champ || pop.genomes[0],
      values: lastAct ? lastAct.value : new Map(),
      inputs: lastInputs,
      flap: lastAct ? lastAct.flap : false,
      output: lastAct ? lastAct.output : 0,
      time,
    });
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

  function setSpeed(next) {
    turbo = SPEEDS.includes(next) ? next : 4;
    document.querySelectorAll("#speeds button").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.speed) === turbo);
    });
  }

  $("speeds").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-speed]");
    if (!btn) return;
    setSpeed(Number(btn.dataset.speed));
  });
  $("pause").addEventListener("click", () => {
    paused = !paused;
    $("pause").textContent = paused ? "Resume" : "Pause";
  });
  $("reset").addEventListener("click", () => {
    pop = NEAT.createPopulation(POP);
    NetViz.reset();
    resetWorld();
  });

  resetWorld();
  setSpeed(4);
  frame();
})();

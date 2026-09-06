/**
 * Compact NEAT — topologies grow. The original Flappy Bird folder used a
 * fixed 4-6-1 TensorFlow.js net (genetic weights only).
 */
(function (global) {
  const INPUTS = 5;
  const NEAT = {
    INPUT_LABELS: ["DX", "Y", "TOP", "BOT", "VY"],
    OUTPUT_LABELS: ["FLAP"],
    FLAP_THRESHOLD: 0.1,
  };

  let innov = 0;
  const innovMap = new Map();

  function nextInnov(from, to) {
    const key = from + "->" + to;
    if (!innovMap.has(key)) innovMap.set(key, ++innov);
    return innovMap.get(key);
  }
  function randn() {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  NEAT.innovationCount = function () {
    return innov;
  };
  function resetInnovations() {
    innov = 0;
    innovMap.clear();
  }

  function createGenome() {
    const nodes = [];
    for (let i = 0; i < INPUTS; i++) nodes.push({ id: i, type: "input" });
    const outId = INPUTS;
    nodes.push({ id: outId, type: "output" });
    const genes = [];
    for (let i = 0; i < INPUTS; i++) {
      genes.push({
        in: i,
        out: outId,
        weight: randn() * 1.2,
        enabled: true,
        innov: nextInnov(i, outId),
      });
    }
    return { nodes, genes, nextNode: outId + 1, fitness: 0 };
  }
  function cloneGenome(g) {
    return {
      nodes: g.nodes.map((n) => Object.assign({}, n)),
      genes: g.genes.map((c) => Object.assign({}, c)),
      nextNode: g.nextNode,
      fitness: 0,
    };
  }
  function hasConnection(g, a, b) {
    return g.genes.some((c) => c.in === a && c.out === b);
  }
  function feedOrder(g) {
    return g.nodes.filter((n) => n.type !== "input").map((n) => n.id);
  }

  NEAT.activate = function (g, inputs) {
    const value = new Map();
    for (let i = 0; i < INPUTS; i++) value.set(i, inputs[i] || 0);
    for (const n of g.nodes) if (n.type !== "input") value.set(n.id, 0);
    for (const id of feedOrder(g)) {
      let sum = 0;
      for (const c of g.genes) {
        if (!c.enabled || c.out !== id) continue;
        sum += (value.get(c.in) || 0) * c.weight;
      }
      value.set(id, Math.tanh(sum));
    }
    const outId = g.nodes.find((n) => n.type === "output").id;
    const output = value.get(outId) || 0;
    return { flap: output > NEAT.FLAP_THRESHOLD, output, value };
  };

  function mutateWeights(g) {
    for (const c of g.genes) {
      if (Math.random() < 0.1) c.weight = randn() * 1.4;
      else c.weight += randn() * 0.22;
    }
  }
  function mutateAddConnection(g) {
    const ids = g.nodes.map((n) => n.id);
    for (let tries = 0; tries < 16; tries++) {
      const a = ids[(Math.random() * ids.length) | 0];
      const b = ids[(Math.random() * ids.length) | 0];
      const na = g.nodes.find((n) => n.id === a);
      const nb = g.nodes.find((n) => n.id === b);
      if (!na || !nb || na.type === "output" || nb.type === "input" || a === b) continue;
      if (hasConnection(g, a, b)) continue;
      g.genes.push({
        in: a,
        out: b,
        weight: randn() * 0.8,
        enabled: true,
        innov: nextInnov(a, b),
      });
      return;
    }
  }
  function mutateAddNode(g) {
    const enabled = g.genes.filter((c) => c.enabled);
    if (!enabled.length) return;
    const c = enabled[(Math.random() * enabled.length) | 0];
    c.enabled = false;
    const nid = g.nextNode++;
    g.nodes.push({ id: nid, type: "hidden" });
    g.genes.push({ in: c.in, out: nid, weight: 1, enabled: true, innov: nextInnov(c.in, nid) });
    g.genes.push({
      in: nid,
      out: c.out,
      weight: c.weight,
      enabled: true,
      innov: nextInnov(nid, c.out),
    });
  }
  function mutate(g) {
    mutateWeights(g);
    if (Math.random() < 0.12) mutateAddConnection(g);
    if (Math.random() < 0.08) mutateAddNode(g);
    if (Math.random() < 0.04 && g.genes.length) {
      const c = g.genes[(Math.random() * g.genes.length) | 0];
      c.enabled = !c.enabled;
    }
  }
  function crossover(a, b) {
    const better = a.fitness >= b.fitness ? a : b;
    const other = better === a ? b : a;
    const otherByInnov = new Map(other.genes.map((c) => [c.innov, c]));
    const child = {
      nodes: better.nodes.map((n) => Object.assign({}, n)),
      genes: [],
      nextNode: better.nextNode,
      fitness: 0,
    };
    for (const c of better.genes) {
      const match = otherByInnov.get(c.innov);
      child.genes.push(Object.assign({}, match && Math.random() < 0.5 ? match : c));
    }
    return child;
  }
  function compatibility(a, b) {
    const aMap = new Map(a.genes.map((c) => [c.innov, c]));
    const bMap = new Map(b.genes.map((c) => [c.innov, c]));
    const innovs = new Set([...aMap.keys(), ...bMap.keys()]);
    let disjoint = 0;
    let matching = 0;
    let wdiff = 0;
    for (const i of innovs) {
      const ga = aMap.get(i);
      const gb = bMap.get(i);
      if (ga && gb) {
        matching += 1;
        wdiff += Math.abs(ga.weight - gb.weight);
      } else disjoint += 1;
    }
    const n = Math.max(1, innovs.size);
    return disjoint / n + (matching ? wdiff / matching : 0) * 0.4;
  }

  NEAT.createPopulation = function (size) {
    resetInnovations();
    return {
      size,
      gen: 1,
      bestScore: 0,
      bestFitness: 0,
      champ: null,
      species: 1,
      genomes: Array.from({ length: size }, createGenome),
    };
  };

  NEAT.nextGeneration = function (pop) {
    const sorted = pop.genomes.slice().sort((a, b) => b.fitness - a.fitness);
    if (sorted[0].fitness > pop.bestFitness) {
      pop.bestFitness = sorted[0].fitness;
      pop.champ = cloneGenome(sorted[0]);
    }
    const species = [];
    for (const g of sorted) {
      let placed = false;
      for (const s of species) {
        if (compatibility(g, s[0]) < 0.85) {
          s.push(g);
          placed = true;
          break;
        }
      }
      if (!placed) species.push([g]);
    }
    const next = [cloneGenome(sorted[0])];
    if (sorted[1]) next.push(cloneGenome(sorted[1]));
    const pools = species
      .map((s) => s.slice(0, Math.max(1, Math.ceil(s.length * 0.4))))
      .filter((s) => s.length);
    while (next.length < pop.size) {
      const pool = pools[(Math.random() * pools.length) | 0] || sorted.slice(0, 8);
      const p1 = pool[(Math.random() * pool.length) | 0];
      const p2 = pool[(Math.random() * pool.length) | 0];
      const child = Math.random() < 0.75 ? crossover(p1, p2) : cloneGenome(p1);
      mutate(child);
      next.push(child);
    }
    pop.genomes = next;
    pop.gen += 1;
    pop.species = species.length;
    return pop;
  };

  NEAT.nodeDepths = function (g) {
    const byId = new Map(g.nodes.map((n) => [n.id, n]));
    const depth = new Map();
    for (const n of g.nodes) depth.set(n.id, n.type === "input" ? 0 : 1);
    for (let pass = 0; pass < g.nodes.length + 2; pass++) {
      for (const c of g.genes) {
        if (!c.enabled) continue;
        const dst = byId.get(c.out);
        if (!dst || dst.type !== "hidden") continue;
        depth.set(dst.id, Math.max(depth.get(dst.id) || 1, (depth.get(c.in) || 0) + 1));
      }
    }
    const hid = g.nodes.filter((n) => n.type === "hidden");
    const hidMax = hid.length ? Math.max(...hid.map((n) => depth.get(n.id) || 1)) : 0;
    for (const n of g.nodes) {
      if (n.type === "output") depth.set(n.id, hidMax + 1);
    }
    return depth;
  };

  NEAT.layoutNetwork = function (g, w, h, opts) {
    const padL = opts && opts.padL != null ? opts.padL : 148;
    const padR = opts && opts.padR != null ? opts.padR : 128;
    const padT = opts && opts.padT != null ? opts.padT : 44;
    const padB = opts && opts.padB != null ? opts.padB : 68;
    const depths = NEAT.nodeDepths(g);
    const maxD = Math.max(1, ...depths.values());
    const buckets = new Map();
    for (const n of g.nodes) {
      const d = depths.get(n.id) || 0;
      if (!buckets.has(d)) buckets.set(d, []);
      buckets.get(d).push(n);
    }
    const pos = new Map();
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;
    for (const [d, list] of buckets) {
      list.sort((a, b) => a.id - b.id);
      const x = padL + (innerW * d) / maxD;
      list.forEach((n, i) => {
        pos.set(n.id, {
          x,
          y: padT + (innerH * (i + 1)) / (list.length + 1),
          depth: d,
          type: n.type,
        });
      });
    }
    return pos;
  };

  global.NEAT = NEAT;
})(window);

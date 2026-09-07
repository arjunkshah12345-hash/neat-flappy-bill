/**
 * Flappy Bill physics — extracted from the White House arcade page
 * https://www.whitehouse.gov/arcade/flappy-bill/ (inline script, 2026-09-03)
 * Original minified source: flappy-bill-game.original.js
 */
(function (global) {
  const Bill = {};
  Bill.W = 256;
  Bill.H = 224;
  Bill.GROUND = 194;
  Bill.BIRD_X = 66;
  Bill.BIRD_W = 22;
  Bill.BIRD_H = 20;
  Bill.HIT_INSET_X = 5;
  Bill.HIT_INSET_Y = 6;
  Bill.HIT_H = 8;
  Bill.GRAVITY = 640;
  Bill.FLAP_VY = -196;
  Bill.MAX_VY = 268;
  Bill.CRASH_VY = -70;
  Bill.START_Y = 82;
  Bill.COL_W = 22;
  Bill.COL_SPACING = 112;
  Bill.FIRST_COL = 60;
  Bill.SPEED_START = 60;
  Bill.SPEED_END = 94;
  Bill.GAP_START = 72;
  Bill.GAP_END = 56;
  Bill.RAMP_SCORE = 20;
  Bill.GAP_MIN_Y = 24;
  Bill.GAP_BOTTOM_MARGIN = 30;
  Bill.GAP_WANDER = 44;

  function lerp(a, b, t) {
    const u = Math.min(1, Math.max(0, t));
    return a + (b - a) * u;
  }
  Bill.scrollSpeed = function (score) {
    return lerp(Bill.SPEED_START, Bill.SPEED_END, score / Bill.RAMP_SCORE);
  };
  Bill.gapSize = function (score) {
    return Math.round(lerp(Bill.GAP_START, Bill.GAP_END, score / Bill.RAMP_SCORE));
  };
  Bill.rng = function (seed) {
    let s = seed >>> 0;
    return function next() {
      s += 1831565813;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  Bill.birdHitbox = function (y) {
    return {
      x: Bill.BIRD_X + Bill.HIT_INSET_X,
      y: y + Bill.HIT_INSET_Y,
      w: Bill.BIRD_W - Bill.HIT_INSET_X * 2,
      h: Bill.HIT_H,
    };
  };
  Bill.columnBoxes = function (col) {
    const bottomY = col.gapY + col.gap;
    return {
      top: { x: col.x, y: 0, w: Bill.COL_W, h: col.gapY },
      bottom: { x: col.x, y: bottomY, w: Bill.COL_W, h: Bill.GROUND - bottomY },
    };
  };
  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function nextGapY(rand, columns, gap) {
    const lo = Bill.GAP_MIN_Y;
    const hi = Bill.GROUND - gap - Bill.GAP_BOTTOM_MARGIN;
    const midLo = lo + gap / 2;
    const midHi = hi + gap / 2;
    const last = columns[columns.length - 1];
    const prev = last ? last.gapY + last.gap / 2 : (midLo + midHi) / 2;
    const wander = (rand() * 2 - 1) * Bill.GAP_WANDER;
    const mid = Math.min(midHi, Math.max(midLo, prev + wander));
    return Math.round(mid - gap / 2);
  }
  function spawnColumn(world, x) {
    const gap = Bill.gapSize(world.score);
    world.nextId = (world.nextId || 0) + 1;
    world.columns.push({
      id: world.nextId,
      x,
      gap,
      gapY: nextGapY(world.rand, world.columns, gap),
    });
  }
  Bill.makeWorld = function (seed) {
    const world = { seed, rand: Bill.rng(seed), columns: [], score: 0, nextId: 0 };
    spawnColumn(world, Bill.W + Bill.FIRST_COL);
    while (world.columns[world.columns.length - 1].x < Bill.W) {
      spawnColumn(world, world.columns[world.columns.length - 1].x + Bill.COL_SPACING);
    }
    return world;
  };
  Bill.stepWorld = function (world, dt) {
    const speed = Bill.scrollSpeed(world.score);
    for (const col of world.columns) col.x -= speed * dt;
    if (world.columns.length && world.columns[0].x + Bill.COL_W < 0) world.columns.shift();
    if (!world.columns.length) spawnColumn(world, Bill.W + Bill.FIRST_COL);
    while (world.columns[world.columns.length - 1].x < Bill.W) {
      spawnColumn(world, world.columns[world.columns.length - 1].x + Bill.COL_SPACING);
    }
  };
  Bill.makeBird = function () {
    return { y: Bill.START_Y, vy: 0, alive: true, falling: false, score: 0, frames: 0, seen: new Set() };
  };
  Bill.flap = function (bird) {
    if (!bird.alive || bird.falling) return;
    bird.vy = Bill.FLAP_VY;
  };
  Bill.stepBird = function (bird, world, dt) {
    if (!bird.alive) return;
    bird.frames += 1;
    bird.vy = Math.min(Bill.MAX_VY, bird.vy + Bill.GRAVITY * dt);
    bird.y += bird.vy * dt;
    if (bird.y < 0) {
      bird.y = 0;
      bird.vy = 0;
    }
    if (bird.falling) {
      if (bird.y + Bill.BIRD_H >= Bill.GROUND) {
        bird.y = Bill.GROUND - Bill.BIRD_H;
        bird.vy = 0;
        bird.alive = false;
      }
      return;
    }
    if (bird.y + Bill.BIRD_H >= Bill.GROUND) {
      bird.y = Bill.GROUND - Bill.BIRD_H;
      bird.vy = 0;
      bird.alive = false;
      return;
    }
    const box = Bill.birdHitbox(bird.y);
    for (const col of world.columns) {
      const { top, bottom } = Bill.columnBoxes(col);
      if (overlap(box, top) || overlap(box, bottom)) {
        bird.falling = true;
        bird.vy = Bill.CRASH_VY;
        return;
      }
    }
    const cx = Bill.BIRD_X + Bill.BIRD_W / 2;
    for (const col of world.columns) {
      if (col.x + Bill.COL_W > cx) continue;
      if (bird.seen.has(col.id)) continue;
      bird.seen.add(col.id);
      bird.score += 1;
      world.score = Math.max(world.score, bird.score);
    }
  };
  Bill.nearestColumn = function (world) {
    const cx = Bill.BIRD_X + Bill.BIRD_W / 2;
    return world.columns.find((c) => c.x + Bill.COL_W >= cx) || null;
  };
  Bill.inputs = function (bird, world) {
    const col = Bill.nearestColumn(world);
    if (!col) return [1, bird.y / Bill.GROUND, 0.5, 0.5, bird.vy / Bill.MAX_VY];
    return [
      (col.x - Bill.BIRD_X) / Bill.W,
      bird.y / Bill.GROUND,
      (col.gapY - bird.y) / Bill.GROUND,
      (col.gapY + col.gap - bird.y) / Bill.GROUND,
      bird.vy / Bill.MAX_VY,
    ];
  };
  Bill.fitness = function (bird, world) {
    const col = Bill.nearestColumn(world);
    let align = 0;
    if (col && bird.alive) {
      const mid = col.gapY + col.gap / 2;
      align = 1 - Math.min(1, Math.abs(bird.y + Bill.BIRD_H / 2 - mid) / Bill.GROUND);
    }
    return bird.frames + bird.score * 400 + align * 40;
  };

  global.Bill = Bill;
})(window);

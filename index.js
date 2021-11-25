const state = {
  paths: [],
  field: [],
  particles: [],
  show: {
    paths: true,
    field: true,
    particles: true,
    fps: false,
  }
};

const size = 500;
const fieldResolution = 25;
const fieldGap = size / fieldResolution;
const fieldLength = fieldResolution ** 2 * 2;
const numParticles = 5000;

function setup() {
  createCanvas(size, size);
  noCursor();
  stroke("white");
  resetField();
  randomizeParticles();
}

function mousePressed(e) {
  if (mouseButton === LEFT) {
    state.paths.push([]);
  }
}

function reset() {
  state.paths.length = 0;
  resetField();
  randomizeParticles();
}

function randomizeParticles() {
  for (let i = 0; i < numParticles; i += 5) {
    // position
    state.particles[i] = random(size);
    state.particles[i + 1] = random(size);

    // velocity
    state.particles[i + 2] = 0;
    state.particles[i + 3] = 0;

    // ttl
    state.particles[i + 4] = random(10, 1000);
  }
}

function resetField() {
  for (let i = 0; i < fieldLength; i += 2) {
    // direction
    state.field[i] = 0;
    state.field[i + 1] = 0;
  }
}

function mouseReleased() {
  resetField();
  const pvec = [];
  const pb = [];
  const fo = [];
  const fv = [];
  for (let i = 0; i < fieldLength; i += 2) {
    const ox = ((i / 2) % fieldResolution) * fieldGap;
    const oy = Math.floor(i / 2 / fieldResolution) * fieldGap;
    fo[0] = ox;
    fo[1] = oy;
    fv[0] = state.field[i];
    fv[1] = state.field[i + 1];

    for (const path of state.paths) {
      if (path.length < 4) continue;

      for (let j = 0; j < path.length - 2; j += 2) {
        pvec[0] = path[j + 2];
        pvec[1] = path[j + 3];
        pb[0] = path[j];
        pb[1] = path[j + 1];

        glMatrix.vec2.sub(pvec, pvec, pb);
        glMatrix.vec2.normalize(pvec, pvec);

        const t = glMatrix.vec2.dist(pb, fo);

        glMatrix.vec2.lerp(fv, fv, pvec, 2 / t);
        glMatrix.vec2.normalize(fv, fv);
        state.field[i] = fv[0];
        state.field[i + 1] = fv[1];
      }
    }
  }
}

function draw() {
  background(255, 0, 0, 0.5);
  circle(mouseX, mouseY, 10);

  if (mouseIsPressed && mouseButton === LEFT) {
    state.paths[state.paths.length - 1].push(mouseX, mouseY);
  }

  if (state.show.paths) {
    stroke("lightblue");
    for (const path of state.paths) {
      for (let i = 0; i < path.length - 2; i += 2) {
        line(path[i], path[i + 1], path[i + 2], path[i + 3]);
      }
    }
    stroke("white");
  }

  if (state.show.field) {
    for (let i = 0; i < state.field.length; i += 2) {
      const ox = ((i / 2) % fieldResolution) * fieldGap;
      const oy = Math.floor(i / 2 / fieldResolution) * fieldGap;
      circle(ox, oy, 3);
      line(ox, oy, ox + (state.field[i] * fieldGap) / 2, oy + (state.field[i + 1] * fieldGap) / 2);
    }
  }

  if (state.show.particles) {
    const fp = [];
    const pp = [];
    const fv = [];
    const pv = [];
    const or = [0, 0];

    for (let i = 0; i < state.particles.length; i += 5) {
      if (state.particles[i + 4] < 0) {
        state.particles[i] = random(size);
        state.particles[i + 1] = random(size);
        state.particles[i + 2] = 0;
        state.particles[i + 3] = 0;
        state.particles[i + 4] = random(500, 1000);
      } else {
        state.particles[i + 4] -= 1;
      }

      circle(state.particles[i], state.particles[i + 1], 1);

      if (state.particles[i] > size) state.particles[i] = 0;
      if (state.particles[i + 1] > size) state.particles[i + 1] = 0;
      if (state.particles[i] < 0) state.particles[i] = size;
      if (state.particles[i + 1] < 0) state.particles[i + 1] = size;

      const px = state.particles[i];
      const py = state.particles[i + 1];
      const fx = Math.max(0, Math.min(fieldResolution - 1, Math.round(px / fieldGap)));
      const fy = Math.max(0, Math.min(fieldResolution - 1, Math.round(py / fieldGap)));
      pp[0] = px;
      pp[1] = py;
      fp[0] = fx;
      fp[1] = fy;
      const t = glMatrix.vec2.dist(pp, fp);

      const fi = fy * fieldResolution * 2 + fx * 2;
      fv[0] = state.field[fi];
      fv[1] = state.field[fi + 1];

      pv[0] = state.particles[i + 2];
      pv[1] = state.particles[i + 3];
      glMatrix.vec2.lerp(pv, pv, fv, 10 / t);
      glMatrix.vec2.normalize(pv, pv);
      glMatrix.vec2.rotate(pv, pv, or, random(-0.05, 0.05));
      state.particles[i + 2] = pv[0];
      state.particles[i + 3] = pv[1];

      state.particles[i] += state.particles[i + 2];
      state.particles[i + 1] += state.particles[i + 3];
    }
  }
}

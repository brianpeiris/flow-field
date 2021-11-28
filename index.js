const state = {
  paths: [],
  field: [],
  particles: [],
  drawLastPath: false,
  lastPathPushed: 0,
  settings: {
    backgroundColor: "#8000aa",
    particleColor: "#00eeee",
    numParticles: 2500,
    particleSize: 1,
    particleSizeVariation: 5,
    particleSpeed: 1,
    directionRandomization: 1,
  },
  show: {
    paths: false,
    field: false,
    particles: true,
    fps: false,
    lastPath: true,
  },
};
const actions = {
  resetPaths,
  resetParticles: () => {
    randomizeParticles();
    clearToParticleColor();
  },
  clear: clearToParticleColor,
};

const size = Math.min(innerWidth, 500);
const fieldResolution = 25;
const fieldGap = size / fieldResolution;
const fieldLength = fieldResolution ** 2 * 2;
const particleStride = 7;

const gui = new dat.GUI();
gui.closed = true;
gui.add(state.show, "paths");
gui.add(state.show, "field");
gui.add(state.show, "particles");
gui.add(state.show, "lastPath");
gui.addColor(state.settings, "backgroundColor");
gui.addColor(state.settings, "particleColor");
gui.add(state.settings, "numParticles", 1);
gui.add(state.settings, "particleSize", 1);
gui.add(state.settings, "particleSizeVariation", 0);
gui.add(state.settings, "particleSpeed", 1);
gui.add(state.settings, "directionRandomization", 0);
gui.add(actions, "clear");
gui.add(actions, "resetParticles");
gui.add(actions, "resetPaths");

const stats = Stats();
stats.showPanel(0);
document.body.append(stats.dom);

function setup() {
  createCanvas(size, size);
  pixelDensity(1);
  stroke("white");
  resetField();
  randomizeParticles();
  clearToParticleColor();
}

function mousePressed() {
  if (performance.now() - state.lastPathPushed < 100) return;
  if (mouseX >= 0 && mouseX <= size && mouseY >= 0 && mouseY <= size) {
    state.paths.push([]);
    state.lastPathPushed = performance.now();
  }
}

function touchStarted() {
  if (performance.now() - state.lastPathPushed < 100) return;
  if (mouseX >= 0 && mouseX <= size && mouseY >= 0 && mouseY <= size) {
    state.paths.push([]);
    state.lastPathPushed = performance.now();
  }
}

function clearToParticleColor() {
  fill(color(state.settings.particleColor));
  rect(0, 0, size, size);
}

function resetPaths() {
  state.paths.length = 0;
  resetField();
  randomizeParticles();
}

function randomizeParticles() {
  state.particles.length = state.settings.numParticles;
  for (let i = 0; i < state.settings.numParticles; i += particleStride) {
    // position
    state.particles[i] = random(size);
    state.particles[i + 1] = random(size);

    // velocity
    state.particles[i + 2] = 0;
    state.particles[i + 3] = 0;

    // ttlStart
    state.particles[i + 4] = random(10, 1000);

    // ttl
    state.particles[i + 5] = state.particles[i + 4];

    // size
    state.particles[i + 6] = state.settings.particleSize + random(state.settings.particleSizeVariation);
  }
}

function resetField() {
  for (let i = 0; i < fieldLength; i += 2) {
    // direction
    state.field[i] = 0;
    state.field[i + 1] = 0;
  }
}

function touchEnded() {
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

    for (const path of state.paths) {
      if (path.length < 4) continue;

      for (let j = 0; j < path.length - 2; j += 2) {
        fv[0] = state.field[i];
        fv[1] = state.field[i + 1];
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
  state.drawLastPath = true;
}

function draw() {
  const backgroundColor = color(state.settings.backgroundColor);
  backgroundColor.setAlpha(1);
  background(backgroundColor);

  if (mouseIsPressed && state.paths.length && mouseX >= 0 && mouseX <= size && mouseY >= 0 && mouseY <= size) {
    state.paths[state.paths.length - 1].push(mouseX, mouseY);
  }

  if (state.show.paths) {
    stroke("lightblue");
    for (const path of state.paths) {
      for (let i = 0; i < path.length - 2; i += 2) {
        line(path[i], path[i + 1], path[i + 2], path[i + 3]);
      }
    }
  }

  if (state.drawLastPath) {
    if (state.show.lastPath) {
      stroke("lightblue");
      const path = state.paths[state.paths.length - 1];
      if (path) {
        for (let i = 0; i < path.length - 2; i += 2) {
          line(path[i], path[i + 1], path[i + 2], path[i + 3]);
        }
      }
    }
    state.drawLastPath = false;
  }

  if (state.show.field) {
    stroke("white");
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

    noStroke();

    const particleColor = color(state.settings.particleColor);

    for (let i = 0; i < state.particles.length; i += particleStride) {
      if (state.particles[i + 5] < 0) {
        state.particles[i] = random(size);
        state.particles[i + 1] = random(size);
        state.particles[i + 2] = 0;
        state.particles[i + 3] = 0;
        state.particles[i + 4] = random(500, 1000);
        state.particles[i + 5] = state.particles[i + 4];
      } else {
        state.particles[i + 5] -= 1;
      }

      particleColor.setAlpha(sin((state.particles[i + 5] / state.particles[i + 4]) * Math.PI) * 255);
      fill(particleColor);
      circle(state.particles[i], state.particles[i + 1], state.particles[i + 6]);

      if (state.particles[i] > size * 1.01) state.particles[i] = -size * 0.01;
      if (state.particles[i + 1] > size * 1.01) state.particles[i + 1] = -size * 0.01;
      if (state.particles[i] < 0 - size * 0.01) state.particles[i] = size * 1.01;
      if (state.particles[i + 1] < 0 - size * 0.01) state.particles[i + 1] = size * 1.01;

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
      glMatrix.vec2.rotate(
        pv,
        pv,
        or,
        random(-0.05 * state.settings.directionRandomization, 0.05 * state.settings.directionRandomization)
      );
      state.particles[i + 2] = pv[0];
      state.particles[i + 3] = pv[1];

      state.particles[i] += state.particles[i + 2] * state.settings.particleSpeed;
      state.particles[i + 1] += state.particles[i + 3] * state.settings.particleSpeed;
    }
  }

  stats.update();
}

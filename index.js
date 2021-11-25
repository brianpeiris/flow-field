console.clear();
const paths = [];
const field = [];
const particles = [];
let showPaths = true;
let showField = true;
let showParticles = true;
let info = null;

const size = 500;
const fieldResolution = 25;
const fieldGap = size / fieldResolution;
const fieldLength = fieldResolution ** 2 * 2;
console.log(fieldLength);

function setup() {
  createCanvas(size, size);
  noCursor();
  resetField();
  stroke("white");
  createCheckbox("show paths", showPaths).changed(function () {
    showPaths = this.checked();
  });
  createCheckbox("show field", showField).changed(function () {
    showField = this.checked();
  });
  createCheckbox("show particles", showParticles).changed(function () {
    showParticles = this.checked();
  });
  createButton("clear").mousePressed(() => {
    background(255);
  });
  createButton("reset").mousePressed(reset);
  info = createSpan();
  randomizeParticles();
}
window.addEventListener("contextmenu", (e) => e.preventDefault());
function mousePressed(e) {
  if (mouseButton === LEFT) {
    paths.push([]);
  }
}
function reset() {
  paths.length = 0;
  resetField();
  randomizeParticles();
}
function randomizeParticles() {
  for (let i = 0; i < 5000; i += 5) {
    particles[i] = random(size);
    particles[i + 1] = random(size);
    particles[i + 2] = 0;
    particles[i + 3] = 0;
    particles[i + 4] = random(10, 1000);
  }
}
function resetField() {
  for (let i = 0; i < fieldLength; i += 2) {
    field[i] = 0;
    field[i + 1] = 0;
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
    const fx = field[i];
    const fy = field[i + 1];
    fo[0] = ox;
    fo[1] = oy;
    for (const path of paths) {
      if (path.length < 4) continue;
      for (let j = 0; j < path.length - 2; j += 2) {
        pvec[0] = path[j + 2];
        pvec[1] = path[j + 3];
        pb[0] = path[j];
        pb[1] = path[j + 1];
        glMatrix.vec2.sub(pvec, pvec, pb);
        glMatrix.vec2.normalize(pvec, pvec);
        const t = glMatrix.vec2.dist(pb, fo);
        fv[0] = field[i];
        fv[1] = field[i + 1];
        glMatrix.vec2.lerp(fv, fv, pvec, 2 / t);
        glMatrix.vec2.normalize(fv, fv);
        field[i] = fv[0];
        field[i + 1] = fv[1];
      }
    }
  }
}
function draw() {
  background(255, 0, 0, 0.5);
  circle(mouseX, mouseY, 10);
  if (mouseIsPressed && mouseButton === LEFT) {
    paths[paths.length - 1].push(mouseX, mouseY);
  }
  if (showPaths) {
    stroke("lightblue");
    for (const path of paths) {
      for (let i = 0; i < path.length - 2; i += 2) {
        line(path[i], path[i + 1], path[i + 2], path[i + 3]);
      }
    }
    stroke("white");
  }
  if (showField) {
    for (let i = 0; i < field.length; i += 2) {
      const ox = ((i / 2) % fieldResolution) * fieldGap;
      const oy = Math.floor(i / 2 / fieldResolution) * fieldGap;
      circle(ox, oy, 3);
      line(ox, oy, ox + (field[i] * fieldGap) / 2, oy + (field[i + 1] * fieldGap) / 2);
    }
  }
  if (showParticles) {
    const fp = [];
    const pp = [];
    const fv = [];
    const pv = [];
    const or = [0, 0];
    for (let i = 0; i < particles.length; i += 5) {
      if (particles[i + 4] < 0) {
        particles[i] = random(size);
        particles[i + 1] = random(size);
        particles[i + 2] = 0;
        particles[i + 3] = 0;
        particles[i + 4] = random(500, 1000);
      } else {
        particles[i + 4] -= 1;
      }
      circle(particles[i], particles[i + 1], 1);
      if (particles[i] > size) particles[i] = 0;
      if (particles[i + 1] > size) particles[i + 1] = 0;
      if (particles[i] < 0) particles[i] = size;
      if (particles[i + 1] < 0) particles[i + 1] = size;
      const px = particles[i];
      const py = particles[i + 1];
      const fx = Math.max(0, Math.min(fieldResolution - 1, Math.round(px / fieldGap)));
      const fy = Math.max(0, Math.min(fieldResolution - 1, Math.round(py / fieldGap)));
      pp[0] = px;
      pp[1] = py;
      fp[0] = fx;
      fp[1] = fy;
      const t = glMatrix.vec2.dist(pp, fp);
      const fi = fy * fieldResolution * 2 + fx * 2;
      fv[0] = field[fi];
      fv[1] = field[fi + 1];
      pv[0] = particles[i + 2];
      pv[1] = particles[i + 3];
      glMatrix.vec2.lerp(pv, pv, fv, 10 / t);
      glMatrix.vec2.normalize(pv, pv);
      glMatrix.vec2.rotate(pv, pv, or, random(-0.05, 0.05));
      particles[i + 2] = pv[0];
      particles[i + 3] = pv[1];
      particles[i] += particles[i + 2];
      particles[i + 1] += particles[i + 3];
    }
  }
  {
    /*
		const mx = mouseX;
		const my = mouseY;
		const cx = Math.round(mouseX / fieldGap) * fieldGap;
		const cy = Math.round(mouseY / fieldGap) * fieldGap;
		fill("red");
		circle(cx, cy, 5);
		fill("white");
		info.html([
			Math.round(mouseX / fieldGap),
			Math.round(mouseY / fieldGap),
			cx,
			cy
		]);
		*/
  }
}

/*
This project is licensed under the GNU General Public License v3.0
*/

// Built with p5.js (https://p5js.org/)

let plasticColors; // color palette for plastic
let plasticSpots = []; // saved plastic positions

function setup() {
  let canvas = createCanvas(1920, 1080); // assignment size
  canvas.parent("canvas-container"); // place canvas in the webpage hero section
  pixelDensity(1); // lighter rendering
  noLoop(); // draw once only
  strokeCap(ROUND); // softer line ends

  plasticColors = [
    color(255, 50, 120),   // hot pink
    color(200, 255, 0),    // lime
    color(255, 230, 0),    // neon yellow
    color(255, 180, 200),  // soft pink
    color(255, 220, 180),  // peach
    color(255, 240, 200),  // pale yellow
    color(120, 120, 120),  // grey
    color(180, 180, 180),  // light grey
    color(220, 220, 220),  // very light grey
    color(80, 80, 80)      // dark grey
  ];
}

function draw() {
  background(255); // white background
  plasticSpots = []; // reset saved positions
  drawPlasticFlows(); // draw plastic first
  drawBlueDots(); // draw ocean dots after
}

// ------------------------
// PLASTIC
// ------------------------

function drawPlasticFlows() {
  for (let i = 0; i < 650; i++) { // many flows for density
    let start = getPlasticStartPoint(); // pick start point
    drawPlasticFlow(start.x, start.y); // draw one flow
  }
}

function getPlasticStartPoint() {
  let side = floor(random(10)); // mostly top, sometimes sides
  let offsetAmount = random(-120, 120); // small position shift

  if (side === 0) {
    return createVector(
      random(0, width * 0.12), // near left edge
      constrain(random(height) + offsetAmount, 0, height) // shifted y
    );
  }

  if (side === 1) {
    return createVector(
      random(width * 0.88, width), // near right edge
      constrain(random(height) + offsetAmount, 0, height) // shifted y
    );
  }

  return createVector(
    constrain(random(width) + offsetAmount, 0, width), // shifted x
    random(0, height * 0.12) // near top edge
  );
}

function drawPlasticFlow(x, y) {
  let c = random(plasticColors); // pick one plastic color
  let noiseOffsetX = random(1800); // unique noise offset
  let noiseOffsetY = random(1800); // unique noise offset

  stroke(c); // line color
  strokeWeight(0.1); // very thin line

  for (let i = 0; i < 700; i++) { // long flowing path
    let nextPoint = getNextPlasticPoint(x, y, noiseOffsetX, noiseOffsetY); // next step
    line(x, y, nextPoint.x, nextPoint.y); // draw one segment

    x = nextPoint.x; // update x
    y = nextPoint.y; // update y

    if (i % 10 === 0) { // add shard every few steps
      drawPlasticShard(x, y, nextPoint.angle, c); // draw plastic shape
      savePlasticSpot(x, y); // save point for blue dot logic
    }

    if (outsideCanvas(x, y)) { // stop if path leaves screen
      break;
    }
  }
}

function getNextPlasticPoint(x, y, noiseOffsetX, noiseOffsetY) {
  let angle = noise((x + noiseOffsetX) * 0.03, (y + noiseOffsetY) * 0.02) * TWO_PI * 2; // smooth direction
  angle += random(-0.3, 0.3); // small extra variation

  return {
    x: x + cos(angle) * 10, // move more in x
    y: y + sin(angle) * 5,  // move less in y
    angle: angle // keep angle for shard rotation
  };
}

function drawPlasticShard(x, y, angle, c) {
  let scale = random(0.2, 0.7); // random shard size

  push(); // save drawing state
  translate(x, y); // move to shard position
  rotate(angle); // match flow direction
  noStroke(); // shape only
  fill(c); // same color as flow
  beginShape(); // start irregular shape
  addShardVertices(scale); // add points
  endShape(CLOSE); // close shape
  pop(); // restore drawing state
}

function addShardVertices(scale) {
  vertex(-4 * scale + random(-2, 2), -2 * scale + random(-2, 2)); // top-left
  vertex(3 * scale + random(-3, 3), -5 * scale + random(-3, 3));  // top-right
  vertex(6 * scale + random(-6, 6), random(-6, 6));               // right
  vertex(2 * scale + random(-3, 3), 5 * scale + random(-3, 3));   // bottom-right
  vertex(-5 * scale + random(-2, 2), 2 * scale + random(-2, 2));  // left
}

function savePlasticSpot(x, y) {
  if (plasticSpots.length < 7500) { // limit saved points
    plasticSpots.push(createVector(x, y)); // save position
  }
}

// ------------------------
// BLUE DOTS
// ------------------------

function drawBlueDots() {
  let step = 8; // spacing between dots
  noStroke(); // dots without outline

  for (let y = 0; y < height; y += step) { // row by row
    for (let x = 0; x < width; x += step) { // column by column
      drawBlueDot(x, y, step); // draw one dot
    }
  }
}

function drawBlueDot(x, y, step) {
  let offsetX = getOffsetDotX(x, y, step); // shift odd rows
  let d = getNearestPlasticDistance(offsetX, y); // distance to nearest plastic
  let finalFactor = getDotIntensity(offsetX, y, d); // final dot strength

  if (d > 38 && finalFactor > 0.04) { // skip dots too close or too weak
    let dotStyle = getDotStyle(finalFactor); // get size and color
    fill(dotStyle.r, dotStyle.g, dotStyle.b, dotStyle.alpha); // set dot color
    ellipse(offsetX, y, dotStyle.size, dotStyle.size); // draw one dot
  }
}

function getOffsetDotX(x, y, step) {
  if (floor(y / step) % 2 === 1) { // odd row
    return x + step * 0.5; // offset for staggered grid
  }
  return x; // even row stays same
}

function getDotIntensity(x, y, distanceToPlastic) {
  let cleanFactor = map(distanceToPlastic, 50, 300, 0, 1); // farther = cleaner
  cleanFactor = constrain(cleanFactor, 0, 1); // keep in range

  let xFactor = map(x, 0, width, 0, 1); // left to right
  let yFactor = map(y, 0, height, 0, 1); // top to bottom
  let diagonalFactor = (xFactor * 0.55) + (yFactor * 0.45); // diagonal bias
  diagonalFactor = constrain(diagonalFactor, 0, 1); // keep in range

  return cleanFactor * diagonalFactor; // combine both effects
}

function getDotStyle(finalFactor) {
  return {
    size: map(finalFactor, 0, 1, 1.2, 12.5), // dot size
    alpha: map(finalFactor, 0, 1, 18, 220), // dot opacity
    r: map(finalFactor, 0, 1, 215, 110), // red value
    g: map(finalFactor, 0, 1, 235, 190), // green value
    b: map(finalFactor, 0, 1, 245, 255)  // blue value
  };
}

function getNearestPlasticDistance(x, y) {
  let nearestSq = 999999999; // very large start value

  for (let i = 0; i < plasticSpots.length; i += 4) { // skip some points for speed
    let spot = plasticSpots[i]; // current saved point
    let dx = x - spot.x; // x difference
    let dy = y - spot.y; // y difference
    let dSq = dx * dx + dy * dy; // squared distance

    if (dSq < nearestSq) { // found closer point
      nearestSq = dSq;
    }
  }

  return sqrt(nearestSq); // convert back to real distance
}

// ------------------------

function outsideCanvas(x, y) {
  return x < 0 || x > width || y < 0 || y > height; // check screen bounds
}

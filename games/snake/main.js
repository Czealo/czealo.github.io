//Copyright (c) 2026 Czealo
var canvas  = document.getElementById('game');
var ctx     = canvas.getContext('2d');
var scoreEl = document.getElementById('score');
var bestEl  = document.getElementById('best');

var CELL = 24;
var COLS = canvas.width  / CELL;
var ROWS = canvas.height / CELL;

var STATE = { READY: 0, RUNNING: 1, PAUSED: 2, OVER: 3 };
var state = STATE.READY;

var snake, dir, nextDir, food, score, tickMs, acc, lastTime;
var inputQueue = [];

var best = Number(localStorage.getItem('snake_best') || 0);
bestEl.textContent = best;

if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

function reset() {
  snake = [{ x: 8, y: 12 }, { x: 7, y: 12 }, { x: 6, y: 12 }];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  tickMs = 130;
  acc = 0;
  lastTime = performance.now();
  inputQueue.length = 0;
  scoreEl.textContent = 0;
  spawnFood();
}

function spawnFood() {
  var empty = [];
  for (var y = 0; y < ROWS; y++) {
    for (var x = 0; x < COLS; x++) {
      var occupied = false;
      for (var i = 0; i < snake.length; i++) {
        if (snake[i].x === x && snake[i].y === y) {
          occupied = true;
          break;
        }
      }
      if (!occupied) empty.push({ x: x, y: y });
    }
  }
  food = empty[Math.floor(Math.random() * empty.length)];
}

function step() {
  while (inputQueue.length) {
    var d = inputQueue.shift();
    if (d.x === -dir.x && d.y === -dir.y) continue;
    if (d.x ===  dir.x && d.y ===  dir.y) continue;
    nextDir = d;
    break;
  }
  dir = nextDir;

  var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    return gameOver();
  }

  for (var i = 0; i < snake.length - 1; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) {
      return gameOver();
    }
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    if (score % 5 === 0 && tickMs > 60) tickMs -= 8;
    spawnFood();
  } else {
    snake.pop();
  }
}

function gameOver() {
  state = STATE.OVER;
  if (score > best) {
    best = score;
    localStorage.setItem('snake_best', best);
    bestEl.textContent = best;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#151515';
  ctx.lineWidth = 1;
  for (var i = 1; i < COLS; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL + 0.5, 0);
    ctx.lineTo(i * CELL + 0.5, canvas.height);
    ctx.stroke();
  }
  for (var j = 1; j < ROWS; j++) {
    ctx.beginPath();
    ctx.moveTo(0, j * CELL + 0.5);
    ctx.lineTo(canvas.width, j * CELL + 0.5);
    ctx.stroke();
  }

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.roundRect(food.x * CELL + 3, food.y * CELL + 3, CELL - 6, CELL - 6, 6);
  ctx.fill();

  for (var k = 0; k < snake.length; k++) {
    var s = snake[k];
    ctx.fillStyle = k === 0 ? '#4ade80' : 'hsl(142, 60%, ' + (45 - k * 0.8) + '%)';
    ctx.beginPath();
    ctx.roundRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2, 5);
    ctx.fill();
  }

  if (state !== STATE.RUNNING) {
    ctx.fillStyle = 'rgba(0, 0, 0, .6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#eee';
    ctx.font = 'bold 24px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var text = state === STATE.READY  ? '按任意键开始'
             : state === STATE.PAUSED ? '已暂停 · 空格继续'
             : '游戏结束，按 R 重新开始游戏';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }
}

function loop(now) {
  var dt = now - lastTime;
  lastTime = now;

  if (state === STATE.RUNNING) {
    acc += dt;
    while (acc >= tickMs) {
      step();
      acc -= tickMs;
      if (state === STATE.OVER) break;
    }
  }

  draw();
  requestAnimationFrame(loop);
}

var KEYMAP = {
  ArrowUp:    { x: 0, y: -1 }, w: { x: 0, y: -1 },
  ArrowDown:  { x: 0, y: 1 },  s: { x: 0, y: 1 },
  ArrowLeft:  { x: -1, y: 0 }, a: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },  d: { x: 1, y: 0 }
};

var TOUCHDIR = {
  up:    { x: 0, y: -1 },
  down:  { x: 0, y: 1 },
  left:  { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

function queueDirection(d) {
  if (state === STATE.READY) state = STATE.RUNNING;
  if (state === STATE.RUNNING) inputQueue.push(d);
}

function togglePause() {
  if (state === STATE.RUNNING) state = STATE.PAUSED;
  else if (state === STATE.PAUSED) state = STATE.RUNNING;
  else if (state === STATE.READY) state = STATE.RUNNING;
}

window.addEventListener('keydown', function (e) {
  var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  var d = KEYMAP[k];

  if (d) {
    e.preventDefault();
    queueDirection(d);
    return;
  }

  if (e.code === 'Space') {
    e.preventDefault();
    togglePause();
  }

  if (k === 'r' && state === STATE.OVER) {
    reset();
    state = STATE.READY;
  }
});

window.addEventListener('pointerdown', function (e) {
  var button = e.target.closest('[data-dir]');
  if (!button) return;
  e.preventDefault();
  queueDirection(TOUCHDIR[button.dataset.dir]);
});

window.addEventListener('pointerdown', function (e) {
  var button = e.target.closest('[data-action="pause"]');
  if (!button) return;
  e.preventDefault();
  togglePause();
});

reset();
requestAnimationFrame(loop);
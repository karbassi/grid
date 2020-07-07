const $canvas = document.querySelector('.paper');
const $undoButton = document.querySelector('.undo');
const $redoButton = document.querySelector('.redo');
const $eraseButton = document.querySelector('.erase-all');
const $lineLength = document.querySelector('.line-length');
const $coordinates = document.querySelector('.coordinates');
const $stack = document.querySelector('.stack');

const WIDTH = 700;
const HEIGHT = 700;
const ctx = $canvas.getContext('2d');
const LINE_WIDTH = 3;
const BACKGROUND_COLOR = '#FFFFFF';
const GRID_MAJOR_LINE_COLOR = '#a7c4ce';
const GRID_MINOR_LINE_COLOR = '#c1e2ed';
const DRAW_LINE_COLOR = '#4521cb';
const LINE_CAP = 'round';
const SIZE = 20; // pxspace between each square

let currentLine = null;
let stack = [];
let instruction = stack.length;

// Helpers
const Point = function (x, y) {
  return { x: x, y: y };
};

function distance(line) {
  const a = line.start.y - line.end.y;
  const b = line.start.x - line.end.x;
  return Math.sqrt(a * a + b * b);
}

function isLongEnough(data) {
  return distance(data) <= SIZE / 2;
}

function roundPoint(point) {
  const x = Math.round(point.x / SIZE);
  const y = Math.round(point.y / SIZE);
  return Point(x, y);
}

function snapPoint(point) {
  const a = roundPoint(point);
  const x = a.x * SIZE;
  const y = a.y * SIZE;
  return Point(x, y);
}

//

function writeData() {
  const data = JSON.stringify(stack.slice(0, instruction));
  localStorage.setItem('data', data);
}

function readData() {
  const data = localStorage.getItem('data');
  if (!data) {
    return;
  }
  stack = JSON.parse(data);
  instruction = stack.length;
}

function checkUndoRedoButtons() {
  if (instruction === 0) {
    $undoButton.disabled = true;
  } else {
    $undoButton.disabled = false;
  }

  if (instruction < stack.length) {
    $redoButton.disabled = false;
  } else {
    $redoButton.disabled = true;
  }

  if (stack.length === 0) {
    $eraseButton.disabled = true;
  } else {
    $eraseButton.disabled = false;
  }
}

function undo() {
  if (!stack.length) {
    return;
  }

  instruction--;

  if (instruction <= 0) {
    instruction = 0;
  }

  checkUndoRedoButtons();

  render();
  writeData();
}

function redo() {
  if (!stack.length) {
    return;
  }

  instruction++;

  if (instruction >= stack.length) {
    instruction = stack.length;
  }

  checkUndoRedoButtons();

  render();
  writeData();
}

function displayStack() {
  const items = [];
  stack.forEach(function (line) {
    items.push(
      `<li>
      <span class="start">(${line.start.x / 2}, ${line.start.y / 2})</span> to
      <span class="end">(${line.end.x / 2}, ${line.end.y / 2})</span>
      </li>`
    );
  });

  $stack.innerHTML = items.join('');
}

function drawLine(line) {
  ctx.lineWidth = LINE_WIDTH;
  ctx.strokeStyle = DRAW_LINE_COLOR;
  ctx.beginPath();
  ctx.moveTo(line.start.x, line.start.y);
  ctx.lineTo(line.end.x, line.end.y);
  ctx.stroke();
  ctx.closePath();
}

function drawGrid() {
  ctx.lineWidth = 1;
  ctx.lineCap = LINE_CAP;
  //   ctx.fillStyle = BACKGROUND_COLOR;
  //   ctx.fillRect(0, 0, $canvas.width, $canvas.height);
  ctx.clearRect(0, 0, $canvas.width, $canvas.height);

  // Draw y-grid
  for (let yPos = 0, line = 0; yPos < $canvas.height; yPos += SIZE, line++) {
    if (line % 5 === 0) {
      ctx.strokeStyle = GRID_MAJOR_LINE_COLOR;
    } else {
      ctx.strokeStyle = GRID_MINOR_LINE_COLOR;
    }

    ctx.beginPath();
    ctx.moveTo(0, yPos);
    ctx.lineTo($canvas.width, yPos);
    ctx.stroke();
    ctx.closePath();
  }

  // Draw x-grid
  for (let xPos = 0, line = 0; xPos < $canvas.width; xPos += SIZE, line++) {
    if (line % 5 === 0) {
      ctx.strokeStyle = GRID_MAJOR_LINE_COLOR;
    } else {
      ctx.strokeStyle = GRID_MINOR_LINE_COLOR;
    }

    ctx.beginPath();
    ctx.moveTo(xPos, 0);
    ctx.lineTo(xPos, $canvas.height);
    ctx.stroke();
    ctx.closePath();
  }
}

function drawLines() {
  stack.slice(0, instruction).forEach(function (line) {
    drawLine(line);
  });

  displayStack();

  // Draw current line
  if (!currentLine) {
    $lineLength.innerText = '';
    return;
  }

  const line = {
    start: snapPoint(currentLine.start),
    end: snapPoint(currentLine.end),
  };

  drawLine(line);

  const length = Number(((distance(line) / SIZE) * 10).toFixed(2));
  $lineLength.innerText = `line is ${length} units in length`;
}

function render() {
  $canvas.width = WIDTH;
  $canvas.height = HEIGHT;

  drawGrid();
  drawLines();
}

function erase() {
  stack = [];
  instruction = stack.length;
  writeData();
  render();
  checkUndoRedoButtons();
}

function undoButton(event) {
  // ctrl + z or cmd +z
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
    undo();
  }
}

function onMouseDown(event) {
  event.preventDefault();
  const after = {
    x: event.offsetX,
    y: event.offsetY,
  };
  currentLine = {
    start: after,
    end: after,
  };
  render();
}

function onMouseUp() {
  if (!currentLine) {
    return;
  }

  if (isLongEnough(currentLine)) {
    currentLine = null;
    render();
    return;
  }

  currentLine.start = snapPoint(currentLine.start);
  currentLine.end = snapPoint(currentLine.end);

  if (instruction != stack.length) {
    stack = stack.slice(0, instruction);
  }

  stack.push(currentLine);
  instruction = stack.length;

  currentLine = null;

  render();
  displayStack();
  writeData();
  checkUndoRedoButtons();
}

function onMouseMove(event) {
  const point = Point(
    event.pageX - $canvas.offsetLeft,
    event.pageY - $canvas.offsetTop
  );

  const roundedPoint = roundPoint(point);

  $coordinates.innerText = `(${roundedPoint.x * 10}, ${roundedPoint.y * 10})`;

  if (!currentLine) {
    return;
  }

  currentLine.end = point;
  render();
}

document.addEventListener('keydown', undoButton);
$canvas.addEventListener('mousedown', onMouseDown);
$canvas.addEventListener('mousemove', onMouseMove);
$canvas.addEventListener('mouseup', onMouseUp);
$undoButton.addEventListener('click', undo);
$redoButton.addEventListener('click', redo);
$eraseButton.addEventListener('click', erase);

readData();
render();
checkUndoRedoButtons();

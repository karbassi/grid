const LINES = 100000;

function random(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

for (let x = 0; x < LINES; x++) {
  stack.push({
    start: {
      x: random(0, 700),
      y: random(0, 700),
    },
    end: {
      x: random(0, 700),
      y: random(0, 700),
    },
  });
}

instruction = stack.length;
writeData();
render();

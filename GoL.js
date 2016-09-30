let previous = Date.now();
let lag = 0;
let FPS = 4;
let MS_PER_UPDATE = 1000 / FPS;

CanvasRenderingContext2D.prototype.drawFillRect = function(
  color, width, height, xOffset, yOffset) {
    this.lineCap = 'butt';
    this.lineJoin = 'miter';

    this.fillStyle = color;
    this.fillRect(xOffset, yOffset, width, height);

    return this;
};

CanvasRenderingContext2D.prototype.drawLine = function(
  color, width, lineDash, beginPointCoord, endPointCoord, dashOffset) {
    this.strokeStyle = color;
    this.lineWidth = width;
    this.lineCap = 'butt';
    this.lineJoin = 'miter';
    this.miterLimit = 1;

    this.lineDashOffset = dashOffset;
    this.setLineDash(lineDash);

    this.beginPath();
    this.moveTo(beginPointCoord.x, beginPointCoord.y);
    this.lineTo(endPointCoord.x, endPointCoord.y);
    this.stroke();

    return this;
};

let canvas = document.getElementById('main-canvas');
let cContext = canvas.getContext('2d');

canvas.width = canvas.height = 500;

canvas.hCenter = canvas.width / 2;
canvas.vCenter = canvas.height / 2;

let line_width = 2;
let cell_size = 20;
let grid_size = canvas.width / cell_size;
let foregroundColor = '#393F4C';
let backgroundColor = '#F9F9F9';

class Coord {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}

function drawGrid(cellSize, cellsNum) {
    for (let i = 0; i <= cellsNum; ++i) {
        // Draw vertical lines
        cContext.drawLine(
            foregroundColor, line_width, [0, 0], new Coord(i * cellSize, 0), new Coord(i * cellSize, canvas.height), 0);

        // Draw horizontal lines
        cContext.drawLine(
            foregroundColor, line_width, [0, 0], new Coord(0, i * cellSize), new Coord(canvas.width, i * cellSize), 0);
    }
}

function fillGrid(grid) {
    for (let i = 0; i < grid.length; ++i) {
        for (let j = 0; j < grid.length; ++j) {
            if (grid[i][j]) {
                cContext.drawFillRect(
                    '#93FE00',
                    // '#00B6F0',
                    cell_size - line_width,
                    cell_size - line_width,
                    (j * cell_size) + (line_width / 2),
                    (i * cell_size) + (line_width / 2)
                );
            }
        }
    }
}

function initGrid(size) {
    let grid = [];
    for (let i = 0; i < size; ++i) {
        grid.push([]);
        for (let j = 0; j < size; ++j) {
            grid[i].push(0);
        }
    }

    return grid;
}

//  ________________________________
// |          |          |          |
// | i-1, j-1 |  i-1, j  | i-1, j+1 |
// |__________|__________|__________|
// |          |          |          |
// |  i, j-1  |   i, j   |  i, j+1  |
// |__________|__________|__________|
// |          |          |          |
// | i+1, j-1 |  i+1, j  | i+1, j+1 |
// |__________|__________|__________|
//
function livingNeighbours(grid, row, col) {
    let neighboursCoord = [
        new Coord(row - 1, col - 1),
        new Coord(row - 1, col),
        new Coord(row - 1, col + 1),

        new Coord(row, col - 1),
        new Coord(row, col + 1),

        new Coord(row + 1, col - 1),
        new Coord(row + 1, col),
        new Coord(row + 1, col + 1)
    ];

    let neighboursAlive = 0;
    for (let k = 0; k < neighboursCoord.length; ++k) {
        if ((neighboursCoord[k].x >= 0) && (neighboursCoord[k].x < grid_size)) {
            if ((neighboursCoord[k].y >= 0) && (neighboursCoord[k].y < grid_size)) {
                if (grid[neighboursCoord[k].x][neighboursCoord[k].y]) {
                    ++neighboursAlive;
                }
            }
        }
    }

    return neighboursAlive;
}

function advanceGeneration(grid) {
    let newGrid = initGrid(grid_size);

    for (let i = 0; i < grid_size; ++i) {
        for (let j = 0; j < grid_size; ++j) {
            let neighboursAlive = livingNeighbours(grid, i, j);
            if (grid[i][j]) {
                // Dead in the next generation.
                // Underpopulation (< 2). Overcrowding (> 2).
                if ((neighboursAlive < 2) || (neighboursAlive > 3)) {
                    newGrid[i][j] = 0;
                } else if ((neighboursAlive >= 2) && (neighboursAlive <= 3)) {
                    newGrid[i][j] = 1; // Stays alive in the next generation.
                }
            } else {
                // Comes to life in the next generation.
                if (neighboursAlive === 3) {
                    newGrid[i][j] = 1;
                }
            }
        }
    }

    return newGrid;
}

let grid = initGrid(grid_size);

document.addEventListener('keydown', function(event) {
    if (event.key === 'p') {
        isPaused = !isPaused;
    }
});

function getMousePosition(event) {
    let rect = canvas.getBoundingClientRect();
    let rootElement = document.documentElement;
    let xMousePos = event.clientX - rect.left - rootElement.scrollLeft;
    let yMousePos = event.clientY - rect.top - rootElement.scrollTop;

    return {
        x: xMousePos,
        y: yMousePos
    };
}

let previousCell = new Coord(-1, -1);
let currentCell = new Coord(-1, -1);

canvas.addEventListener('click', function(event) {
    let mousePos = getMousePosition(event);

    if (isPaused) {
        let gridCellx = Math.ceil(mousePos.x / cell_size) - 1;
        let gridCelly = Math.ceil(mousePos.y / cell_size) - 1;

        currentCell = new Coord(gridCellx, gridCelly);

        if ((currentCell.x !== previousCell.x) || (currentCell.y !== previousCell.y)) {
            // Bitwise XOR. Turns 0 into 1 and 1 into 0 without converting to boolean values.
            grid[gridCelly][gridCellx] = grid[gridCelly][gridCellx] ^ 1;
            previousCell = currentCell;
        }
    }
});

let isClicking = false;

canvas.addEventListener('mousedown', function(event) {
    isClicking = true;
});

canvas.addEventListener('mousemove', function(event) {
    if (isClicking && isPaused) {
        let mousePos = getMousePosition(event);

        let gridCellx = Math.ceil(mousePos.x / cell_size) - 1;
        let gridCelly = Math.ceil(mousePos.y / cell_size) - 1;

        currentCell = new Coord(gridCellx, gridCelly);

        if ((currentCell.x !== previousCell.x) || (currentCell.y !== previousCell.y)) {
            // Bitwise XOR. Turns 0 into 1 and 1 into 0 without converting to boolean values.
            grid[gridCelly][gridCellx] = grid[gridCelly][gridCellx] ^ 1;
            previousCell = currentCell;
        }
    }
});

document.addEventListener('mouseup', function(event) {
    isClicking = false;
});

let isPaused = true;

function update() {
    if (isPaused) return;
    grid = advanceGeneration(grid);
}

function render() {
    cContext.drawFillRect(backgroundColor, canvas.width, canvas.height, 0, 0);
    drawGrid(cell_size, grid_size);
    fillGrid(grid);
}

function loop() {
    let current = Date.now();
    let elapsed = current - previous;
    previous = current;
    lag += elapsed;

    requestAnimationFrame(loop);

    // Process input here

    while (lag >= MS_PER_UPDATE) {
        update();

        lag -= MS_PER_UPDATE;
    }

    render();
}

(function() {
    loop();
})();
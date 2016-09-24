class Grid {
    constructor(cellSize, cellsNum) {
        this.cellSize = cellSize;
        this.cellsNum = cellsNum;
        this._lineWidth = 2;
    }

    drawGrid() {
        for (let i = this.cellSize; i < this.cellsNum; i += this.cellSize) {
            cContext.drawLine('white', 2, [0, 0], new Coord(i, 0), new Coord(i, canvas.height), 0);
        }

        for (let i = this.cellSize; i < this.cellsNum; i += this.cellSize) {
            cContext.drawLine('white', 2, [0, 0], new Coord(0, i), new Coord(canvas.width, i), 0);
        }
    }
}
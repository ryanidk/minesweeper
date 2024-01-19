const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');

let size = 40;
let rows = 8;
let cols = 8;
let mineCount = 10;
let board = [];
let mineLocations = [];
let timer;
let seconds = 0;
let firstClick = true;
let gameActive = false;
let currentDifficulty = 'medium';
let bombed = false;

document.getElementById('close-tooltip').addEventListener('click', hideTooltip);

document.getElementById('reset-button').addEventListener('click', () => setDifficulty(currentDifficulty));
canvas.addEventListener('click', handleLeftClick);
canvas.addEventListener('contextmenu', handleRightClick);

function initBoard() {
    board = [];
    mineLocations = [];
    for (let x = 0; x < cols; x++) {
        board[x] = [];
        for (let y = 0; y < rows; y++) {
            board[x][y] = {
                x,
                y,
                mine: false,
                flagged: false,
                revealed: false,
                adjacent: 0
            };
        }
    }
}

function setDifficulty(level) {
    firstClick = true;
    gameActive = false;
    currentDifficulty = level;
    clearInterval(timer);
    document.getElementById('timer').textContent = '000';
    seconds = 0;
    bombed = false;
    document.getElementById('reset-button').textContent = '😊';

    switch (level) {
        case 'easy':
            cols = rows = 9;
            mineCount = 10;
            break;
        case 'medium':
            cols = rows = 16;
            mineCount = 40;
            break;
        case 'hard':
            cols = 30;
            rows = 16;
            mineCount = 99;
            break;
    }

    if (level === 'hard') {
        canvas.width = 960;
        canvas.height = (960 / cols) * rows;
        size = 960 / cols;
    } else {
        size = 640 / cols;
        canvas.width = 640;
        canvas.height = size * rows;
    }
    initBoard();
    drawBoard();
    updateMineCounter();
}

function placeMines(firstClickCoords) {
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
        const x = Math.floor(Math.random() * cols);
        const y = Math.floor(Math.random() * rows);
        if (!board[x][y].mine && !(x >= firstClickCoords.x - 1 && x <= firstClickCoords.x + 1 && y >= firstClickCoords.y - 1 && y <= firstClickCoords.y + 1)) {
            board[x][y].mine = true;
            mineLocations.push({ x, y });
            minesPlaced++;
        }
    }
    calculateNumbers();
}

function calculateNumbers() {
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            if (board[x][y].mine) continue;
            let mineCount = 0;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && board[nx][ny].mine) {
                        mineCount++;
                    }
                }
            }
            board[x][y].adjacent = mineCount;
        }
    }
}

function drawBoard() {

    const numberColors = ["", "blue", "green", "red", "navy", "maroon", "turquoise", "black", "gray"];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            const cell = board[x][y];
            const posX = x * size;
            const posY = y * size;
            ctx.fillStyle = cell.revealed ? "#bdbdbd" : "#9e9e9e";
            ctx.fillRect(posX, posY, size, size);
            ctx.strokeRect(posX, posY, size, size);

            if (cell.revealed) {
                if (cell.mine) {

                    ctx.fillStyle = "#bdbdbd";
                    ctx.fillRect(posX, posY, size, size);
                    ctx.strokeRect(posX, posY, size, size);
                    ctx.fillStyle = "black";
                    ctx.beginPath();
                    ctx.arc(posX + size / 2, posY + size / 2, size / 4, 0, Math.PI * 2);
                    ctx.fill();
                } else if (cell.adjacent > 0) {

                    ctx.fillStyle = numberColors[cell.adjacent];
                    ctx.font = `bold ${size / 2}px Inter`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(cell.adjacent, posX + size / 2, posY + size / 2);
                }
            } else if (cell.flagged) {
                if (cell.incorrectFlag) {
                    ctx.fillStyle = "#bdbdbd";
                    ctx.fillRect(posX, posY, size, size);
                    ctx.strokeRect(posX, posY, size, size);

                    ctx.fillStyle = "black"
                    ctx.beginPath();
                    ctx.arc(posX + size / 2, posY + size / 2, size / 4, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.strokeStyle = "red";
                    ctx.lineWidth = 5;
                    ctx.beginPath();
                    ctx.moveTo(posX + 10, posY + 10)
                    ctx.lineTo(posX + size - 10, posY + size - 10);
                    ctx.moveTo(posX + size - 10, posY + 10);
                    ctx.lineTo(posX + 10, posY + size - 10);
                    ctx.closePath();
                    ctx.stroke();

                    ctx.strokeStyle = "black";
                    ctx.lineWidth = 1;
                } else {

                    ctx.fillStyle = "#9e9e9e";
                    ctx.fillRect(posX, posY, size, size);
                    ctx.strokeRect(posX, posY, size, size);

                    ctx.fillStyle = "red";
                    ctx.beginPath();
                    ctx.moveTo(posX + size / 2, posY + size / 4);
                    ctx.lineTo(posX + size / 4, posY + size / 2);
                    ctx.lineTo(posX + size / 2, posY + (size * 3) / 4);
                    ctx.lineTo(posX + (size * 3) / 4, posY + size / 2);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }
    }
}


function handleLeftClick(event) {
    if (!gameActive && !bombed) {
        setDifficulty(currentDifficulty);
        startGame();
    } else if (bombed) {
        return
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const cellX = Math.floor(x / size);
    const cellY = Math.floor(y / size);

    if (firstClick) {
        firstClick = false;
        placeMines({ x: cellX, y: cellY });
        gameActive = true;
    }

    const cell = board[cellX][cellY];
    if (cell.revealed || cell.flagged) return;

    cell.revealed = true;
    if (cell.mine) {
        gameOver();
    } else {
        if (cell.adjacent === 0) {
            revealAdjacent(cellX, cellY);
        }
        drawBoard();
    }

    checkWinCondition();
}

function handleRightClick(event) {
    event.preventDefault();
    if (!gameActive || firstClick) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const cellX = Math.floor(x / size);
    const cellY = Math.floor(y / size);

    const cell = board[cellX][cellY];
    if (cell.revealed) return;

    cell.flagged = !cell.flagged;



    updateMineCounter();
    drawBoard();
    checkWinCondition();
}

function updateMineCounter() {
    let flaggedCount = 0;
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            if (board[x][y].flagged) {
                flaggedCount++;
            }
        }
    }


    const minesLeft = mineCount - flaggedCount;
    document.getElementById('mine-counter').textContent = minesLeft.toString().padStart(3, '0');
}

function revealAdjacent(x, y) {
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                const adjacentCell = board[nx][ny];
                if (!adjacentCell.revealed && !adjacentCell.flagged) {
                    adjacentCell.revealed = true;
                    if (adjacentCell.adjacent === 0) {
                        revealAdjacent(nx, ny);
                    }
                }
            }
        }
    }
}

function checkWinCondition() {
    let revealedCells = 0;
    let unrevealedMines = 0;

    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            const cell = board[x][y];
            if (cell.revealed && !cell.mine) {
                revealedCells++;
            }
            if (!cell.revealed && cell.mine) {
                unrevealedMines++;
            }
        }
    }
    if (revealedCells === (cols * rows - mineCount)) {
        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                const cell = board[x][y];
                if (!cell.revealed && cell.mine) {
                    cell.flagged = true;
                }
            }
        }
        drawBoard();
        gameActive = false;
        bombed = true;
        clearInterval(timer);
        document.getElementById('reset-button').textContent = '😎';
        showTooltip(`You won in ${seconds} seconds!`);
    }
}

function gameOver() {
    gameActive = false;
    clearInterval(timer);
    document.getElementById('reset-button').textContent = '😵';

    mineLocations.forEach(loc => {
        const cell = board[loc.x][loc.y];
        if (!cell.flagged) {
            cell.revealed = true;
        }
    });

    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            const cell = board[x][y];
            if (cell.flagged && !cell.mine) {
                cell.incorrectFlag = true;
            }
        }
    }

    drawBoard();
    bombed = true;
    showTooltip("You lose!");
}


function updateTimer() {
    if (!gameActive) return;
    seconds++;
    document.getElementById('timer').textContent = seconds.toString().padStart(3, '0');
}

function resetGame() {
    firstClick = true;
    gameActive = true;
    mineCount = 40;
    mineLocations = [];
    seconds = 0;
    document.getElementById('reset-button').textContent = '😊';
    clearInterval(timer);
    initBoard();
    drawBoard();
}



function startGame() {
    gameActive = true;
    timer = setInterval(updateTimer, 1000);
    document.getElementById('reset-button').textContent = '😐';
}

initBoard();

function showTooltip(message) {
    const tooltip = document.getElementById('tooltip');
    const tooltipMessage = document.getElementById('tooltip-message');
    tooltipMessage.textContent = message;
    tooltip.style.display = 'block';
    setTimeout(hideTooltip, 3000);
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.display = 'none';
}

setDifficulty('medium');

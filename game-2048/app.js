/**
 * 2048 ゲームロジック
 */
document.addEventListener('DOMContentLoaded', () => {
  const size = 4;
  let grid = [];
  let score = 0;
  let bestScore = parseInt(localStorage.getItem('2048_best_score') || '0', 10);
  let history = [];
  let hasWon = false;
  let isGameOver = false;

  const tileContainer = document.getElementById('tile-container');
  const scoreValEl = document.getElementById('score-val');
  const bestValEl = document.getElementById('best-val');
  const undoBtn = document.getElementById('undo-btn');
  const restartBtn = document.getElementById('restart-btn');
  const gameOverModal = document.getElementById('game-over-modal');
  const finalScoreVal = document.getElementById('final-score-val');
  const modalRetryBtn = document.getElementById('modal-retry-btn');
  const winModal = document.getElementById('win-modal');
  const keepGoingBtn = document.getElementById('keep-going-btn');
  const modalWinRestartBtn = document.getElementById('modal-win-restart-btn');
  const confettiCanvas = document.getElementById('confetti-canvas');

  bestValEl.textContent = bestScore;

  // 初期化
  function initGame() {
    grid = Array.from({ length: size }, () => Array(size).fill(0));
    score = 0;
    history = [];
    hasWon = false;
    isGameOver = false;

    gameOverModal.classList.remove('active');
    winModal.classList.remove('active');
    stopConfetti();

    addRandomTile();
    addRandomTile();
    updateUI();
  }

  function addRandomTile() {
    const emptyCells = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length > 0) {
      const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  function updateUI() {
    scoreValEl.textContent = score;
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('2048_best_score', bestScore.toString());
      bestValEl.textContent = bestScore;
    }
    undoBtn.disabled = history.length === 0 || isGameOver;

    // タイル描画
    tileContainer.innerHTML = '';
    const containerWidth = tileContainer.clientWidth;
    const gap = 8;
    const tileSize = (containerWidth - gap * 3) / 4;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const val = grid[r][c];
        if (val > 0) {
          const tile = document.createElement('div');
          tile.className = `tile tile-${val <= 2048 ? val : 'super'}`;
          tile.textContent = val;
          tile.style.width = `${tileSize}px`;
          tile.style.height = `${tileSize}px`;
          tile.style.transform = `translate(${c * (tileSize + gap)}px, ${r * (tileSize + gap)}px)`;
          tileContainer.appendChild(tile);
        }
      }
    }
  }

  // スライド & 合体
  function slide(row) {
    let arr = row.filter(val => val !== 0);
    let gained = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        gained += arr[i];
        arr[i + 1] = 0;
        i++;
      }
    }
    arr = arr.filter(val => val !== 0);
    while (arr.length < size) arr.push(0);
    return { row: arr, gained };
  }

  function move(direction) {
    if (isGameOver) return;

    // 状態を保存
    const prevGrid = grid.map(r => [...r]);
    const prevScore = score;
    let moved = false;
    let turnGained = 0;

    if (direction === 'LEFT' || direction === 'RIGHT') {
      for (let r = 0; r < size; r++) {
        let row = [...grid[r]];
        if (direction === 'RIGHT') row.reverse();
        const res = slide(row);
        if (direction === 'RIGHT') res.row.reverse();

        for (let c = 0; c < size; c++) {
          if (grid[r][c] !== res.row[c]) moved = true;
          grid[r][c] = res.row[c];
        }
        turnGained += res.gained;
      }
    } else { // UP or DOWN
      for (let c = 0; c < size; c++) {
        let col = [];
        for (let r = 0; r < size; r++) col.push(grid[r][c]);
        if (direction === 'DOWN') col.reverse();
        const res = slide(col);
        if (direction === 'DOWN') res.row.reverse();

        for (let r = 0; r < size; r++) {
          if (grid[r][c] !== res.row[r]) moved = true;
          grid[r][c] = res.row[r];
        }
        turnGained += res.gained;
      }
    }

    if (moved) {
      history.push({ grid: prevGrid, score: prevScore });
      score += turnGained;
      addRandomTile();
      updateUI();
      checkGameStatus();
    }
  }

  function undo() {
    if (history.length > 0) {
      const prev = history.pop();
      grid = prev.grid.map(r => [...r]);
      score = prev.score;
      isGameOver = false;
      gameOverModal.classList.remove('active');
      updateUI();
    }
  }

  function checkGameStatus() {
    // 2048 達成チェック
    if (!hasWon) {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (grid[r][c] === 2048) {
            hasWon = true;
            winModal.classList.add('active');
            startConfetti();
            return;
          }
        }
      }
    }

    // 空きマスがあるか
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 0) return;
      }
    }

    // 隣り合うセルで合体可能か
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const val = grid[r][c];
        if (r < size - 1 && grid[r + 1][c] === val) return;
        if (c < size - 1 && grid[r][c + 1] === val) return;
      }
    }

    // ゲームオーバー
    isGameOver = true;
    finalScoreVal.textContent = score;
    gameOverModal.classList.add('active');
  }

  // ===============================
  // キーボード & スワイプ イベント
  // ===============================
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      e.preventDefault(); move('LEFT');
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      e.preventDefault(); move('RIGHT');
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault(); move('UP');
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      e.preventDefault(); move('DOWN');
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault(); undo();
    }
  });

  let touchStartX = 0;
  let touchStartY = 0;
  const boardEl = document.getElementById('game-board');

  boardEl.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  boardEl.addEventListener('touchend', (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    const minSwipe = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipe) {
        move(deltaX > 0 ? 'RIGHT' : 'LEFT');
      }
    } else {
      if (Math.abs(deltaY) > minSwipe) {
        move(deltaY > 0 ? 'DOWN' : 'UP');
      }
    }
  });

  undoBtn.addEventListener('click', undo);
  restartBtn.addEventListener('click', initGame);
  modalRetryBtn.addEventListener('click', initGame);
  modalWinRestartBtn.addEventListener('click', initGame);
  keepGoingBtn.addEventListener('click', () => {
    winModal.classList.remove('active');
    stopConfetti();
  });

  // Canvas 紙吹雪
  let confettiAnimId = null;
  function startConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      size: Math.random() * 8 + 4,
      color: ['#f59e0b', '#ef4444', '#10b981', '#6366f1', '#ec4899'][Math.floor(Math.random() * 5)],
      speedY: Math.random() * 3 + 2,
      speedX: (Math.random() - 0.5) * 3
    }));

    function loop() {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      particles.forEach(p => {
        p.y += p.speedY; p.x += p.speedX;
        if (p.y > confettiCanvas.height) { p.y = -10; p.x = Math.random() * confettiCanvas.width; }
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      confettiAnimId = requestAnimationFrame(loop);
    }
    loop();
  }

  function stopConfetti() {
    if (confettiAnimId) cancelAnimationFrame(confettiAnimId);
    const ctx = confettiCanvas.getContext('2d');
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }

  window.addEventListener('resize', updateUI);

  // 開始
  initGame();
});

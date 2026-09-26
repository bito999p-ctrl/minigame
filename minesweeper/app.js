/**
 * マインスイーパー ゲームロジック
 */
document.addEventListener('DOMContentLoaded', () => {
  const configs = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 }
  };

  let currentDiff = 'easy';
  let rows = 9;
  let cols = 9;
  let totalMines = 10;

  let board = []; // { isMine, isOpened, isFlagged, count }
  let isFirstClick = true;
  let isGameOver = false;
  let timerVal = 0;
  let timerInterval = null;
  let flagMode = false;

  // DOM要素
  const boardEl = document.getElementById('mine-board');
  const mineCounterEl = document.getElementById('mine-counter');
  const timerEl = document.getElementById('timer');
  const faceBtn = document.getElementById('face-btn');
  const difficultySelect = document.getElementById('difficulty-select');
  const flagModeBtn = document.getElementById('flag-mode-btn');
  const flagModeText = document.getElementById('flag-mode-text');
  const resultModal = document.getElementById('result-modal');
  const modalIcon = document.getElementById('modal-icon');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalTimeVal = document.getElementById('modal-time-val');
  const modalRestartBtn = document.getElementById('modal-restart-btn');
  const confettiCanvas = document.getElementById('confetti-canvas');

  function initGame() {
    const config = configs[currentDiff];
    rows = config.rows;
    cols = config.cols;
    totalMines = config.mines;

    isFirstClick = true;
    isGameOver = false;
    clearInterval(timerInterval);
    timerVal = 0;
    updateTimerDisplay();
    updateFace('😊');
    updateMineCounter();

    resultModal.classList.remove('active');
    stopConfetti();

    // 盤面データ生成
    board = Array.from({ length: rows }, () => 
      Array.from({ length: cols }, () => ({
        isMine: false,
        isOpened: false,
        isFlagged: false,
        count: 0
      }))
    );

    renderBoard();
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${cols}, 32px)`;
    boardEl.style.gridTemplateRows = `repeat(${rows}, 32px)`;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellEl = document.createElement('div');
        cellEl.className = 'cell';
        cellEl.dataset.row = r;
        cellEl.dataset.col = c;

        // 左クリック / タップ
        cellEl.addEventListener('click', (e) => handleClick(r, c));

        // 右クリック（旗立て）
        cellEl.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          toggleFlag(r, c);
        });

        // 長押し対応（モバイルでの旗立て）
        let pressTimer = null;
        cellEl.addEventListener('touchstart', (e) => {
          pressTimer = setTimeout(() => {
            toggleFlag(r, c);
            pressTimer = null;
          }, 450);
        }, { passive: true });

        cellEl.addEventListener('touchend', () => {
          if (pressTimer) clearTimeout(pressTimer);
        });

        boardEl.appendChild(cellEl);
      }
    }
  }

  function generateMines(firstR, firstC) {
    let placed = 0;
    while (placed < totalMines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);

      // 初手クリック位置およびその周囲8マスには置かない（初手セーフ）
      const isAroundFirst = Math.abs(r - firstR) <= 1 && Math.abs(c - firstC) <= 1;
      if (!board[r][c].isMine && !isAroundFirst) {
        board[r][c].isMine = true;
        placed++;
      }
    }

    // 周囲の地雷数をカウント
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!board[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
                count++;
              }
            }
          }
          board[r][c].count = count;
        }
      }
    }

    startTimer();
  }

  function handleClick(r, c) {
    if (isGameOver) return;

    if (flagMode) {
      toggleFlag(r, c);
      return;
    }

    const cell = board[r][c];
    if (cell.isFlagged) return;

    if (cell.isOpened) {
      // コードクリック（すでに開いている数字マスをクリック）
      chordOpen(r, c);
      return;
    }

    if (isFirstClick) {
      isFirstClick = false;
      generateMines(r, c);
    }

    openCell(r, c);
  }

  function openCell(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    const cell = board[r][c];
    if (cell.isOpened || cell.isFlagged) return;

    cell.isOpened = true;
    const cellEl = getCellEl(r, c);
    cellEl.classList.add('opened');

    if (cell.isMine) {
      // 地雷爆発！
      cellEl.classList.add('exploded');
      cellEl.textContent = '💣';
      handleGameOver(false);
      return;
    }

    if (cell.count > 0) {
      cellEl.textContent = cell.count;
      cellEl.dataset.num = cell.count;
    } else {
      // 0マス：周囲8マスを連鎖オープン
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) openCell(r + dr, c + dc);
        }
      }
    }

    checkWinCondition();
  }

  function chordOpen(r, c) {
    const cell = board[r][c];
    if (cell.count === 0) return;

    // 周囲の旗の数をカウント
    let flagCount = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isFlagged) {
          flagCount++;
        }
      }
    }

    if (flagCount === cell.count) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !board[nr][nc].isFlagged) {
            openCell(nr, nc);
          }
        }
      }
    }
  }

  function toggleFlag(r, c) {
    if (isGameOver) return;
    const cell = board[r][c];
    if (cell.isOpened) return;

    cell.isFlagged = !cell.isFlagged;
    const cellEl = getCellEl(r, c);
    cellEl.classList.toggle('flagged', cell.isFlagged);
    cellEl.textContent = cell.isFlagged ? '🚩' : '';
    updateMineCounter();
  }

  function updateMineCounter() {
    let flags = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c].isFlagged) flags++;
      }
    }
    const remaining = totalMines - flags;
    mineCounterEl.textContent = remaining.toString().padStart(3, '0');
  }

  function checkWinCondition() {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!board[r][c].isMine && !board[r][c].isOpened) return;
      }
    }
    handleGameOver(true);
  }

  function handleGameOver(isWin) {
    isGameOver = true;
    clearInterval(timerInterval);

    if (isWin) {
      updateFace('😎');
      modalIcon.textContent = '🎉';
      modalTitle.textContent = '任務完了！';
      modalDesc.textContent = 'すべての地雷を回避して安全を確保しました！';
      modalTimeVal.textContent = `${timerVal} 秒`;
      resultModal.classList.add('active');
      startConfetti();
    } else {
      updateFace('💀');
      // 残りの地雷をすべて表示
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (board[r][c].isMine) {
            const el = getCellEl(r, c);
            if (!board[r][c].isFlagged) {
              el.classList.add('opened');
              el.textContent = '💣';
            }
          }
        }
      }
    }
  }

  function getCellEl(r, c) {
    return boardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
  }

  function updateFace(emoji) { faceBtn.textContent = emoji; }

  // タイマー
  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (timerVal < 999) {
        timerVal++;
        updateTimerDisplay();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    timerEl.textContent = timerVal.toString().padStart(3, '0');
  }

  // イベントリスナー
  difficultySelect.addEventListener('change', (e) => {
    currentDiff = e.target.value;
    initGame();
  });

  faceBtn.addEventListener('click', initGame);
  modalRestartBtn.addEventListener('click', initGame);

  flagModeBtn.addEventListener('click', () => {
    flagMode = !flagMode;
    flagModeBtn.classList.toggle('active', flagMode);
    flagModeText.textContent = flagMode ? 'ON' : 'OFF';
  });

  // 紙吹雪
  let confettiAnimId = null;
  function startConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      size: Math.random() * 8 + 4,
      color: ['#38bdf8', '#34d399', '#f87171', '#fbbf24', '#818cf8'][Math.floor(Math.random() * 5)],
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

  initGame();
});

/**
 * ナンプレ Webアプリケーション メインスクリプト
 */
document.addEventListener('DOMContentLoaded', () => {
  const sudokuEngine = new SudokuGenerator();

  // ゲーム状態
  let initialBoard = [];
  let currentBoard = [];
  let solutionBoard = [];
  let notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
  let selectedCell = null; // { r, c }
  let isPencilMode = false;
  let history = [];
  let historyIndex = -1;
  let isPaused = false;
  let timerSeconds = 0;
  let timerInterval = null;
  let currentDifficulty = 'medium';

  // DOM要素
  const boardEl = document.getElementById('sudoku-board');
  const keypadEl = document.getElementById('keypad');
  const difficultySelect = document.getElementById('difficulty-select');
  const timerText = document.getElementById('timer-text');
  const pauseBtn = document.getElementById('pause-btn');
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  const eraseBtn = document.getElementById('erase-btn');
  const pencilBtn = document.getElementById('pencil-btn');
  const pencilIndicator = document.getElementById('pencil-indicator');
  const hintBtn = document.getElementById('hint-btn');
  const newGameBtn = document.getElementById('new-game-btn');
  const winModal = document.getElementById('win-modal');
  const modalDiff = document.getElementById('modal-diff');
  const modalTime = document.getElementById('modal-time');
  const modalRestartBtn = document.getElementById('modal-restart-btn');
  const confettiCanvas = document.getElementById('confetti-canvas');

  // ===============================
  // 初期化 & ゲーム開始
  // ===============================
  function init() {
    createBoardGrid();
    createKeypad();
    setupEventListeners();
    startNewGame(currentDifficulty);
  }

  function startNewGame(diff) {
    currentDifficulty = diff;
    const { puzzle, solution } = sudokuEngine.generatePuzzle(diff);
    initialBoard = sudokuEngine.copyBoard(puzzle);
    currentBoard = sudokuEngine.copyBoard(puzzle);
    solutionBoard = sudokuEngine.copyBoard(solution);
    notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
    
    selectedCell = null;
    history = [];
    historyIndex = -1;
    saveState(); // 初期状態を履歴にプッシュ

    // タイマーリセット
    resetTimer();
    startTimer();

    // 勝利モーダル非表示
    winModal.classList.remove('active');
    stopConfetti();

    // 描画更新
    renderBoard();
    updateKeypadCounts();
    updateControls();
  }

  // ===============================
  // グリッド & テンキー生成
  // ===============================
  function createBoardGrid() {
    boardEl.innerHTML = '';
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;

        // メモ表示用3x3小グリッド
        const notesGrid = document.createElement('div');
        notesGrid.className = 'notes-grid';
        for (let n = 1; n <= 9; n++) {
          const noteNum = document.createElement('span');
          noteNum.className = 'note-num';
          noteNum.dataset.note = n;
          notesGrid.appendChild(noteNum);
        }
        cell.appendChild(notesGrid);

        cell.addEventListener('click', () => selectCell(r, c));
        boardEl.appendChild(cell);
      }
    }
  }

  function createKeypad() {
    keypadEl.innerHTML = '';
    for (let i = 1; i <= 9; i++) {
      const key = document.createElement('button');
      key.className = 'num-key';
      key.dataset.num = i;
      key.innerHTML = `${i}<span class="key-count" id="key-count-${i}">9</span>`;
      key.addEventListener('click', () => handleNumberInput(i));
      keypadEl.appendChild(key);
    }
  }

  // ===============================
  // 描画処理
  // ===============================
  function renderBoard() {
    const conflicts = sudokuEngine.findConflicts(currentBoard);
    const selectedVal = selectedCell ? currentBoard[selectedCell.r][selectedCell.c] : null;

    const cells = boardEl.querySelectorAll('.cell');
    cells.forEach(cell => {
      const r = parseInt(cell.dataset.row, 10);
      const c = parseInt(cell.dataset.col, 10);
      const val = currentBoard[r][c];
      const isInitial = initialBoard[r][c] !== 0;

      // クラス初期化
      cell.className = 'cell';
      if (isInitial) cell.classList.add('initial');
      else if (val !== 0) cell.classList.add('user-filled');

      // 選択ハイライト
      if (selectedCell) {
        if (selectedCell.r === r && selectedCell.c === c) {
          cell.classList.add('selected');
        } else if (
          selectedCell.r === r ||
          selectedCell.c === c ||
          (Math.floor(selectedCell.r / 3) === Math.floor(r / 3) &&
           Math.floor(selectedCell.c / 3) === Math.floor(c / 3))
        ) {
          cell.classList.add('highlight');
        }

        // 同じ数字のハイライト
        if (selectedVal && val === selectedVal) {
          cell.classList.add('same-number');
        }
      }

      // 重複エラー
      if (conflicts.has(`${r},${c}`)) {
        cell.classList.add('conflict');
      }

      const notesGrid = cell.querySelector('.notes-grid');

      if (val !== 0) {
        // 数字を表示
        notesGrid.style.display = 'none';
        let mainText = cell.querySelector('.main-number');
        if (!mainText) {
          mainText = document.createElement('span');
          mainText.className = 'main-number';
          cell.appendChild(mainText);
        }
        mainText.textContent = val;
      } else {
        // 数字なし：メモを表示
        const mainText = cell.querySelector('.main-number');
        if (mainText) mainText.remove();

        const cellNotes = notes[r][c];
        if (cellNotes && cellNotes.size > 0) {
          notesGrid.style.display = 'grid';
          for (let n = 1; n <= 9; n++) {
            const noteEl = notesGrid.querySelector(`[data-note="${n}"]`);
            noteEl.textContent = cellNotes.has(n) ? n : '';
          }
        } else {
          notesGrid.style.display = 'none';
        }
      }
    });

    updateKeypadCounts();
    updateControls();
  }

  function updateKeypadCounts() {
    const counts = Array(10).fill(0);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = currentBoard[r][c];
        if (val >= 1 && val <= 9) counts[val]++;
      }
    }

    for (let i = 1; i <= 9; i++) {
      const remaining = 9 - counts[i];
      const countEl = document.getElementById(`key-count-${i}`);
      const keyEl = keypadEl.querySelector(`[data-num="${i}"]`);

      if (countEl) countEl.textContent = remaining > 0 ? remaining : '✓';
      if (keyEl) {
        if (remaining <= 0) {
          keyEl.classList.add('completed');
        } else {
          keyEl.classList.remove('completed');
        }
      }
    }
  }

  function updateControls() {
    undoBtn.disabled = historyIndex <= 0;
    redoBtn.disabled = historyIndex >= history.length - 1;
    pencilBtn.classList.toggle('active', isPencilMode);
    pencilIndicator.textContent = isPencilMode ? 'ON' : 'OFF';
  }

  // ===============================
  // ユーザー入力 & アクション
  // ===============================
  function selectCell(r, c) {
    if (isPaused) return;
    selectedCell = { r, c };
    renderBoard();
  }

  function handleNumberInput(num) {
    if (isPaused || !selectedCell) return;
    const { r, c } = selectedCell;

    // 初期マスは変更不可
    if (initialBoard[r][c] !== 0) return;

    if (isPencilMode) {
      // メモモード
      if (currentBoard[r][c] !== 0) return; // すでに数字が入っている場合はメモ不可
      const cellNotes = notes[r][c];
      if (cellNotes.has(num)) {
        cellNotes.delete(num);
      } else {
        cellNotes.add(num);
      }
      saveState();
      renderBoard();
    } else {
      // 通常数字入力
      if (currentBoard[r][c] === num) {
        // 同じ数字をもう一度タップしたら消去
        currentBoard[r][c] = 0;
      } else {
        currentBoard[r][c] = num;
        // 数字を入れたら、その行・列・ブロック内の同じメモを自動消去
        removeNotesAfterInput(r, c, num);
      }
      saveState();
      renderBoard();
      checkWinCondition();
    }
  }

  function removeNotesAfterInput(row, col, num) {
    for (let i = 0; i < 9; i++) {
      notes[row][i].delete(num);
      notes[i][col].delete(num);
    }
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        notes[startRow + r][startCol + c].delete(num);
      }
    }
  }

  function eraseSelectedCell() {
    if (isPaused || !selectedCell) return;
    const { r, c } = selectedCell;
    if (initialBoard[r][c] !== 0) return;

    let changed = false;
    if (currentBoard[r][c] !== 0) {
      currentBoard[r][c] = 0;
      changed = true;
    }
    if (notes[r][c].size > 0) {
      notes[r][c].clear();
      changed = true;
    }

    if (changed) {
      saveState();
      renderBoard();
    }
  }

  function giveHint() {
    if (isPaused) return;

    // 優先度1: 選択中のセルが空または誤っている場合、そのセルを埋める
    if (selectedCell) {
      const { r, c } = selectedCell;
      if (initialBoard[r][c] === 0 && currentBoard[r][c] !== solutionBoard[r][c]) {
        fillCellWithHint(r, c);
        return;
      }
    }

    // 優先度2: 間違っているセルを探す
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c] !== 0 && currentBoard[r][c] !== solutionBoard[r][c]) {
          fillCellWithHint(r, c);
          return;
        }
      }
    }

    // 優先度3: 空いているセルを1つ埋める
    const emptyCells = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }

    if (emptyCells.length > 0) {
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      fillCellWithHint(randomCell.r, randomCell.c);
    }
  }

  function fillCellWithHint(r, c) {
    const correctVal = solutionBoard[r][c];
    currentBoard[r][c] = correctVal;
    notes[r][c].clear();
    removeNotesAfterInput(r, c, correctVal);
    selectedCell = { r, c };
    saveState();
    renderBoard();
    checkWinCondition();
  }

  // ===============================
  // 履歴管理 (Undo / Redo)
  // ===============================
  function saveState() {
    // 現在位置以降の履歴を切り捨てる
    history = history.slice(0, historyIndex + 1);

    const snapshot = {
      board: sudokuEngine.copyBoard(currentBoard),
      notes: notes.map(row => row.map(set => new Set(set))),
      selected: selectedCell ? { ...selectedCell } : null
    };

    history.push(snapshot);
    historyIndex++;
    updateControls();
  }

  function undo() {
    if (historyIndex > 0) {
      historyIndex--;
      restoreState(history[historyIndex]);
    }
  }

  function redo() {
    if (historyIndex < history.length - 1) {
      historyIndex++;
      restoreState(history[historyIndex]);
    }
  }

  function restoreState(snapshot) {
    currentBoard = sudokuEngine.copyBoard(snapshot.board);
    notes = snapshot.notes.map(row => row.map(set => new Set(set)));
    selectedCell = snapshot.selected ? { ...snapshot.selected } : null;
    renderBoard();
  }

  // ===============================
  // 移動・キーボード操作
  // ===============================
  function moveSelection(dRow, dCol) {
    if (!selectedCell) {
      selectedCell = { r: 0, c: 0 };
    } else {
      const newR = Math.max(0, Math.min(8, selectedCell.r + dRow));
      const newC = Math.max(0, Math.min(8, selectedCell.c + dCol));
      selectedCell = { r: newR, c: newC };
    }
    renderBoard();
  }

  // ===============================
  // タイマー
  // ===============================
  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!isPaused) {
        timerSeconds++;
        updateTimerDisplay();
      }
    }, 1000);
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerSeconds = 0;
    isPaused = false;
    updateTimerDisplay();
    updatePauseButton();
  }

  function updateTimerDisplay() {
    const mins = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
    const secs = (timerSeconds % 60).toString().padStart(2, '0');
    timerText.textContent = `${mins}:${secs}`;
  }

  function togglePause() {
    isPaused = !isPaused;
    updatePauseButton();

    if (isPaused) {
      boardEl.style.filter = 'blur(10px)';
    } else {
      boardEl.style.filter = 'none';
    }
  }

  function updatePauseButton() {
    const pauseIcon = document.getElementById('pause-icon');
    if (isPaused) {
      pauseIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>`;
    } else {
      pauseIcon.innerHTML = `<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>`;
    }
  }

  // ===============================
  // クリア判定 & 演出
  // ===============================
  function checkWinCondition() {
    // 盤面がすべて埋まっているかチェック
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c] === 0) return false;
      }
    }

    // 重複エラーがないかチェック
    const conflicts = sudokuEngine.findConflicts(currentBoard);
    if (conflicts.size > 0) return false;

    // 正解盤面と一致しているかチェック
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c] !== solutionBoard[r][c]) return false;
      }
    }

    // クリア！
    handleVictory();
    return true;
  }

  function handleVictory() {
    clearInterval(timerInterval);

    const diffNames = {
      easy: '初級',
      medium: '中級',
      hard: '上級',
      expert: 'エキスパート'
    };

    modalDiff.textContent = diffNames[currentDifficulty] || '中級';
    modalTime.textContent = timerText.textContent;
    winModal.classList.add('active');

    startConfetti();
  }

  // ===============================
  // 軽量 Canvas 紙吹雪エフェクト
  // ===============================
  let confettiAnimId = null;
  let confettiParticles = [];

  function startConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    confettiParticles = [];
    const colors = ['#6366f1', '#38bdf8', '#34d399', '#f43f5e', '#fbbf24', '#a855f7'];

    for (let i = 0; i < 120; i++) {
      confettiParticles.push({
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * confettiCanvas.height - confettiCanvas.height,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: Math.random() * 3 + 2,
        speedX: (Math.random() - 0.5) * 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 6
      });
    }

    function renderConfetti() {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

      confettiParticles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.y > confettiCanvas.height) {
          p.y = -10;
          p.x = Math.random() * confettiCanvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      confettiAnimId = requestAnimationFrame(renderConfetti);
    }

    renderConfetti();
  }

  function stopConfetti() {
    if (confettiAnimId) {
      cancelAnimationFrame(confettiAnimId);
      confettiAnimId = null;
    }
    const ctx = confettiCanvas.getContext('2d');
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }

  // ===============================
  // イベントリスナー
  // ===============================
  function setupEventListeners() {
    // 難易度変更
    difficultySelect.addEventListener('change', (e) => {
      startNewGame(e.target.value);
    });

    // タイマー一時停止ボタン
    pauseBtn.addEventListener('click', togglePause);

    // ツールボタン
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
    eraseBtn.addEventListener('click', eraseSelectedCell);
    pencilBtn.addEventListener('click', () => {
      isPencilMode = !isPencilMode;
      updateControls();
    });
    hintBtn.addEventListener('click', giveHint);

    // 新規ゲーム
    newGameBtn.addEventListener('click', () => {
      if (confirm('現在のゲームを破棄して、新しいパズルを開始しますか？')) {
        startNewGame(difficultySelect.value);
      }
    });

    modalRestartBtn.addEventListener('click', () => {
      startNewGame(difficultySelect.value);
    });

    // キーボードショートカット
    window.addEventListener('keydown', (e) => {
      if (isPaused && e.key !== 'p' && e.key !== 'P') return;

      // 1〜9の数字キー
      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        eraseSelectedCell();
      } else if (e.key === 'p' || e.key === 'P') {
        isPencilMode = !isPencilMode;
        updateControls();
      } else if (e.key === 'h' || e.key === 'H') {
        giveHint();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveSelection(-1, 0);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveSelection(1, 0);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveSelection(0, -1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveSelection(0, 1);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y')) {
        e.preventDefault();
        redo();
      }
    });

    // ウィンドウリサイズ時のCanvas調整
    window.addEventListener('resize', () => {
      if (confettiAnimId) {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
      }
    });
  }

  // アプリ起動
  init();
});

/**
 * ラッシュアワー（Rush Hour）ゲームロジック & UIインタラクション
 */
document.addEventListener('DOMContentLoaded', () => {
  const solver = new RushHourSolver(6);

  // ゲーム状態
  let currentStageIndex = 0;
  let cars = [];
  let moves = 0;
  let history = [];
  let isClearing = false;
  let activeHint = null;

  // DOM要素
  const parkingLotEl = document.getElementById('parking-lot');
  const carsLayerEl = document.getElementById('cars-layer');
  const stageTitleEl = document.getElementById('stage-title');
  const stageDiffEl = document.getElementById('stage-diff');
  const movesCountEl = document.getElementById('moves-count');
  const minMovesEl = document.getElementById('min-moves');
  const starsDisplayEl = document.getElementById('stars-display');
  const prevStageBtn = document.getElementById('prev-stage-btn');
  const nextStageBtn = document.getElementById('next-stage-btn');
  const undoBtn = document.getElementById('undo-btn');
  const resetBtn = document.getElementById('reset-btn');
  const hintBtn = document.getElementById('hint-btn');
  const stageSelectBtn = document.getElementById('stage-select-btn');
  const clearModal = document.getElementById('clear-modal');
  const modalStars = document.getElementById('modal-stars');
  const modalMoves = document.getElementById('modal-moves');
  const modalMin = document.getElementById('modal-min');
  const modalNextBtn = document.getElementById('modal-next-btn');
  const stageModal = document.getElementById('stage-modal');
  const stageGrid = document.getElementById('stage-grid');
  const closeStageModalBtn = document.getElementById('close-stage-modal-btn');
  const confettiCanvas = document.getElementById('confetti-canvas');

  // ===============================
  // 初期化
  // ===============================
  function init() {
    setupEventListeners();
    buildStageGridModal();
    loadStage(0);
  }

  function loadStage(index) {
    if (!LEVELS || LEVELS.length === 0) return;
    currentStageIndex = Math.max(0, Math.min(LEVELS.length - 1, index));
    const stage = LEVELS[currentStageIndex];

    // 車両データをディープコピー
    cars = stage.cars.map(c => ({ ...c }));
    moves = 0;
    history = [];
    isClearing = false;
    activeHint = null;

    stopConfetti();
    clearModal.classList.remove('active');

    updateUI();
    renderCars();
  }

  function updateUI() {
    const stage = LEVELS[currentStageIndex];
    stageTitleEl.textContent = stage.name;
    stageDiffEl.textContent = stage.difficulty;
    movesCountEl.textContent = moves;
    minMovesEl.textContent = stage.minMoves;

    prevStageBtn.disabled = currentStageIndex === 0;
    nextStageBtn.disabled = currentStageIndex === LEVELS.length - 1;
    undoBtn.disabled = history.length === 0;

    // 星評価の更新
    const stars = calculateStars(moves, stage.minMoves);
    updateStarsDisplay(starsDisplayEl, stars);
  }

  function calculateStars(currentMoves, minMoves) {
    if (currentMoves <= minMoves) return 3;
    if (currentMoves <= minMoves + 3) return 2;
    return 1;
  }

  function updateStarsDisplay(container, count) {
    const stars = container.querySelectorAll('.star');
    stars.forEach((star, idx) => {
      star.classList.toggle('active', idx < count);
    });
  }

  // ===============================
  // 車両のレンダリング
  // ===============================
  function renderCars() {
    carsLayerEl.innerHTML = '';
    const boardWidth = parkingLotEl.clientWidth;
    const cellSize = boardWidth / 6;

    cars.forEach(car => {
      const carEl = document.createElement('div');
      carEl.id = `car-el-${car.id}`;
      carEl.className = `car ${car.orientation === 'H' ? 'horizontal' : 'vertical'}`;
      if (car.isTarget) carEl.classList.add('target');
      if (car.length === 3) carEl.classList.add('truck');

      // サイズと位置
      const width = car.orientation === 'H' ? cellSize * car.length : cellSize;
      const height = car.orientation === 'V' ? cellSize * car.length : cellSize;
      carEl.style.width = `${width}px`;
      carEl.style.height = `${height}px`;

      const posX = car.x * cellSize;
      const posY = car.y * cellSize;
      carEl.style.transform = `translate(${posX}px, ${posY}px)`;

      // ボディ内部
      const carBody = document.createElement('div');
      carBody.className = 'car-body';
      carBody.style.backgroundColor = car.color;

      const cabin = document.createElement('div');
      cabin.className = 'car-cabin';
      carBody.appendChild(cabin);

      if (car.length === 3) {
        const cargo = document.createElement('div');
        cargo.className = 'car-cargo';
        carBody.appendChild(cargo);
      }

      carEl.appendChild(carBody);

      // ドラッグイベント登録
      setupDrag(carEl, car);

      carsLayerEl.appendChild(carEl);
    });
  }

  // ===============================
  // ドラッグ＆スワイプ処理
  // ===============================
  function setupDrag(carEl, car) {
    let startPointerPos = 0;
    let initialCarCoord = 0;
    let minCoord = 0;
    let maxCoord = 5;
    let isDragging = false;

    const onPointerDown = (e) => {
      if (isClearing) return;
      isDragging = true;
      carEl.classList.add('dragging');

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      startPointerPos = car.orientation === 'H' ? clientX : clientY;
      initialCarCoord = car.orientation === 'H' ? car.x : car.y;

      // 移動制限範囲（衝突のない空きマス範囲）を事前計算
      const bounds = calculateMoveBounds(car);
      minCoord = bounds.min;
      maxCoord = bounds.max;

      document.addEventListener('mousemove', onPointerMove, { passive: false });
      document.addEventListener('mouseup', onPointerUp);
      document.addEventListener('touchmove', onPointerMove, { passive: false });
      document.addEventListener('touchend', onPointerUp);
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const currentPos = car.orientation === 'H' ? clientX : clientY;

      const boardWidth = parkingLotEl.clientWidth;
      const cellSize = boardWidth / 6;

      const deltaPx = currentPos - startPointerPos;
      const deltaCoord = deltaPx / cellSize;

      // 移動範囲内にクランプ
      let clampedCoord = initialCarCoord + deltaCoord;
      // 赤い車が出口に向かう場合、少しだけ外にはみ出ることを許容
      const rightLimit = (car.isTarget && maxCoord === 4) ? 4.8 : maxCoord;
      clampedCoord = Math.max(minCoord, Math.min(rightLimit, clampedCoord));

      const newPx = clampedCoord * cellSize;
      if (car.orientation === 'H') {
        carEl.style.transform = `translate(${newPx}px, ${car.y * cellSize}px)`;
      } else {
        carEl.style.transform = `translate(${car.x * cellSize}px, ${newPx}px)`;
      }
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      carEl.classList.remove('dragging');

      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('touchend', onPointerUp);

      const boardWidth = parkingLotEl.clientWidth;
      const cellSize = boardWidth / 6;

      // 現在のスタイル座標からマス番号を四捨五入でスナップ
      const transform = carEl.style.transform;
      const match = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);

      if (match) {
        const px = parseFloat(car.orientation === 'H' ? match[1] : match[2]);
        let snapped = Math.round(px / cellSize);
        snapped = Math.max(minCoord, Math.min(maxCoord, snapped));

        const oldX = car.x;
        const oldY = car.y;

        if (car.orientation === 'H') {
          car.x = snapped;
        } else {
          car.y = snapped;
        }

        // 手数カウントと履歴
        if (car.x !== oldX || car.y !== oldY) {
          history.push({
            carId: car.id,
            fromX: oldX,
            fromY: oldY,
            toX: car.x,
            toY: car.y
          });
          moves++;
          updateUI();
          clearHint();
        }

        // スナップ位置に整列
        carEl.style.transform = `translate(${car.x * cellSize}px, ${car.y * cellSize}px)`;

        // ゴール判定
        if (car.isTarget && car.x === 4) {
          triggerVictory();
        }
      }
    };

    carEl.addEventListener('mousedown', onPointerDown);
    carEl.addEventListener('touchstart', onPointerDown, { passive: true });
  }

  // ===============================
  // 移動可能範囲の計算（衝突判定）
  // ===============================
  function calculateMoveBounds(targetCar) {
    const grid = solver.buildGrid(cars.filter(c => c.id !== targetCar.id));
    let min = 0;
    let max = 6 - targetCar.length;

    if (targetCar.orientation === 'H') {
      // 左側の限界
      for (let x = targetCar.x - 1; x >= 0; x--) {
        if (grid[targetCar.y][x] !== null) {
          min = x + 1;
          break;
        }
      }
      // 右側の限界
      for (let x = targetCar.x + targetCar.length; x < 6; x++) {
        if (grid[targetCar.y][x] !== null) {
          max = x - targetCar.length;
          break;
        }
      }
    } else {
      // 上側の限界
      for (let y = targetCar.y - 1; y >= 0; y--) {
        if (grid[y][targetCar.x] !== null) {
          min = y + 1;
          break;
        }
      }
      // 下側の限界
      for (let y = targetCar.y + targetCar.length; y < 6; y++) {
        if (grid[y][targetCar.x] !== null) {
          max = y - targetCar.length;
          break;
        }
      }
    }

    return { min, max };
  }

  // ===============================
  // 脱出アニメーション & 勝利モーダル
  // ===============================
  function triggerVictory() {
    isClearing = true;
    const redCarEl = document.getElementById('car-el-red');
    const boardWidth = parkingLotEl.clientWidth;

    // 出口から画面右外へ走り去るドライブアウトアニメーション
    if (redCarEl) {
      redCarEl.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      redCarEl.style.transform = `translate(${boardWidth + 50}px, ${2 * (boardWidth / 6)}px)`;
    }

    setTimeout(() => {
      startConfetti();
      const stage = LEVELS[currentStageIndex];
      const starsCount = calculateStars(moves, stage.minMoves);

      modalStars.textContent = '★'.repeat(starsCount) + '☆'.repeat(3 - starsCount);
      modalMoves.textContent = moves;
      modalMin.textContent = stage.minMoves;
      clearModal.classList.add('active');
    }, 650);
  }

  // ===============================
  // ヒント & アシスト
  // ===============================
  function showHint() {
    if (isClearing) return;
    clearHint();

    const hint = solver.getNextHint(cars);
    if (!hint) return;

    activeHint = hint;
    const carEl = document.getElementById(`car-el-${hint.carId}`);
    if (carEl) {
      carEl.classList.add('highlight-hint');
    }
  }

  function clearHint() {
    if (activeHint) {
      const carEl = document.getElementById(`car-el-${activeHint.carId}`);
      if (carEl) carEl.classList.remove('highlight-hint');
      activeHint = null;
    }
  }

  // ===============================
  // Undo & Reset
  // ===============================
  function undo() {
    if (history.length === 0 || isClearing) return;
    const lastMove = history.pop();
    const car = cars.find(c => c.id === lastMove.carId);
    if (car) {
      car.x = lastMove.fromX;
      car.y = lastMove.fromY;
      moves--;
      updateUI();
      renderCars();
      clearHint();
    }
  }

  function resetStage() {
    if (isClearing) return;
    loadStage(currentStageIndex);
  }

  // ===============================
  // ステージ選択モーダル
  // ===============================
  function buildStageGridModal() {
    stageGrid.innerHTML = '';
    LEVELS.forEach((lvl, idx) => {
      const btn = document.createElement('button');
      btn.className = 'nav-btn';
      btn.style.width = '100%';
      btn.style.height = '48px';
      btn.style.flexDirection = 'column';
      btn.style.fontSize = '0.8rem';
      btn.innerHTML = `<strong>${lvl.id}</strong><span style="font-size:0.65rem;color:var(--text-muted);">${lvl.difficulty}</span>`;
      btn.addEventListener('click', () => {
        stageModal.classList.remove('active');
        loadStage(idx);
      });
      stageGrid.appendChild(btn);
    });
  }

  // ===============================
  // Canvas 紙吹雪エフェクト
  // ===============================
  let confettiAnimId = null;
  let confettiParticles = [];

  function startConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    confettiParticles = [];
    const colors = ['#ef4444', '#38bdf8', '#34d399', '#fbbf24', '#a855f7', '#ec4899'];

    for (let i = 0; i < 100; i++) {
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
  // イベントリスナー設定
  // ===============================
  function setupEventListeners() {
    prevStageBtn.addEventListener('click', () => loadStage(currentStageIndex - 1));
    nextStageBtn.addEventListener('click', () => loadStage(currentStageIndex + 1));
    undoBtn.addEventListener('click', undo);
    resetBtn.addEventListener('click', resetStage);
    hintBtn.addEventListener('click', showHint);

    stageSelectBtn.addEventListener('click', () => stageModal.classList.add('active'));
    closeStageModalBtn.addEventListener('click', () => stageModal.classList.remove('active'));

    modalNextBtn.addEventListener('click', () => {
      clearModal.classList.remove('active');
      stopConfetti();
      if (currentStageIndex < LEVELS.length - 1) {
        loadStage(currentStageIndex + 1);
      } else {
        loadStage(0); // ループ
      }
    });

    window.addEventListener('resize', () => {
      renderCars();
      if (confettiAnimId) {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
      }
    });

    // キーボードショートカット
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.key === 'r' || e.key === 'R') {
        resetStage();
      } else if (e.key === 'h' || e.key === 'H') {
        showHint();
      }
    });
  }

  // アプリ開始
  init();
});

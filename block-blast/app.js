(() => {
  const SIZE = 8;
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899'];
  const BEST_KEY = 'blockblast-best';
  const SAVE_KEY = 'blockblast-save';
  const COMBO_GRACE = 3; // コンボが途切れるまでの「消さない手数」

  // 形状定義（'#' がブロック）。回転・反転バリエーションは自動生成する。
  const BASE_SHAPES = [
    { rows: ['#'], weight: 2 },
    { rows: ['##'], weight: 3 },
    { rows: ['###'], weight: 3 },
    { rows: ['####'], weight: 2 },
    { rows: ['#####'], weight: 1.5 },
    { rows: ['##', '##'], weight: 3 },
    { rows: ['###', '###', '###'], weight: 1 },
    { rows: ['###', '###'], weight: 1.5 },
    { rows: ['#.', '##'], weight: 3 },
    { rows: ['#..', '#..', '###'], weight: 1.5 },
    { rows: ['#.', '#.', '##'], weight: 2 },
    { rows: ['###', '.#.'], weight: 2 },
    { rows: ['##.', '.##'], weight: 1.5 },
    { rows: ['#.', '.#'], weight: 1 },
    { rows: ['#..', '.#.', '..#'], weight: 0.6 },
  ];

  function parse(rows) {
    const cells = [];
    rows.forEach((line, r) => [...line].forEach((ch, c) => { if (ch === '#') cells.push([r, c]); }));
    return normalize(cells);
  }

  function normalize(cells) {
    const minR = Math.min(...cells.map(p => p[0]));
    const minC = Math.min(...cells.map(p => p[1]));
    return cells.map(([r, c]) => [r - minR, c - minC]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  }

  const rotate = cells => normalize(cells.map(([r, c]) => [c, -r]));
  const mirror = cells => normalize(cells.map(([r, c]) => [r, -c]));

  // 全バリエーションを重み付きで展開
  const SHAPES = [];
  BASE_SHAPES.forEach(({ rows, weight }) => {
    const seen = new Set();
    const variants = [];
    let cur = parse(rows);
    for (let m = 0; m < 2; m++) {
      for (let i = 0; i < 4; i++) {
        const key = JSON.stringify(cur);
        if (!seen.has(key)) { seen.add(key); variants.push(cur); }
        cur = rotate(cur);
      }
      cur = mirror(cur);
    }
    variants.forEach(v => SHAPES.push({ cells: v, weight: weight / variants.length }));
  });
  const TOTAL_WEIGHT = SHAPES.reduce((s, x) => s + x.weight, 0);

  // DOM
  const boardEl = document.getElementById('board');
  const boardWrap = document.querySelector('.board-wrap');
  const slots = [...document.querySelectorAll('.slot')];
  const scoreEl = document.getElementById('score-val');
  const bestEl = document.getElementById('best-val');
  const comboPop = document.getElementById('combo-pop');
  const overlay = document.getElementById('game-over');
  const finalScoreEl = document.getElementById('final-score');
  const newBestEl = document.getElementById('new-best');

  // State
  let grid, tray, score, best, combo, missStreak, gameOver;
  const cellEls = [];

  const storage = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
  };

  function buildBoard() {
    for (let r = 0; r < SIZE; r++) {
      cellEls[r] = [];
      for (let c = 0; c < SIZE; c++) {
        const el = document.createElement('div');
        el.className = 'cell';
        boardEl.appendChild(el);
        cellEls[r][c] = el;
      }
    }
  }

  function randomShape() {
    let x = Math.random() * TOTAL_WEIGHT;
    for (const s of SHAPES) { if ((x -= s.weight) <= 0) return s.cells; }
    return SHAPES[0].cells;
  }

  function makePiece() {
    return { cells: randomShape(), color: COLORS[Math.floor(Math.random() * COLORS.length)] };
  }

  function canPlace(cells, r0, c0, g = grid) {
    return cells.every(([r, c]) => {
      const rr = r0 + r, cc = c0 + c;
      return rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && !g[rr][cc];
    });
  }

  function fitsAnywhere(cells, g = grid) {
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        if (canPlace(cells, r, c, g)) return true;
    return false;
  }

  // 新しい3つを配る。理不尽な詰みを減らすため、少なくとも1つは置けるセットを優先。
  function dealTray() {
    let set;
    for (let i = 0; i < 40; i++) {
      set = [makePiece(), makePiece(), makePiece()];
      if (set.some(p => fitsAnywhere(p.cells))) break;
    }
    tray = set;
  }

  function renderBoard() {
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++) {
        const el = cellEls[r][c];
        const color = grid[r][c];
        el.className = color ? 'cell block' : 'cell';
        el.style.setProperty('--c', color || 'transparent');
      }
  }

  function pieceElement(piece, cls) {
    const el = document.createElement('div');
    el.className = cls;
    const h = Math.max(...piece.cells.map(p => p[0])) + 1;
    const w = Math.max(...piece.cells.map(p => p[1])) + 1;
    el.style.gridTemplateRows = `repeat(${h}, auto)`;
    el.style.gridTemplateColumns = `repeat(${w}, auto)`;
    piece.cells.forEach(([r, c]) => {
      const b = document.createElement('div');
      b.className = 'pcell block';
      b.style.setProperty('--c', piece.color);
      b.style.gridRow = r + 1;
      b.style.gridColumn = c + 1;
      el.appendChild(b);
    });
    return el;
  }

  function renderTray() {
    slots.forEach((slot, i) => {
      slot.innerHTML = '';
      const piece = tray[i];
      if (!piece) return;
      const el = pieceElement(piece, 'piece');
      if (!fitsAnywhere(piece.cells)) el.classList.add('unfit');
      el.addEventListener('pointerdown', e => startDrag(e, i, el));
      slot.appendChild(el);
    });
  }

  function setScore(v, bump) {
    score = v;
    scoreEl.textContent = score;
    if (score > best) {
      best = score;
      bestEl.textContent = best;
      storage.set(BEST_KEY, best);
    }
    if (bump) {
      scoreEl.classList.remove('bump');
      void scoreEl.offsetWidth;
      scoreEl.classList.add('bump');
    }
  }

  // ---- Drag & drop ----
  let drag = null;

  function metrics() {
    const a = cellEls[0][0].getBoundingClientRect();
    const b = cellEls[0][1].getBoundingClientRect();
    return { left: a.left, top: a.top, step: b.left - a.left, cell: a.width };
  }

  function startDrag(e, index, srcEl) {
    if (gameOver || drag) return;
    e.preventDefault();
    const piece = tray[index];
    const ghost = pieceElement(piece, 'drag-ghost');
    document.body.appendChild(ghost);
    srcEl.classList.add('dragging');
    const rect = ghost.getBoundingClientRect();
    // タッチ時は指で隠れないようにブロックを指の上に浮かせる
    const lift = e.pointerType === 'mouse' ? rect.height / 2 : rect.height + 30;
    drag = { index, piece, ghost, srcEl, w: rect.width, h: rect.height, lift, pos: null, pointerId: e.pointerId };
    moveDrag(e);
    window.addEventListener('pointermove', moveDrag);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', cancelDrag);
  }

  function moveDrag(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const x = e.clientX - drag.w / 2;
    const y = e.clientY - drag.lift;
    drag.ghost.style.transform = `translate(${x}px, ${y}px)`;

    const m = metrics();
    const c0 = Math.round((x - m.left) / m.step);
    const r0 = Math.round((y - m.top) / m.step);
    const pos = canPlace(drag.piece.cells, r0, c0) ? { r: r0, c: c0 } : null;
    if (JSON.stringify(pos) !== JSON.stringify(drag.pos)) {
      drag.pos = pos;
      showPreview(pos);
    }
  }

  function clearPreview() {
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++) {
        const el = cellEls[r][c];
        el.classList.remove('preview', 'will-clear');
        el.style.setProperty('--c', grid[r][c] || 'transparent');
      }
  }

  function showPreview(pos) {
    clearPreview();
    if (!pos) return;
    const g = grid.map(row => row.slice());
    drag.piece.cells.forEach(([r, c]) => {
      const el = cellEls[pos.r + r][pos.c + c];
      el.classList.add('preview');
      el.style.setProperty('--c', drag.piece.color);
      g[pos.r + r][pos.c + c] = drag.piece.color;
    });
    const { rows, cols } = findLines(g);
    const mark = (r, c) => {
      const el = cellEls[r][c];
      el.classList.add('will-clear');
      el.classList.remove('preview');
      el.style.setProperty('--c', drag.piece.color);
    };
    rows.forEach(r => { for (let c = 0; c < SIZE; c++) mark(r, c); });
    cols.forEach(c => { for (let r = 0; r < SIZE; r++) mark(r, c); });
  }

  function teardownDrag() {
    window.removeEventListener('pointermove', moveDrag);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', cancelDrag);
    drag.ghost.remove();
    drag.srcEl.classList.remove('dragging');
    clearPreview();
    const d = drag;
    drag = null;
    return d;
  }

  function cancelDrag(e) {
    if (drag && e.pointerId === drag.pointerId) teardownDrag();
  }

  function endDrag(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const d = teardownDrag();
    if (d.pos) place(d.index, d.pos);
  }

  // ---- Game logic ----
  function findLines(g) {
    const rows = [], cols = [];
    for (let i = 0; i < SIZE; i++) {
      if (g[i].every(Boolean)) rows.push(i);
      if (g.every(row => row[i])) cols.push(i);
    }
    return { rows, cols };
  }

  function place(index, { r: r0, c: c0 }) {
    const piece = tray[index];
    piece.cells.forEach(([r, c]) => { grid[r0 + r][c0 + c] = piece.color; });
    tray[index] = null;
    renderBoard();
    piece.cells.forEach(([r, c]) => cellEls[r0 + r][c0 + c].classList.add('placed'));

    let gained = piece.cells.length;
    const { rows, cols } = findLines(grid);
    const lines = rows.length + cols.length;

    if (lines > 0) {
      combo += 1;
      missStreak = 0;
      const toClear = new Set();
      rows.forEach(r => { for (let c = 0; c < SIZE; c++) toClear.add(r * SIZE + c); });
      cols.forEach(c => { for (let r = 0; r < SIZE; r++) toClear.add(r * SIZE + c); });
      toClear.forEach(k => { grid[Math.floor(k / SIZE)][k % SIZE] = null; });

      // 1列10点、同時消し・コンボで倍率アップ
      gained += 10 * lines * (lines + 1) / 2 * combo;
      const perfect = grid.every(row => row.every(v => !v));
      if (perfect) gained += 300;

      toClear.forEach(k => cellEls[Math.floor(k / SIZE)][k % SIZE].classList.add('clearing'));
      setTimeout(renderBoard, 380);

      const msgs = [];
      if (perfect) msgs.push('PERFECT!');
      else if (lines >= 3) msgs.push('AMAZING!');
      else if (lines === 2) msgs.push('GREAT!');
      if (combo >= 2) msgs.push(`COMBO ×${combo}`);
      if (msgs.length) popup(msgs.join('<br>'));
      if (lines >= 2 || perfect) {
        boardWrap.classList.remove('shake');
        void boardWrap.offsetWidth;
        boardWrap.classList.add('shake');
      }
    } else if (++missStreak >= COMBO_GRACE) {
      combo = 0;
    }

    setScore(score + gained, true);
    if (tray.every(p => !p)) dealTray();
    renderTray();
    save();

    if (!tray.some(p => p && fitsAnywhere(p.cells))) {
      gameOver = true;
      storage.del(SAVE_KEY);
      setTimeout(showGameOver, 700);
    }
  }

  function popup(html) {
    comboPop.innerHTML = html;
    comboPop.classList.remove('show');
    void comboPop.offsetWidth;
    comboPop.classList.add('show');
  }

  function showGameOver() {
    finalScoreEl.textContent = score;
    newBestEl.classList.toggle('hidden', !(score > startBest));
    overlay.classList.remove('hidden');
  }

  let startBest = 0;

  function save() {
    if (gameOver) return;
    storage.set(SAVE_KEY, JSON.stringify({ grid, tray, score, combo, missStreak, startBest }));
  }

  function newGame() {
    grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    combo = 0;
    missStreak = 0;
    gameOver = false;
    startBest = best;
    setScore(0, false);
    dealTray();
    renderBoard();
    renderTray();
    overlay.classList.add('hidden');
    save();
  }

  function restore() {
    try {
      const s = JSON.parse(storage.get(SAVE_KEY));
      if (!s || !Array.isArray(s.grid) || s.grid.length !== SIZE || !Array.isArray(s.tray)) return false;
      grid = s.grid;
      tray = s.tray;
      combo = s.combo || 0;
      missStreak = s.missStreak || 0;
      startBest = s.startBest || 0;
      gameOver = false;
      setScore(s.score || 0, false);
      if (tray.every(p => !p)) dealTray();
      renderBoard();
      renderTray();
      if (!tray.some(p => p && fitsAnywhere(p.cells))) return false;
      return true;
    } catch {
      return false;
    }
  }

  // Init
  best = parseInt(storage.get(BEST_KEY), 10) || 0;
  bestEl.textContent = best;
  buildBoard();
  if (!restore()) newGame();

  document.getElementById('restart-btn').addEventListener('click', () => {
    if (score > 0 && !gameOver && !confirm('最初からやり直しますか？')) return;
    newGame();
  });
  document.getElementById('retry-btn').addEventListener('click', newGame);
  window.addEventListener('resize', () => { if (drag) teardownDrag(); });
})();

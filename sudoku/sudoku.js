/**
 * 数独（ナンプレ）のロジックを管理するクラス
 */
class SudokuGenerator {
  constructor() {
    this.size = 9;
    this.boxSize = 3;
  }

  /**
   * 空の9x9盤面を作成
   */
  createEmptyBoard() {
    return Array.from({ length: 9 }, () => Array(9).fill(0));
  }

  /**
   * 盤面のディープコピー
   */
  copyBoard(board) {
    return board.map(row => [...row]);
  }

  /**
   * 指定位置に数字を配置できるか検証
   */
  isValid(board, row, col, num) {
    // 行のチェック
    for (let c = 0; c < 9; c++) {
      if (board[row][c] === num) return false;
    }

    // 列のチェック
    for (let r = 0; r < 9; r++) {
      if (board[r][col] === num) return false;
    }

    // 3x3ブロックのチェック
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (board[startRow + r][startCol + c] === num) return false;
      }
    }

    return true;
  }

  /**
   * 配列をシャッフル (Fisher-Yates)
   */
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * バックトラッキングでランダムな完成盤面を生成
   */
  generateSolution(board = this.createEmptyBoard()) {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    const fill = (r, c) => {
      if (r === 9) return true;
      const nextR = c === 8 ? r + 1 : r;
      const nextC = c === 8 ? 0 : c + 1;

      if (board[r][c] !== 0) {
        return fill(nextR, nextC);
      }

      const shuffledNums = this.shuffle(numbers);
      for (const num of shuffledNums) {
        if (this.isValid(board, r, c, num)) {
          board[r][c] = num;
          if (fill(nextR, nextC)) return true;
          board[r][c] = 0;
        }
      }
      return false;
    };

    fill(0, 0);
    return board;
  }

  /**
   * 解の個数をカウント（一意解チェック用、上限2まで）
   */
  countSolutions(board, count = { val: 0 }) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (this.isValid(board, r, c, num)) {
              board[r][c] = num;
              this.countSolutions(board, count);
              board[r][c] = 0;
              if (count.val >= 2) return;
            }
          }
          return;
        }
      }
    }
    count.val++;
  }

  /**
   * 難易度に応じた問題を生成
   * @param {'easy' | 'medium' | 'hard' | 'expert'} difficulty 
   */
  generatePuzzle(difficulty = 'medium') {
    const solution = this.generateSolution(this.createEmptyBoard());
    const puzzle = this.copyBoard(solution);

    // 難易度別のヒント数（残すマス数）
    let clues;
    switch (difficulty) {
      case 'easy':
        clues = 38 + Math.floor(Math.random() * 4); // 38〜41
        break;
      case 'hard':
        clues = 26 + Math.floor(Math.random() * 4); // 26〜29
        break;
      case 'expert':
        clues = 22 + Math.floor(Math.random() * 3); // 22〜24
        break;
      case 'medium':
      default:
        clues = 31 + Math.floor(Math.random() * 4); // 31〜34
        break;
    }

    const cellsToRemove = 81 - clues;
    const positions = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push([r, c]);
      }
    }
    const shuffledPositions = this.shuffle(positions);

    let removed = 0;
    for (const [r, c] of shuffledPositions) {
      if (removed >= cellsToRemove) break;

      const temp = puzzle[r][c];
      puzzle[r][c] = 0;

      // 一意解チェック
      const count = { val: 0 };
      const copy = this.copyBoard(puzzle);
      this.countSolutions(copy, count);

      if (count.val === 1) {
        removed++;
      } else {
        puzzle[r][c] = temp; // 一意解でなくなったら戻す
      }
    }

    return { puzzle, solution };
  }

  /**
   * ユーザー入力の重複エラー（行・列・3x3）をチェック
   * @param {number[][]} board 
   * @returns {Set<string>} エラーのあるセルの座標キー "r,c" のセット
   */
  findConflicts(board) {
    const conflictCells = new Set();

    // 行チェック
    for (let r = 0; r < 9; r++) {
      const seen = new Map();
      for (let c = 0; c < 9; c++) {
        const val = board[r][c];
        if (val !== 0) {
          if (seen.has(val)) {
            conflictCells.add(`${r},${c}`);
            conflictCells.add(`${r},${seen.get(val)}`);
          } else {
            seen.set(val, c);
          }
        }
      }
    }

    // 列チェック
    for (let c = 0; c < 9; c++) {
      const seen = new Map();
      for (let r = 0; r < 9; r++) {
        const val = board[r][c];
        if (val !== 0) {
          if (seen.has(val)) {
            conflictCells.add(`${r},${c}`);
            conflictCells.add(`${seen.get(val)},${c}`);
          } else {
            seen.set(val, r);
          }
        }
      }
    }

    // 3x3ブロックチェック
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const seen = new Map();
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const actualR = br * 3 + r;
            const actualC = bc * 3 + c;
            const val = board[actualR][actualC];
            if (val !== 0) {
              if (seen.has(val)) {
                conflictCells.add(`${actualR},${actualC}`);
                const [prevR, prevC] = seen.get(val);
                conflictCells.add(`${prevR},${prevC}`);
              } else {
                seen.set(val, [actualR, actualC]);
              }
            }
          }
        }
      }
    }

    return conflictCells;
  }
}

// ブラウザ環境またはNode環境双方で利用できるようにエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SudokuGenerator;
}

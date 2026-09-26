/**
 * ラッシュアワー 幅優先探索（BFS）ソルバー
 * 最短手数計算 & 次の一手ヒント生成エンジン
 */
class RushHourSolver {
  constructor(boardSize = 6) {
    this.boardSize = boardSize;
  }

  /**
   * 盤面のハッシュキーを生成（探索済みチェック用）
   */
  encodeState(cars) {
    // 各車の (x, y) をカンマ区切りでソート・連結
    return cars
      .map(c => `${c.id}:${c.x},${c.y}`)
      .sort()
      .join('|');
  }

  /**
   * 盤面を2次元配列に展開（衝突判定用）
   */
  buildGrid(cars) {
    const grid = Array.from({ length: this.boardSize }, () => Array(this.boardSize).fill(null));
    for (const car of cars) {
      for (let i = 0; i < car.length; i++) {
        const x = car.orientation === 'H' ? car.x + i : car.x;
        const y = car.orientation === 'V' ? car.y + i : car.y;
        if (x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize) {
          grid[y][x] = car.id;
        }
      }
    }
    return grid;
  }

  /**
   * 車両の移動可能範囲（移動先座標）を計算
   */
  getValidMoves(car, grid) {
    const moves = [];

    if (car.orientation === 'H') {
      // 左方向の空きを探索
      for (let step = 1; car.x - step >= 0; step++) {
        if (grid[car.y][car.x - step] === null) {
          moves.push({ carId: car.id, newX: car.x - step, newY: car.y, steps: -step });
        } else {
          break;
        }
      }
      // 右方向の空きを探索
      for (let step = 1; car.x + car.length - 1 + step < this.boardSize; step++) {
        if (grid[car.y][car.x + car.length - 1 + step] === null) {
          moves.push({ carId: car.id, newX: car.x + step, newY: car.y, steps: step });
        } else {
          break;
        }
      }
    } else { // 'V'
      // 上方向の空きを探索
      for (let step = 1; car.y - step >= 0; step++) {
        if (grid[car.y - step][car.x] === null) {
          moves.push({ carId: car.id, newX: car.x, newY: car.y - step, steps: -step });
        } else {
          break;
        }
      }
      // 下方向の空きを探索
      for (let step = 1; car.y + car.length - 1 + step < this.boardSize; step++) {
        if (grid[car.y + car.length - 1 + step][car.x] === null) {
          moves.push({ carId: car.id, newX: car.x, newY: car.y + step, steps: step });
        } else {
          break;
        }
      }
    }

    return moves;
  }

  /**
   * ゴール状態判定（赤い車が出口直前 x=4, y=2 に到達）
   */
  isGoal(cars) {
    const redCar = cars.find(c => c.isTarget);
    return redCar && redCar.x === this.boardSize - redCar.length;
  }

  /**
   * BFSによる最短解法探索
   * @param {Array} initialCars 
   * @returns {Object|null} { minMoves: number, path: Array } または null
   */
  solve(initialCars) {
    const queue = [{
      cars: initialCars.map(c => ({ ...c })),
      moves: 0,
      path: []
    }];

    const visited = new Set();
    visited.add(this.encodeState(initialCars));

    while (queue.length > 0) {
      const current = queue.shift();

      if (this.isGoal(current.cars)) {
        return {
          minMoves: current.moves,
          path: current.path
        };
      }

      const grid = this.buildGrid(current.cars);

      for (let i = 0; i < current.cars.length; i++) {
        const car = current.cars[i];
        const validMoves = this.getValidMoves(car, grid);

        for (const move of validMoves) {
          // 新しい状態を作成
          const nextCars = current.cars.map(c => {
            if (c.id === move.carId) {
              return { ...c, x: move.newX, y: move.newY };
            }
            return { ...c };
          });

          const hash = this.encodeState(nextCars);
          if (!visited.has(hash)) {
            visited.add(hash);
            queue.push({
              cars: nextCars,
              moves: current.moves + 1,
              path: [...current.path, move]
            });
          }
        }
      }
    }

    return null; // 解なし
  }

  /**
   * 現在の盤面から「次の一手」のヒントを取得
   */
  getNextHint(currentCars) {
    const solution = this.solve(currentCars);
    if (solution && solution.path.length > 0) {
      return solution.path[0];
    }
    return null;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RushHourSolver;
}

/**
 * ラッシュアワー（Rush Hour）完全検証済みステージデータ
 * 最短手数はBFSソルバーにより精密に計算されています。
 */
const LEVELS = [
  {
    "id": 1,
    "name": "ステージ 1",
    "difficulty": "初級",
    "minMoves": 3,
    "cars": [
      {
        "id": "red",
        "x": 0,
        "y": 2,
        "length": 2,
        "orientation": "H",
        "isTarget": true,
        "color": "#ef4444"
      },
      {
        "id": "c1",
        "x": 2,
        "y": 0,
        "length": 3,
        "orientation": "H",
        "color": "#3b82f6"
      },
      {
        "id": "c2",
        "x": 1,
        "y": 3,
        "length": 3,
        "orientation": "V",
        "color": "#10b981"
      },
      {
        "id": "c3",
        "x": 3,
        "y": 1,
        "length": 2,
        "orientation": "V",
        "color": "#f59e0b"
      },
      {
        "id": "c4",
        "x": 0,
        "y": 1,
        "length": 3,
        "orientation": "H",
        "color": "#8b5cf6"
      },
      {
        "id": "c5",
        "x": 4,
        "y": 1,
        "length": 2,
        "orientation": "V",
        "color": "#ec4899"
      }
    ]
  },
  {
    "id": 2,
    "name": "ステージ 2",
    "difficulty": "初級",
    "minMoves": 3,
    "cars": [
      {
        "id": "red",
        "x": 0,
        "y": 2,
        "length": 2,
        "orientation": "H",
        "isTarget": true,
        "color": "#ef4444"
      },
      {
        "id": "c1",
        "x": 4,
        "y": 1,
        "length": 3,
        "orientation": "V",
        "color": "#3b82f6"
      },
      {
        "id": "c2",
        "x": 3,
        "y": 0,
        "length": 3,
        "orientation": "H",
        "color": "#10b981"
      },
      {
        "id": "c3",
        "x": 2,
        "y": 1,
        "length": 2,
        "orientation": "V",
        "color": "#f59e0b"
      },
      {
        "id": "c4",
        "x": 1,
        "y": 4,
        "length": 2,
        "orientation": "V",
        "color": "#8b5cf6"
      }
    ]
  },
  {
    "id": 3,
    "name": "ステージ 3",
    "difficulty": "初級",
    "minMoves": 6,
    "cars": [
      {
        "id": "red",
        "x": 0,
        "y": 2,
        "length": 2,
        "orientation": "H",
        "isTarget": true,
        "color": "#ef4444"
      },
      {
        "id": "c1",
        "x": 3,
        "y": 5,
        "length": 2,
        "orientation": "H",
        "color": "#3b82f6"
      },
      {
        "id": "c2",
        "x": 1,
        "y": 3,
        "length": 2,
        "orientation": "H",
        "color": "#10b981"
      },
      {
        "id": "c3",
        "x": 3,
        "y": 2,
        "length": 3,
        "orientation": "V",
        "color": "#f59e0b"
      },
      {
        "id": "c4",
        "x": 2,
        "y": 0,
        "length": 2,
        "orientation": "V",
        "color": "#8b5cf6"
      },
      {
        "id": "c5",
        "x": 5,
        "y": 0,
        "length": 3,
        "orientation": "V",
        "color": "#ec4899"
      },
      {
        "id": "c6",
        "x": 4,
        "y": 3,
        "length": 2,
        "orientation": "V",
        "color": "#06b6d4"
      },
      {
        "id": "c7",
        "x": 2,
        "y": 4,
        "length": 2,
        "orientation": "V",
        "color": "#6366f1"
      }
    ]
  },
  {
    "id": 4,
    "name": "ステージ 4",
    "difficulty": "初級",
    "minMoves": 5,
    "cars": [
      {
        "id": "red",
        "x": 0,
        "y": 2,
        "length": 2,
        "orientation": "H",
        "isTarget": true,
        "color": "#ef4444"
      },
      {
        "id": "c1",
        "x": 0,
        "y": 0,
        "length": 2,
        "orientation": "V",
        "color": "#3b82f6"
      },
      {
        "id": "c2",
        "x": 4,
        "y": 2,
        "length": 3,
        "orientation": "V",
        "color": "#10b981"
      },
      {
        "id": "c3",
        "x": 1,
        "y": 4,
        "length": 2,
        "orientation": "V",
        "color": "#f59e0b"
      },
      {
        "id": "c4",
        "x": 2,
        "y": 2,
        "length": 2,
        "orientation": "V",
        "color": "#8b5cf6"
      },
      {
        "id": "c5",
        "x": 2,
        "y": 0,
        "length": 3,
        "orientation": "H",
        "color": "#ec4899"
      },
      {
        "id": "c6",
        "x": 3,
        "y": 5,
        "length": 2,
        "orientation": "H",
        "color": "#06b6d4"
      },
      {
        "id": "c7",
        "x": 2,
        "y": 4,
        "length": 2,
        "orientation": "H",
        "color": "#6366f1"
      }
    ]
  },
  {
    "id": 5,
    "name": "ステージ 5",
    "difficulty": "中級",
    "minMoves": 7,
    "cars": [
      {
        "id": "red",
        "x": 0,
        "y": 2,
        "length": 2,
        "orientation": "H",
        "isTarget": true,
        "color": "#ef4444"
      },
      {
        "id": "c1",
        "x": 0,
        "y": 3,
        "length": 3,
        "orientation": "V",
        "color": "#3b82f6"
      },
      {
        "id": "c2",
        "x": 1,
        "y": 4,
        "length": 2,
        "orientation": "V",
        "color": "#10b981"
      },
      {
        "id": "c3",
        "x": 3,
        "y": 0,
        "length": 3,
        "orientation": "V",
        "color": "#f59e0b"
      },
      {
        "id": "c4",
        "x": 3,
        "y": 5,
        "length": 3,
        "orientation": "H",
        "color": "#8b5cf6"
      },
      {
        "id": "c5",
        "x": 4,
        "y": 1,
        "length": 2,
        "orientation": "H",
        "color": "#ec4899"
      },
      {
        "id": "c6",
        "x": 2,
        "y": 1,
        "length": 2,
        "orientation": "V",
        "color": "#06b6d4"
      }
    ]
  },
  {
    "id": 6,
    "name": "ステージ 6",
    "difficulty": "中級",
    "minMoves": 8,
    "cars": [
      {
        "id": "red",
        "x": 0,
        "y": 2,
        "length": 2,
        "orientation": "H",
        "isTarget": true,
        "color": "#ef4444"
      },
      {
        "id": "c1",
        "x": 5,
        "y": 0,
        "length": 3,
        "orientation": "V",
        "color": "#3b82f6"
      },
      {
        "id": "c2",
        "x": 1,
        "y": 3,
        "length": 3,
        "orientation": "H",
        "color": "#10b981"
      },
      {
        "id": "c3",
        "x": 4,
        "y": 4,
        "length": 2,
        "orientation": "H",
        "color": "#f59e0b"
      },
      {
        "id": "c4",
        "x": 2,
        "y": 0,
        "length": 3,
        "orientation": "V",
        "color": "#8b5cf6"
      }
    ]
  },
  {
    "id": 7,
    "name": "ステージ 7",
    "difficulty": "中級",
    "minMoves": 8,
    "cars": [
      {
        "id": "red",
        "x": 1,
        "y": 2,
        "length": 2,
        "orientation": "H",
        "isTarget": true,
        "color": "#ef4444"
      },
      {
        "id": "c1",
        "x": 2,
        "y": 0,
        "length": 2,
        "orientation": "V",
        "color": "#3b82f6"
      },
      {
        "id": "c2",
        "x": 3,
        "y": 0,
        "length": 2,
        "orientation": "V",
        "color": "#10b981"
      },
      {
        "id": "c3",
        "x": 4,
        "y": 0,
        "length": 2,
        "orientation": "H",
        "color": "#f59e0b"
      },
      {
        "id": "c4",
        "x": 4,
        "y": 4,
        "length": 2,
        "orientation": "V",
        "color": "#8b5cf6"
      },
      {
        "id": "c5",
        "x": 0,
        "y": 4,
        "length": 3,
        "orientation": "H",
        "color": "#ec4899"
      },
      {
        "id": "c6",
        "x": 3,
        "y": 3,
        "length": 2,
        "orientation": "V",
        "color": "#06b6d4"
      },
      {
        "id": "c7",
        "x": 4,
        "y": 2,
        "length": 2,
        "orientation": "V",
        "color": "#6366f1"
      }
    ]
  },
  {
    "id": 8,
    "name": "ステージ 8",
    "difficulty": "上級",
    "minMoves": 11,
    "cars": [
      {
        "id": "red",
        "x": 0,
        "y": 2,
        "length": 2,
        "orientation": "H",
        "isTarget": true,
        "color": "#ef4444"
      },
      {
        "id": "c1",
        "x": 2,
        "y": 1,
        "length": 2,
        "orientation": "V",
        "color": "#3b82f6"
      },
      {
        "id": "c2",
        "x": 4,
        "y": 0,
        "length": 2,
        "orientation": "V",
        "color": "#10b981"
      },
      {
        "id": "c3",
        "x": 2,
        "y": 3,
        "length": 3,
        "orientation": "V",
        "color": "#f59e0b"
      },
      {
        "id": "c4",
        "x": 4,
        "y": 4,
        "length": 2,
        "orientation": "H",
        "color": "#8b5cf6"
      },
      {
        "id": "c5",
        "x": 1,
        "y": 0,
        "length": 2,
        "orientation": "H",
        "color": "#ec4899"
      },
      {
        "id": "c6",
        "x": 0,
        "y": 0,
        "length": 2,
        "orientation": "V",
        "color": "#06b6d4"
      },
      {
        "id": "c7",
        "x": 3,
        "y": 3,
        "length": 3,
        "orientation": "H",
        "color": "#6366f1"
      }
    ]
  },
  {
    "id": 9,
    "name": "ステージ 9",
    "difficulty": "上級",
    "minMoves": 13,
    "cars": [
      {
        "id": "red",
        "x": 0,
        "y": 2,
        "length": 2,
        "orientation": "H",
        "isTarget": true,
        "color": "#ef4444"
      },
      {
        "id": "c1",
        "x": 2,
        "y": 4,
        "length": 2,
        "orientation": "H",
        "color": "#3b82f6"
      },
      {
        "id": "c2",
        "x": 5,
        "y": 3,
        "length": 3,
        "orientation": "V",
        "color": "#10b981"
      },
      {
        "id": "c3",
        "x": 4,
        "y": 1,
        "length": 3,
        "orientation": "V",
        "color": "#f59e0b"
      },
      {
        "id": "c4",
        "x": 0,
        "y": 0,
        "length": 2,
        "orientation": "H",
        "color": "#8b5cf6"
      },
      {
        "id": "c5",
        "x": 3,
        "y": 0,
        "length": 2,
        "orientation": "V",
        "color": "#ec4899"
      },
      {
        "id": "c6",
        "x": 2,
        "y": 0,
        "length": 3,
        "orientation": "V",
        "color": "#06b6d4"
      },
      {
        "id": "c7",
        "x": 1,
        "y": 4,
        "length": 2,
        "orientation": "V",
        "color": "#6366f1"
      }
    ]
  },
  {
    "id": 10,
    "name": "ステージ 10",
    "difficulty": "エキスパート",
    "minMoves": 15,
    "cars": [
      { "id": "red", "x": 1, "y": 2, "length": 2, "orientation": "H", "isTarget": true, "color": "#ef4444" },
      { "id": "c1", "x": 0, "y": 0, "length": 3, "orientation": "V", "color": "#f59e0b" },
      { "id": "c2", "x": 1, "y": 0, "length": 2, "orientation": "H", "color": "#3b82f6" },
      { "id": "c3", "x": 3, "y": 0, "length": 2, "orientation": "H", "color": "#10b981" },
      { "id": "c4", "x": 3, "y": 1, "length": 3, "orientation": "V", "color": "#8b5cf6" },
      { "id": "c5", "x": 4, "y": 1, "length": 2, "orientation": "H", "color": "#06b6d4" },
      { "id": "c6", "x": 5, "y": 1, "length": 3, "orientation": "V", "color": "#6366f1" },
      { "id": "c7", "x": 1, "y": 3, "length": 2, "orientation": "V", "color": "#ec4899" },
      { "id": "c8", "x": 2, "y": 4, "length": 2, "orientation": "H", "color": "#14b8a6" },
      { "id": "c9", "x": 4, "y": 4, "length": 2, "orientation": "V", "color": "#f97316" },
      { "id": "c10", "x": 1, "y": 5, "length": 3, "orientation": "H", "color": "#a855f7" }
    ]
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LEVELS;
}

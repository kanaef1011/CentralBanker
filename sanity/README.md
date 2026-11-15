# Central Bank Simulator — Sanity backend

Schema bám sát code gốc, chỉ gồm 4 document:

| Document | Tương ứng trong code HTML |
|---|---|
| `scenario` | object `SCENARIOS` |
| `learnTopic` | object `LEARN` |
| `run` | `APP.run` (lượt đang chơi), `APP.saved` (chiến lược đã lưu), `benchmarks()` (Taylor rule / Do nothing) |
| `player` (tùy chọn) | không có trong code; chỉ cần để lưu lượt chơi qua nhiều thiết bị |

## Cấu trúc

```
sanity.config.js          Studio: Kịch bản / Bài học / Lượt chơi / Người chơi
schemaTypes/
  objects.js              scenarioParams, scenarioEvent, decision, quarterState, runScore, learnEntry
  documents.js            scenario, learnTopic, player, run
  index.js
lib/
  engine.cjs              Mô hình kinh tế, tách nguyên văn từ file HTML (không sửa)
  queries.js              GROQ queries
  runService.js           Mọi thao tác ghi lượt chơi (chạy ở server)
seed/seed.ndjson          5 kịch bản + 4 bài học (rate, qe, adas, fg) lấy từ code gốc
```

## Cài đặt

```bash
npm install
cp .env.example .env    # SANITY_STUDIO_PROJECT_ID, SANITY_PROJECT_ID, SANITY_WRITE_TOKEN
npm run seed
npm run dev             # mở Studio
```

## Các nút trong UI ↔ hàm trong runService.js

| UI | Hàm |
|---|---|
| Chọn kịch bản / "Start over" / "Restart scenario" | `startRun` |
| "Announce decision" | `commitDecision` |
| "Go back 1 quarter" | `undoQuarter` |
| Ô "Defend your decisions" | `updateNotes` |
| "Save" | `saveStrategy` |
| "Save & restart" | `saveAndRestart` |
| "Delete" (chiến lược đã lưu) | `deleteStrategy` |
| Taylor rule / Do nothing | `ensureBenchmarks` |

## Nguyên tắc

- `run.decisions` là nguồn sự thật. `run.states` và `run.score` là cache do server tính bằng engine.
- Client không ghi `run` trực tiếp: gọi API → `runService` → replay engine → patch có `ifRevisionId`.
- Kịch bản tự khóa khi có lượt chơi đầu tiên, vì lượt chơi được dựng lại từ thông số của nó.
- Benchmark có `_id` tất định nên mỗi tổ hợp (kịch bản, seed, noise) chỉ tính một lần.

## Không dùng đăng nhập?

Client tự sinh một UUID, lưu trong `localStorage`, rồi gọi `ensurePlayer(uuid)`. Như vậy vẫn dùng chung schema;
khi thêm đăng nhập sau này, chỉ cần truyền ID tài khoản thay cho UUID.

## Ghi chú JavaScript

- ES modules (`"type": "module"`), import nội bộ có đuôi `.js`.
- `engine.cjs` giữ dạng CommonJS và được nạp bằng `createRequire`.
- Kiểu dữ liệu ghi bằng JSDoc để VS Code gợi ý tham số.

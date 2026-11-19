# Security Specification — BLOK, COPY & PASTE (Top 20 Leaderboard)

## 1. Data Invariants
1. **Room Authority**: Only an authenticated user whose `uid == room.hostUid` can create a room with themselves as host, transition room states (`waiting` -> `countdown` -> `playing` -> `finished`), reset a room for `PLAY AGAIN`, or close/delete the room.
2. **Capacity & Late-Join Guard**: New players can ONLY join `/rooms/{roomCode}/players/{playerId}` when `room.status == 'waiting'` and `room.playerCount < 25`. Once the game starts (`countdown` or `playing`) or ends (`finished`), new players are strictly blocked.
3. **Player Isolation**: A student (`playerId == request.auth.uid`) can ONLY write to their own `/players/{playerId}` document. No student can read-modify-write another student's score, lives, or status.
4. **Score & Progression Integrity**:
   - On creation, a player MUST start with `score == 0`, `level == 1`, `lives == 5`, `completed == 0`, `totalCompleted == 0`, and `status == 'connected'`.
   - During gameplay (`room.status == 'playing'`), a player's score can only increase by at most `10 * existing().level` per single update, `level` can increase by at most `1`, and `totalCompleted` can increase by at most `1`.
   - Once a player reaches `status == 'eliminated'` or `lives == 0`, they CANNOT increase score, level, or completed count for the remainder of the round.
5. **Top-20-Only Leaderboard Enforcement**:
   - `/rooms/{roomCode}/leaderboard/{entryId}` stores at most **20** entries (`leaderboardMeta/state.count <= 20` and `entryUids.size() <= 20`).
   - Every leaderboard entry MUST match the exact post-transaction `/players/{entryId}` document (`score`, `level`, `totalCompleted`, `completed`, `name`, `roundNumber`) via `getAfter()`.
   - When `count == 20`, a 21st+ player CANNOT insert into `/leaderboard` unless they strictly outrank `(minScore, minLevel, minTotalCompleted)` AND atomically delete `minEntryUid` in the same transaction.
   - Rank 21+ players are never persisted in `/leaderboard`.
   - When Host clicks `PLAY AGAIN`, all `/leaderboard` documents are deleted and `leaderboardMeta/state` resets to `count: 0, entryUids: []`.
6. **Unique Student Names**: Every player creation must atomically reference a `/rooms/{roomCode}/names/{nameKey}` lock document owned by `request.auth.uid`.
7. **Temporal Integrity**: Timestamps must strictly match `request.time` (`serverTimestamp()`).

## 2. Adversarial Payloads
1. **Host Spoofing on Room Create** -> `PERMISSION_DENIED`.
2. **Room Code ID Poisoning** -> `PERMISSION_DENIED`.
3. **Late Join Injection** -> `PERMISSION_DENIED`.
4. **Capacity Overflow (> 25 players)** -> `PERMISSION_DENIED`.
5. **Cross-Player Score Tampering** -> `PERMISSION_DENIED`.
6. **Arbitrary Score Jump** -> `PERMISSION_DENIED`.
7. **Post-Elimination Score Cheat** -> `PERMISSION_DENIED`.
8. **Student Host-State Hijack** -> `PERMISSION_DENIED`.
9. **Leaderboard Overflow (> 20 entries without evicting #20)** -> `PERMISSION_DENIED`.
10. **Low-Score Leaderboard Injection (attempting to evict #20 with lower score)** -> `PERMISSION_DENIED`.
11. **Forged Leaderboard Score (score != player doc score)** -> `PERMISSION_DENIED`.
12. **Client-Forged Timestamp** -> `PERMISSION_DENIED`.

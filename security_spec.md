# Security Specification — BLOK, COPY & PASTE

## 1. Data Invariants
1. **Room Authority**: Only an authenticated user whose `uid == room.hostUid` can create a room with themselves as host, transition room states (`waiting` -> `countdown` -> `playing` -> `finished`), reset a room for `PLAY AGAIN`, or close/delete the room.
2. **Capacity & Late-Join Guard**: New players can ONLY join `/rooms/{roomCode}/players/{playerId}` when `room.status == 'waiting'` and `room.playerCount < 25`. Once the game starts (`countdown` or `playing`) or ends (`finished`), new players are strictly blocked.
3. **Player Isolation**: A student (`playerId == request.auth.uid`) can ONLY write to their own `/players/{playerId}` document. No student can read-modify-write another student's score, lives, or status.
4. **Score & Progression Integrity**:
   - On creation, a player MUST start with `score == 0`, `level == 1`, `lives == 5`, `completed == 0`, `totalCompleted == 0`, and `status == 'connected'`.
   - During gameplay (`room.status == 'playing'`), a player's score can only increase by at most `10 * existing().level` per single update, `level` can increase by at most `1` (only when transitioning `completed` from `14` to `0` and restoring `lives` to `5`), and `totalCompleted` can increase by at most `1` per update.
   - Once a player reaches `status == 'eliminated'` or `lives == 0`, they CANNOT increase score, level, or completed count for the remainder of the round.
5. **Unique Student Names**: Every player creation must atomically reference a `/rooms/{roomCode}/names/{nameKey}` lock document owned by `request.auth.uid`, preventing duplicate names in the same room.
6. **Temporal Integrity**: `createdAt`, `updatedAt`, `joinedAt`, `lastSeen`, `countdownStartedAt`, `startTime`, and `endTime` must use `request.time` (`serverTimestamp()`).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Host Spoofing on Room Create**: Student creates room with `hostUid: "another-uid"` -> `PERMISSION_DENIED`.
2. **Oversized Room Code / ID Poisoning**: Creating `/rooms/INVALID_1500_CHAR_ID` -> `PERMISSION_DENIED`.
3. **Late Join Injection**: New student attempts to create `/players/{uid}` when `room.status == 'playing'` -> `PERMISSION_DENIED`.
4. **Capacity Overflow**: 26th student attempts to join when `room.playerCount == 25` -> `PERMISSION_DENIED`.
5. **Cross-Player Score Tampering**: Student A attempts to update `/players/{studentB_uid}` -> `PERMISSION_DENIED`.
6. **Arbitrary Score Jump**: Student updates own score from `0` to `99999` in one write -> `PERMISSION_DENIED`.
7. **Post-Elimination Score Cheat**: Eliminated student (`status == 'eliminated'`) attempts to update `score` -> `PERMISSION_DENIED`.
8. **Student Host-State Hijack**: Non-host student attempts to update room `status` to `'finished'` -> `PERMISSION_DENIED`.
9. **Shadow Field Injection**: Payload adds ghost field `isAdmin: true` or `extraPoints: 500` -> `PERMISSION_DENIED`.
10. **Duplicate Name Collision**: Student B attempts to claim `/names/{nameKey}` already owned by Student A -> `PERMISSION_DENIED`.
11. **Terminal State Mutation After Finish**: Player attempts to increment score when `room.status == 'finished'` -> `PERMISSION_DENIED`.
12. **Client-Forged Timestamp**: Client writes `createdAt: new Date(0)` instead of `serverTimestamp()` -> `PERMISSION_DENIED`.

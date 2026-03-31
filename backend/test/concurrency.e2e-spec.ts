/**
 * Concurrency Integration Test
 *
 * Proves that 10,000 users fighting over 2,000 concert seats
 * will NEVER cause overbooking. Runs against real PostgreSQL.
 *
 * Simulates a flash-sale pattern: users arrive in waves of 500,
 * mimicking how a load balancer + connection pool would handle
 * real traffic. Each wave fires concurrently.
 *
 * Prerequisites:
 *   - PostgreSQL running on localhost:5432 (docker compose up postgres)
 *   - DATABASE_URL set in .env or environment
 *
 * Run:
 *   npm run test:e2e -- concurrency
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { ReservationService } from '../src/reservation/reservation.service';
import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';

// Test parameters
const TOTAL_SEATS = 2_000;
const TOTAL_USERS = 10_000;
const WAVE_SIZE = 500; // Users per concurrent wave
const CONCERT_NAME = '__concurrency_test_concert__';
const USER_PREFIX = '__conctest_user_';

describe('Concurrency: 10,000 users vs 2,000 seats', () => {
  let prisma: PrismaService;
  let reservationService: ReservationService;
  let module: TestingModule;
  let concertId: number;
  let userIds: number[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [PrismaService, ReservationService],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    reservationService = module.get<ReservationService>(ReservationService);

    await prisma.onModuleInit();

    // Clean up previous test data (in case of a previous failed run)
    await cleanup();

    // Create a concert with 2,000 seats
    const concert = await prisma.concert.create({
      data: {
        name: CONCERT_NAME,
        description: 'Concurrency stress test concert',
        totalSeats: TOTAL_SEATS,
      },
    });
    concertId = concert.id;

    // Bulk-create 10,000 users via raw SQL for speed
    const dummyHash =
      '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';

    const batchSize = 1000;
    userIds = [];
    const now = new Date().toISOString();

    for (let batch = 0; batch < TOTAL_USERS / batchSize; batch++) {
      const values = Array.from({ length: batchSize }, (_, i) => {
        const idx = batch * batchSize + i;
        return `('${USER_PREFIX}${idx}', '${dummyHash}', 'USER', '${now}', '${now}')`;
      }).join(',\n');

      const inserted = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
        `INSERT INTO "User" (username, password, role, "createdAt", "updatedAt")
         VALUES ${values}
         RETURNING id`,
      );
      userIds.push(...inserted.map((u) => u.id));
    }

    console.log(
      `Setup complete: concert #${concertId} (${TOTAL_SEATS} seats), ${userIds.length} users, wave size ${WAVE_SIZE}`,
    );
  }, 120_000);

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
    await module.close();
  }, 60_000);

  async function cleanup() {
    await prisma.$executeRawUnsafe(
      `DELETE FROM "ReservationHistory" WHERE "concertId" IN (SELECT id FROM "Concert" WHERE name = '${CONCERT_NAME}')`,
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM "Reservation" WHERE "concertId" IN (SELECT id FROM "Concert" WHERE name = '${CONCERT_NAME}')`,
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM "Concert" WHERE name = '${CONCERT_NAME}'`,
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM "User" WHERE username LIKE '${USER_PREFIX}%'`,
    );
  }

  it(
    'all 2,000 seats are filled with zero overbooking — no 500 errors',
    async () => {
      const startTime = Date.now();

      // Categorize outcomes
      let succeeded = 0;
      let soldOut = 0;
      let serverBusy = 0;
      let otherErrors = 0;
      const otherErrorSamples: string[] = [];

      // Process in waves to simulate realistic load balancer behavior
      const totalWaves = Math.ceil(TOTAL_USERS / WAVE_SIZE);

      for (let wave = 0; wave < totalWaves; wave++) {
        const start = wave * WAVE_SIZE;
        const end = Math.min(start + WAVE_SIZE, TOTAL_USERS);
        const waveUserIds = userIds.slice(start, end);

        const results = await Promise.allSettled(
          waveUserIds.map((userId) =>
            reservationService.reserve(userId, concertId),
          ),
        );

        for (const result of results) {
          if (result.status === 'fulfilled') {
            succeeded++;
          } else {
            const err = result.reason;
            if (err instanceof BadRequestException) {
              soldOut++;
            } else if (err instanceof ServiceUnavailableException) {
              serverBusy++;
            } else if (err instanceof ConflictException) {
              // Shouldn't happen — each user unique
              otherErrors++;
              if (otherErrorSamples.length < 3)
                otherErrorSamples.push(`Conflict: ${err.message}`);
            } else {
              otherErrors++;
              if (otherErrorSamples.length < 3)
                otherErrorSamples.push(err?.message || String(err));
            }
          }
        }

        // Check if all seats filled — remaining waves will get instant "sold out"
        if (wave % 5 === 0 || wave === totalWaves - 1) {
          const filled = await prisma.reservation.count({
            where: { concertId, status: 'RESERVED' },
          });
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(
            `  Wave ${wave + 1}/${totalWaves} | Seats filled: ${filled}/${TOTAL_SEATS} | ${elapsed}s`,
          );
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      // Verify in database
      const dbReservedCount = await prisma.reservation.count({
        where: { concertId, status: 'RESERVED' },
      });

    // Print report
      console.log('\n=== CONCURRENCY TEST REPORT ===');
      console.log(`Concert: ${TOTAL_SEATS.toLocaleString()} seats`);
    console.log(
      `Users:   ${TOTAL_USERS.toLocaleString()} (${totalWaves} waves × ${WAVE_SIZE})`,
    );
      console.log(`Time:    ${elapsed}s`);
      console.log('-------------------------------');
      console.log(`✅ Reservations succeeded:  ${succeeded}`);
      console.log(`❌ Sold out (rejected):     ${soldOut}`);
      console.log(`⏳ Server busy (503):       ${serverBusy}`);
      console.log(`⚠️  Other errors:            ${otherErrors}`);
      console.log('-------------------------------');
      console.log(`📊 DB reserved count:       ${dbReservedCount}`);
      console.log(`📊 Expected:                ${TOTAL_SEATS}`);
      console.log(`🛡️  Overbooking:             ${dbReservedCount > TOTAL_SEATS ? 'YES ❌' : 'NONE ✅'}`);
      console.log('===============================\n');

      if (otherErrorSamples.length > 0) {
        console.log('Other error samples:', otherErrorSamples);
      }

      // ── CRITICAL: No overbooking ──
      expect(dbReservedCount).toBeLessThanOrEqual(TOTAL_SEATS);

      // ── All seats should be filled ──
      expect(dbReservedCount).toBe(TOTAL_SEATS);

      // ── Successful count matches DB ──
      expect(succeeded).toBe(dbReservedCount);

      // ── Total adds up ──
      expect(succeeded + soldOut + serverBusy + otherErrors).toBe(TOTAL_USERS);

      // ── No unexpected errors ──
      expect(otherErrors).toBe(0);
  }, 600_000); // 10 min timeout for large-scale test

  it('reservation history has exactly as many RESERVE entries as reservations', async () => {
    const historyCount = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "ReservationHistory" WHERE "concertId" = ${concertId} AND action = 'RESERVE'`,
      );

      const reservationCount = await prisma.reservation.count({
        where: { concertId, status: 'RESERVED' },
      });

      const count = Number(historyCount[0].count);
    console.log(
      `History RESERVE entries: ${count}, Reservations: ${reservationCount}`,
    );

      expect(count).toBe(reservationCount);
  }, 30_000);
});

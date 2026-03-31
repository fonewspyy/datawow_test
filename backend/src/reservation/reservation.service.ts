import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const MAX_RETRIES = 10;
const BASE_DELAY_MS = 30;
const MAX_DELAY_MS = 2000;

function isPrismaRetryable(error: unknown): boolean {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2034' || error.code === 'P2028')
  ) {
    return true;
  }
  if (error instanceof Error) {
    const msg = error.message?.toLowerCase() ?? '';
    if (
      msg.includes('could not serialize access') ||
      msg.includes('timed out') ||
      msg.includes('connection pool') ||
      msg.includes('prepared statement')
    ) {
      return true;
    }
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitteredDelay(attempt: number): number {
  const exponential = BASE_DELAY_MS * Math.pow(2, attempt);
  const capped = Math.min(exponential, MAX_DELAY_MS);
  // Add 0-50% random jitter to prevent thundering herd
  return capped + Math.random() * capped * 0.5;
}

@Injectable()
export class ReservationService {
  constructor(private readonly prisma: PrismaService) {}

  async reserve(userId: number, concertId: number) {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await this.executeReserve(userId, concertId);
      } catch (error) {
        if (!isPrismaRetryable(error)) {
          throw error;
        }
        lastError = error;
        if (attempt < MAX_RETRIES - 1) {
          await delay(jitteredDelay(attempt));
        }
      }
    }

    throw new ServiceUnavailableException(
      'The server is experiencing high demand. Please try again in a moment.',
    );
  }

  private async executeReserve(userId: number, concertId: number) {
    const reservation = await this.prisma.$transaction(
      async (tx) => {
        const lockedConcert = await tx.$queryRaw<
          Array<{ id: number; totalSeats: number; name: string }>
        >(Prisma.sql`
          SELECT id, "totalSeats", name
          FROM "Concert"
          WHERE id = ${concertId}
          FOR UPDATE
        `);

        if (lockedConcert.length === 0) {
          throw new NotFoundException(
            'This concert no longer exists. It may have been removed by the organizer.',
          );
        }

        const concert = lockedConcert[0];

        const existingReservation = await tx.reservation.findUnique({
          where: {
            userId_concertId: {
              userId,
              concertId,
            },
          },
        });

        if (existingReservation?.status === 'RESERVED') {
          throw new ConflictException(
            `You already have a reservation for "${concert.name}". Each person is limited to 1 seat per concert.`,
          );
        }

        const reservedCount = await tx.reservation.count({
          where: {
            concertId,
            status: 'RESERVED',
          },
        });

        if (reservedCount >= concert.totalSeats) {
          throw new BadRequestException(
            `Sorry, "${concert.name}" is sold out. All ${concert.totalSeats.toLocaleString()} seats have been reserved.`,
          );
        }

        const upsertedReservation = await tx.reservation.upsert({
          where: {
            userId_concertId: {
              userId,
              concertId,
            },
          },
          create: {
            userId,
            concertId,
            status: 'RESERVED',
          },
          update: {
            status: 'RESERVED',
          },
        });

        await tx.reservationHistory.create({
          data: {
            action: 'RESERVE',
            concertId,
            userId,
          },
        });

        return upsertedReservation;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      },
    );

    return {
      ...reservation,
      success: true,
    };
  }

  async cancel(userId: number, concertId: number) {
    const reservation = await this.prisma.$transaction(async (tx) => {
      const existingReservation = await tx.reservation.findUnique({
        where: {
          userId_concertId: {
            userId,
            concertId,
          },
        },
      });

      if (!existingReservation || existingReservation.status !== 'RESERVED') {
        throw new NotFoundException(
          'No active reservation found. It may have already been cancelled.',
        );
      }

      const updatedReservation = await tx.reservation.update({
        where: {
          userId_concertId: {
            userId,
            concertId,
          },
        },
        data: {
          status: 'CANCELLED',
        },
      });

      await tx.reservationHistory.create({
        data: {
          action: 'CANCEL',
          concertId,
          userId,
        },
      });

      return updatedReservation;
    });

    return {
      ...reservation,
      success: true,
    };
  }

  async history(userId: number) {
    return this.prisma.reservationHistory.findMany({
      where: {
        userId,
      },
      include: {
        concert: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async allHistory() {
    return this.prisma.reservationHistory.findMany({
      include: {
        concert: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

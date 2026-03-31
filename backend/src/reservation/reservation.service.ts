import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReservationService {
  constructor(private readonly prisma: PrismaService) {}

  async reserve(userId: number, concertId: number) {
    const reservation = await this.prisma.$transaction(
      async (tx) => {
        const lockedConcert = await tx.$queryRaw<
          Array<{ id: number; totalSeats: number }>
        >(Prisma.sql`
          SELECT id, "totalSeats"
          FROM "Concert"
          WHERE id = ${concertId}
          FOR UPDATE
        `);

        if (lockedConcert.length === 0) {
          throw new NotFoundException('Concert not found');
        }

        const existingReservation = await tx.reservation.findUnique({
          where: {
            userId_concertId: {
              userId,
              concertId,
            },
          },
        });

        if (existingReservation?.status === 'RESERVED') {
          throw new ConflictException('You already reserved this concert');
        }

        const reservedCount = await tx.reservation.count({
          where: {
            concertId,
            status: 'RESERVED',
          },
        });

        if (reservedCount >= lockedConcert[0].totalSeats) {
          throw new BadRequestException('No seats available');
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
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
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
        throw new NotFoundException('Active reservation not found');
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

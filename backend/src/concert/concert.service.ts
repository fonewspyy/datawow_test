import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConcertDto } from './dto/create-concert.dto';

@Injectable()
export class ConcertService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateConcertDto) {
    return this.prisma.concert.create({
      data: dto,
    });
  }

  async findAll(userId?: number) {
    const concerts = await this.prisma.concert.findMany({
      include: {
        reservations: {
          select: {
            userId: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return concerts.map(({ reservations, ...concert }) => {
      const reservedSeats = reservations.filter(
        (reservation) => reservation.status === 'RESERVED',
      ).length;
      const cancelledSeats = reservations.filter(
        (reservation) => reservation.status === 'CANCELLED',
      ).length;
      const userReservation = userId
        ? reservations.find((reservation) => reservation.userId === userId)
        : undefined;

      return {
        ...concert,
        reservedSeats,
        cancelledSeats,
        availableSeats: Math.max(concert.totalSeats - reservedSeats, 0),
        isSoldOut: reservedSeats >= concert.totalSeats,
        userReservationStatus: userReservation?.status ?? null,
      };
    });
  }

  async stats() {
    const [concertAggregate, reservedCount, cancelledCount] = await Promise.all([
      this.prisma.concert.aggregate({
        _sum: {
          totalSeats: true,
        },
      }),
      this.prisma.reservation.count({
        where: {
          status: 'RESERVED',
        },
      }),
      this.prisma.reservationHistory.count({
        where: {
          action: 'CANCEL',
        },
      }),
    ]);

    return {
      totalSeats: concertAggregate._sum.totalSeats ?? 0,
      reservedSeats: reservedCount,
      cancelledReservations: cancelledCount,
    };
  }

  async remove(id: number) {
    const concert = await this.prisma.concert.findUnique({
      where: { id },
    });

    if (!concert) {
      throw new NotFoundException('Concert not found');
    }

    await this.prisma.concert.delete({
      where: { id },
    });

    return {
      id,
      deleted: true,
    };
  }
}
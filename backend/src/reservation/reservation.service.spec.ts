import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationService } from './reservation.service';

describe('ReservationService', () => {
  let service: ReservationService;
  let tx: {
    $queryRaw: jest.Mock;
    reservation: {
      findUnique: jest.Mock;
      count: jest.Mock;
      upsert: jest.Mock;
      update: jest.Mock;
    };
    reservationHistory: {
      create: jest.Mock;
    };
  };
  let prisma: {
    $transaction: jest.Mock;
    reservationHistory: {
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    tx = {
      $queryRaw: jest.fn(),
      reservation: {
        findUnique: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      reservationHistory: {
        create: jest.fn(),
      },
    };

    prisma = {
      $transaction: jest.fn(
        async (callback: (transactionClient: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
      reservationHistory: {
        findMany: jest.fn(),
      },
    };

    service = new ReservationService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a reservation when seats are still available', async () => {
    const reservation = {
      id: 9,
      userId: 4,
      concertId: 12,
      status: 'RESERVED',
      createdAt: new Date('2026-03-31T10:00:00.000Z'),
      updatedAt: new Date('2026-03-31T10:00:00.000Z'),
    };

    tx.$queryRaw.mockResolvedValue([{ id: 12, totalSeats: 3 }]);
    tx.reservation.findUnique.mockResolvedValue(null);
    tx.reservation.count.mockResolvedValue(2);
    tx.reservation.upsert.mockResolvedValue(reservation);
    tx.reservationHistory.create.mockResolvedValue({ id: 1 });

    await expect(service.reserve(4, 12)).resolves.toEqual({
      ...reservation,
      success: true,
    });

    expect(tx.reservationHistory.create).toHaveBeenCalledWith({
      data: {
        action: 'RESERVE',
        concertId: 12,
        userId: 4,
      },
    });
  });

  it('rejects duplicate active reservations for the same user and concert', async () => {
    tx.$queryRaw.mockResolvedValue([{ id: 12, totalSeats: 10 }]);
    tx.reservation.findUnique.mockResolvedValue({
      id: 2,
      userId: 4,
      concertId: 12,
      status: 'RESERVED',
    });

    await expect(service.reserve(4, 12)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects reservations when all seats are already reserved', async () => {
    tx.$queryRaw.mockResolvedValue([{ id: 12, totalSeats: 2 }]);
    tx.reservation.findUnique.mockResolvedValue(null);
    tx.reservation.count.mockResolvedValue(2);

    await expect(service.reserve(4, 12)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects cancellation when the active reservation does not exist', async () => {
    tx.reservation.findUnique.mockResolvedValue(null);

    await expect(service.cancel(4, 12)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

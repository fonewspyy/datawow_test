import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

    tx.$queryRaw.mockResolvedValue([
      { id: 12, totalSeats: 3, name: 'Rock Fest' },
    ]);
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
    tx.$queryRaw.mockResolvedValue([
      { id: 12, totalSeats: 10, name: 'Rock Fest' },
    ]);
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
    tx.$queryRaw.mockResolvedValue([
      { id: 12, totalSeats: 2, name: 'Rock Fest' },
    ]);
    tx.reservation.findUnique.mockResolvedValue(null);
    tx.reservation.count.mockResolvedValue(2);

    await expect(service.reserve(4, 12)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('includes the concert name in the sold-out error message', async () => {
    tx.$queryRaw.mockResolvedValue([
      { id: 12, totalSeats: 1, name: 'Summer Fest' },
    ]);
    tx.reservation.findUnique.mockResolvedValue(null);
    tx.reservation.count.mockResolvedValue(1);

    await expect(service.reserve(4, 12)).rejects.toThrow(/Summer Fest/);
  });

  it('throws NotFoundException when the concert does not exist', async () => {
    tx.$queryRaw.mockResolvedValue([]);

    await expect(service.reserve(4, 999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('retries on serialization failure and succeeds on second attempt', async () => {
    const reservation = {
      id: 10,
      userId: 4,
      concertId: 12,
      status: 'RESERVED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const p2034Error = new Prisma.PrismaClientKnownRequestError(
      'Transaction failed due to a write conflict or a deadlock',
      { code: 'P2034', clientVersion: '6.0.0' },
    );

    let callCount = 0;
    prisma.$transaction.mockImplementation(
      async (callback: (transactionClient: typeof tx) => Promise<unknown>) => {
        callCount++;
        if (callCount === 1) {
          throw p2034Error;
        }
        tx.$queryRaw.mockResolvedValue([
          { id: 12, totalSeats: 10, name: 'Rock Fest' },
        ]);
        tx.reservation.findUnique.mockResolvedValue(null);
        tx.reservation.count.mockResolvedValue(0);
        tx.reservation.upsert.mockResolvedValue(reservation);
        tx.reservationHistory.create.mockResolvedValue({ id: 1 });
        return callback(tx);
      },
    );

    const result = await service.reserve(4, 12);

    expect(result.success).toBe(true);
    expect(callCount).toBe(2);
  });

  it('throws ServiceUnavailableException after max retries exhausted', async () => {
    const p2034Error = new Prisma.PrismaClientKnownRequestError(
      'Transaction failed due to a write conflict or a deadlock',
      { code: 'P2034', clientVersion: '6.0.0' },
    );

    prisma.$transaction.mockRejectedValue(p2034Error);

    await expect(service.reserve(4, 12)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('cancels an active reservation successfully', async () => {
    const existingReservation = {
      id: 5,
      userId: 4,
      concertId: 12,
      status: 'RESERVED',
    };
    const updatedReservation = { ...existingReservation, status: 'CANCELLED' };

    tx.reservation.findUnique.mockResolvedValue(existingReservation);
    tx.reservation.update.mockResolvedValue(updatedReservation);
    tx.reservationHistory.create.mockResolvedValue({ id: 2 });

    const result = await service.cancel(4, 12);

    expect(result).toEqual({ ...updatedReservation, success: true });
    expect(tx.reservationHistory.create).toHaveBeenCalledWith({
      data: {
        action: 'CANCEL',
        concertId: 12,
        userId: 4,
      },
    });
  });

  it('rejects cancellation when the active reservation does not exist', async () => {
    tx.reservation.findUnique.mockResolvedValue(null);

    await expect(service.cancel(4, 12)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects cancellation when the reservation is already cancelled', async () => {
    tx.reservation.findUnique.mockResolvedValue({
      id: 5,
      userId: 4,
      concertId: 12,
      status: 'CANCELLED',
    });

    await expect(service.cancel(4, 12)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns reservation history for a user in descending order', async () => {
    const historyData = [
      {
        id: 2,
        action: 'CANCEL',
        createdAt: new Date('2026-04-01'),
        concert: { id: 12, name: 'Rock Fest' },
      },
      {
        id: 1,
        action: 'RESERVE',
        createdAt: new Date('2026-03-31'),
        concert: { id: 12, name: 'Rock Fest' },
      },
    ];
    prisma.reservationHistory.findMany.mockResolvedValue(historyData);

    const result = await service.history(4);

    expect(result).toEqual(historyData);
    expect(prisma.reservationHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 4 },
        orderBy: { createdAt: 'desc' },
      }),
    );
  });
});

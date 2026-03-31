import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConcertService } from './concert.service';

describe('ConcertService', () => {
  let service: ConcertService;
  let prisma: {
    concert: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
      aggregate: jest.Mock;
    };
    reservation: {
      count: jest.Mock;
    };
    reservationHistory: {
      count: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      concert: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        aggregate: jest.fn(),
      },
      reservation: {
        count: jest.fn(),
      },
      reservationHistory: {
        count: jest.fn(),
      },
    };

    service = new ConcertService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a concert with the provided data', async () => {
      const dto = {
        name: 'Rock Festival',
        description: 'A great rock festival',
        totalSeats: 500,
      };
      const created = { id: 1, ...dto, createdAt: new Date() };
      prisma.concert.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result).toEqual(created);
      expect(prisma.concert.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe('findAll', () => {
    it('returns concerts with reservation counts for anonymous access', async () => {
      prisma.concert.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Concert A',
          description: 'Desc A',
          totalSeats: 100,
          createdAt: new Date(),
          reservations: [
            { userId: 1, status: 'RESERVED' },
            { userId: 2, status: 'RESERVED' },
            { userId: 3, status: 'CANCELLED' },
          ],
        },
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].reservedSeats).toBe(2);
      expect(result[0].cancelledSeats).toBe(1);
      expect(result[0].availableSeats).toBe(98);
      expect(result[0].isSoldOut).toBe(false);
      expect(result[0].userReservationStatus).toBeNull();
    });

    it('includes user reservation status when userId is provided', async () => {
      prisma.concert.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Concert A',
          description: 'Desc A',
          totalSeats: 100,
          createdAt: new Date(),
          reservations: [
            { userId: 5, status: 'RESERVED' },
            { userId: 7, status: 'CANCELLED' },
          ],
        },
      ]);

      const result = await service.findAll(5);

      expect(result[0].userReservationStatus).toBe('RESERVED');
    });

    it('marks a concert as sold out when all seats are reserved', async () => {
      prisma.concert.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Sold Out Show',
          description: 'Desc',
          totalSeats: 2,
          createdAt: new Date(),
          reservations: [
            { userId: 1, status: 'RESERVED' },
            { userId: 2, status: 'RESERVED' },
          ],
        },
      ]);

      const result = await service.findAll();

      expect(result[0].isSoldOut).toBe(true);
      expect(result[0].availableSeats).toBe(0);
    });
  });

  describe('stats', () => {
    it('returns aggregate statistics across all concerts', async () => {
      prisma.concert.aggregate.mockResolvedValue({
        _sum: { totalSeats: 1500 },
      });
      prisma.reservation.count.mockResolvedValue(120);
      prisma.reservationHistory.count.mockResolvedValue(15);

      const result = await service.stats();

      expect(result).toEqual({
        totalSeats: 1500,
        reservedSeats: 120,
        cancelledReservations: 15,
      });
    });

    it('returns zero total seats when no concerts exist', async () => {
      prisma.concert.aggregate.mockResolvedValue({
        _sum: { totalSeats: null },
      });
      prisma.reservation.count.mockResolvedValue(0);
      prisma.reservationHistory.count.mockResolvedValue(0);

      const result = await service.stats();

      expect(result.totalSeats).toBe(0);
    });
  });

  describe('remove', () => {
    it('deletes an existing concert and returns confirmation', async () => {
      prisma.concert.findUnique.mockResolvedValue({
        id: 3,
        name: 'Old Concert',
      });
      prisma.concert.delete.mockResolvedValue({ id: 3 });

      const result = await service.remove(3);

      expect(result).toEqual({ id: 3, deleted: true });
      expect(prisma.concert.delete).toHaveBeenCalledWith({ where: { id: 3 } });
    });

    it('throws NotFoundException when concert does not exist', async () => {
      prisma.concert.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.concert.delete).not.toHaveBeenCalled();
    });
  });
});

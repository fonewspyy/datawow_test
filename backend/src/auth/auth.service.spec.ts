import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
  };
  let jwtService: {
    signAsync: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
    };
    jwtService = {
      signAsync: jest.fn(),
    };

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers a new user and returns a signed token', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    prisma.user.create.mockResolvedValue({
      id: 7,
      username: 'newuser',
      role: 'USER',
    });
    jwtService.signAsync.mockResolvedValue('signed-token');

    await expect(
      service.register({ username: 'newuser', password: 'password123' }),
    ).resolves.toEqual({
      accessToken: 'signed-token',
      user: {
        id: 7,
        username: 'newuser',
        role: 'USER',
      },
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        username: 'newuser',
        password: 'hashed-password',
        role: 'USER',
      },
    });
  });

  it('rejects duplicated usernames during register', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      username: 'admin',
      password: 'hashed',
      role: 'ADMIN',
    });

    await expect(
      service.register({ username: 'admin', password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('rejects invalid passwords during login', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 5,
      username: 'sarajohn',
      password: 'hashed-password',
      role: 'USER',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({ username: 'sarajohn', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects login with a non-existent username', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ username: 'ghost', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('catches P2002 unique constraint violation on concurrent register', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

    const p2002Error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`username`)',
      { code: 'P2002', clientVersion: '6.0.0', meta: { target: ['username'] } },
    );
    prisma.user.create.mockRejectedValue(p2002Error);

    await expect(
      service.register({ username: 'admin', password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns user info via me()', async () => {
    const userInfo = {
      id: 5,
      username: 'sarajohn',
      role: 'USER',
      createdAt: new Date('2026-03-01'),
    };
    prisma.user.findUniqueOrThrow.mockResolvedValue(userInfo);

    const result = await service.me(5);

    expect(result).toEqual(userInfo);
    expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 5 },
      select: { id: true, username: true, role: true, createdAt: true },
    });
  });
});

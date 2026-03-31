import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
});

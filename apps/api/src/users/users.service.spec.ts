import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('updates permissions for a given user', async () => {
    const mockUser = {
      id: 'u-1',
      username: 'carpenter',
      permissions: ['wood.orders', 'wood.stations'],
    };
    prisma.user.update.mockResolvedValue(mockUser);

    const result = await service.updatePermissions('u-1', [
      'wood.orders',
      'wood.stations',
    ]);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u-1' },
      data: { permissions: ['wood.orders', 'wood.stations'] },
      select: expect.objectContaining({
        id: true,
        permissions: true,
      }),
    });
    expect(result.permissions).toEqual(['wood.orders', 'wood.stations']);
  });

  it('toggles user active status', async () => {
    const mockUser = {
      id: 'u-2',
      username: 'inactive_staff',
      isActive: false,
    };
    prisma.user.update.mockResolvedValue(mockUser);

    const result = await service.toggleActive('u-2', false);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u-2' },
      data: { isActive: false },
      select: expect.objectContaining({
        id: true,
        isActive: true,
      }),
    });
    expect(result.isActive).toBe(false);
  });
});

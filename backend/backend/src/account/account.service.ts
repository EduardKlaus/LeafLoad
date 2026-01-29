import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) { }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        name: true,
        email: true,
        role: true,
        createdAt: true, // falls dein Feld anders heißt: anpassen
        address: true,
        regionId: true,
        region: { select: { name: true } },
        restaurants: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      createdOn: user.createdAt, // Frontend erwartet createdOn
      address: user.address,
      regionId: user.regionId,
      regionName: user.region?.name ?? null,
      restaurantId: user.restaurants[0]?.id ?? null,
    };
  }

  async updateMe(
    userId: number,
    body: {
      name?: string;
      email?: string;
      password?: string;
      address?: string;
      regionId?: number;
    },
  ) {
    const data: any = {};

    if (body.name !== undefined) {
      const v = body.name.trim();
      if (!v) throw new BadRequestException('Name cannot be empty');
      data.name = v;
    }

    if (body.email !== undefined) {
      const v = body.email.trim().toLowerCase();
      if (!v || !v.includes('@')) throw new BadRequestException('Invalid email');
      data.email = v;
    }

    if (body.password !== undefined) {
      if (body.password.length < 6) {
        throw new BadRequestException('Password must be at least 6 characters');
      }
      const hash = await bcrypt.hash(body.password, 10);
      data.password = hash; // Feldname ggf. "passwordHash" o.ä. anpassen
    }

    if (body.address !== undefined) {
      data.address = body.address.trim();
    }

    if (body.regionId !== undefined) {
      data.regionId = body.regionId;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields provided');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        username: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        address: true,
        regionId: true,
        region: { select: { name: true } },
      },
    });

    return {
      username: updated.username,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      createdOn: updated.createdAt,
      address: updated.address,
      regionId: updated.regionId,
      regionName: updated.region?.name ?? null,
    };
  }
}

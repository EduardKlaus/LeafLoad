import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// used for database access and operations
@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) { }

  // get current user
  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        name: true,
        email: true,
        role: true,
        createdAt: true, // frontend expects createdOn
        address: true,
        regionId: true,
        region: { select: { name: true } },
        restaurants: {
          select: { id: true },
          take: 1,
        },
      },
    });

    // if user not found throw error
    if (!user) throw new NotFoundException('User not found');

    return {
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      createdOn: user.createdAt, // frontend expects createdOn
      address: user.address,
      regionId: user.regionId,
      regionName: user.region?.name ?? null,
      restaurantId: user.restaurants[0]?.id ?? null,
    };
  }

  // updates current user profile
  async updateMe(
    userId: number,
    body: {
      name?: string;
      email?: string;
      password?: string; // password is hashed with bcrypt
      address?: string;
      regionId?: number;
    },
  ) {
    // dynamic prisma update payload
    const data: any = {};

    // validate name
    if (body.name !== undefined) {
      const v = body.name.trim();
      if (!v) throw new BadRequestException('Name cannot be empty');
      data.name = v;
    }

    // validate email
    if (body.email !== undefined) {
      const v = body.email.trim().toLowerCase();
      if (!v || !v.includes('@')) throw new BadRequestException('Invalid email');
      data.email = v;
    }

    // validate and hash password
    if (body.password !== undefined) {
      if (body.password.length < 6) {
        throw new BadRequestException('Password must be at least 6 characters');
      }
      const hash = await bcrypt.hash(body.password, 10);
      data.password = hash;
    }

    if (body.address !== undefined) {
      data.address = body.address.trim();
    }

    // stored as foreign key in user table
    if (body.regionId !== undefined) {
      data.regionId = body.regionId;
    }

    // prevent empty update
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields provided');
    }

    // update user and return updated user
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

  // returns all of user's orders
  async getMyOrders(userId: number) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        restaurant: {
          select: { name: true },
        },
        user: {
          select: { name: true, address: true }
        },
        items: {
          include: {
            menuItem: {
              select: { title: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      orders: orders.map((o) => ({
        id: o.id,
        status: o.status,
        createdAt: o.createdAt,
        restaurantName: o.restaurant.name,
        userName: o.user.name,
        userAddress: o.user.address ?? '',
        items: o.items.map((item) => ({
          title: item.menuItem.title,
          quantity: item.quantity,
        })),
      })),
    };
  }
}

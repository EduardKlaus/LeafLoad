import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './jwt.strategy';

type Role = 'CUSTOMER' | 'RESTAURANT_OWNER';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  // validates user credentials and returns a signed JWT + user data
  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        restaurants: {
          select: { id: true },
          take: 1,
        },
      },
    });

    // no leak if username exists, same error message for invalid username and password
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const restaurantId = user.restaurants?.[0]?.id ?? null;

    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      restaurantId,
    };

    return {
      id: user.id,
      name: user.name,
      role: user.role,
      restaurantId,
      regionId: user.regionId ?? null,
      token: this.jwtService.sign(payload),
    };
  }

  // user signup
  async signup(input: { username: string; email: string; firstName: string; lastName: string; password: string; role: Role; address?: string; regionId?: number }) {
    const { username, email, firstName, lastName, password, role, address, regionId } = input;

    if (!username || !firstName || !lastName || !password || !role) {
      throw new BadRequestException('Missing field input.');
    }

    const emailTrim = email.trim().toLowerCase();
    const fullName = `${lastName.trim()} ${firstName.trim()}`; // "Lastname Firstname"

    const existing = await this.prisma.user.findUnique({ where: { username } });
    if (existing) {
      throw new BadRequestException('Username already exists.');
    }

    // hash password
    const hashed = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        username,
        email: emailTrim,
        name: fullName,
        password: hashed,
        role,
        address: address ? address.trim() : undefined,
        regionId,
      },
      select: { id: true, role: true },
    });

    // Generate token so user is immediately logged in after signup
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      restaurantId: null,
    };

    return {
      userId: user.id,
      role: user.role,
      token: this.jwtService.sign(payload),
    };
  }

  // restaurant signup
  async signupRestaurant(input: { ownerId: number; name: string; address: string; imageUrl: string; regionId?: number }) {
    const { ownerId, name, address, imageUrl, regionId } = input;

    if (!ownerId || !name || !address) {
      throw new BadRequestException('Missing field input.');
    }

    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true, role: true },
    });

    if (!owner) throw new BadRequestException('Owner/UserID not found');
    if (owner.role !== 'RESTAURANT_OWNER') {
      throw new BadRequestException('User is not a restaurant owner');
    }

    const restaurant = await this.prisma.restaurant.create({
      data: {
        name,
        address,
        imageUrl: imageUrl || null,
        ownerId,
        regionId,
      },
      select: { id: true },
    });

    return { restaurantId: restaurant.id };
  }
}

import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

type Role = 'CUSTOMER' | 'RESTAURANT_OWNER';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) { }

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
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return user; // später hier JWT erzeugen
  }

  // user signup
  async signup(input: { username: string; email: string; firstName: string; lastName: string; password: string; role: Role }) {
    const { username, email, firstName, lastName, password, role } = input;

    if (!username || !firstName || !lastName || !password || !role) {
      throw new BadRequestException('Missing field input.');
    }

    const emailTrim = email.trim().toLowerCase();
    const fullName = `${lastName.trim()} ${firstName.trim()}`; // "Lastname Firstname"

    const existing = await this.prisma.user.findUnique({ where: { username } });
    if (existing) {
      throw new BadRequestException('Username already exists.');
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        username,
        email: emailTrim,
        name: fullName,
        password: hashed,
        role,
      },
      select: { id: true, role: true },
    });

    return { userId: user.id, role: user.role };
  }

  // restaurant signup
  async signupRestaurant(input: { ownerId: number; name: string; address: string; imageUrl: string }) {
    const { ownerId, name, address, imageUrl } = input;

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
      },
      select: { id: true },
    });

    return { restaurantId: restaurant.id };
  }
}

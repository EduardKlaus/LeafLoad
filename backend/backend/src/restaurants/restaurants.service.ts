import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async getRestaurantDetails(restaurantId: number) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        categories: {
          include: {
            menuItems: true,
          },
        },
        menuItems: {
          where: { categoryId: null },
        },
        reviews: true,
      },
    });

    if (!restaurant) {
      throw new BadRequestException('Restaurant not found');
    }

    const rating =
      restaurant.reviews.length > 0
        ? restaurant.reviews.reduce((a, r) => a + r.rating, 0) /
          restaurant.reviews.length
        : null;

    return {
      restaurant,
      rating,
      otherItems: restaurant.menuItems,
    };
  }

  async rateRestaurant(restaurantId: number, rating: number) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    return this.prisma.review.create({
      data: {
        restaurantId,
        rating,
      },
    });
  }

  async deleteMenuItem(menuItemId: number) {
    return this.prisma.menuItems.delete({
      where: { id: menuItemId },
    });
  }
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) { }

  async getAllRestaurants() {
    const restaurants = await this.prisma.restaurant.findMany({
      include: {
        reviews: true,
      },
    });

    return restaurants.map((restaurant) => ({
      ...restaurant,
      rating:
        restaurant.reviews.length > 0
          ? restaurant.reviews.reduce((a, r) => a + r.rating, 0) /
          restaurant.reviews.length
          : null,
      reviews: undefined,
    }));
  }

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

  async getRestaurantEditData(restaurantId: number) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        regionId: true,
        categories: { select: { id: true, name: true }, orderBy: { id: 'asc' } },
      },
    });

    if (!restaurant) throw new BadRequestException('Restaurant not found');

    return restaurant;
  }

  async updateRestaurant(
    restaurantId: number,
    body: { description?: string | null; imageUrl?: string | null; regionId?: number | null }
  ) {
    // description darf leer sein: "" oder null ist ok
    // imageUrl darf leer sein: "" oder null ist ok
    const data: any = {};

    if (body.description !== undefined) data.description = body.description;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
    if (body.regionId !== undefined) data.regionId = body.regionId;

    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        regionId: true,
      },
    });
  }

  async createCategory(restaurantId: number, name: string) {
    const trimmed = (name ?? '').trim();
    if (!trimmed) throw new BadRequestException('Category name cannot be empty');

    return this.prisma.category.create({
      data: {
        restaurantId,
        name: trimmed,
      },
      select: { id: true, name: true },
    });
  }

  async updateCategory(categoryId: number, name: string) {
    const trimmed = (name ?? '').trim();
    if (!trimmed) throw new BadRequestException('Category name cannot be empty');

    return this.prisma.category.update({
      where: { id: categoryId },
      data: { name: trimmed },
      select: { id: true, name: true },
    });
  }

  async deleteCategory(categoryId: number) {
    // Damit Speisen nicht gelöscht werden:
    // Entweder onDelete:SetNull reicht (bei dir vorhanden),
    // aber wir setzen sicherheitshalber zusätzlich categoryId auf null:
    await this.prisma.menuItems.updateMany({
      where: { categoryId },
      data: { categoryId: null },
    });

    await this.prisma.category.delete({ where: { id: categoryId } });

    return { ok: true };
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

  async getMenuItemEditData(menuItemId: number) {
    const item = await this.prisma.menuItems.findUnique({
      where: { id: menuItemId },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        price: true,
        categoryId: true,
        restaurantId: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            categories: { select: { id: true, name: true }, orderBy: { id: 'asc' } },
          },
        },
      },
    });

    if (!item) throw new BadRequestException('Menu item not found');

    return item;
  }

  async updateMenuItem(
    menuItemId: number,
    body: { title?: string; description?: string | null; imageUrl?: string | null; categoryId?: number | null }
  ) {
    const data: any = {};

    if (body.title !== undefined) {
      const t = body.title.trim();
      if (!t) throw new BadRequestException('Title cannot be empty');
      data.title = t;
    }

    // description darf leer sein
    if (body.description !== undefined) data.description = body.description;

    // imageUrl darf leer sein
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;

    // categoryId kann null sein -> "Other"
    if (body.categoryId !== undefined) data.categoryId = body.categoryId;

    return this.prisma.menuItems.update({
      where: { id: menuItemId },
      data,
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        price: true,
        categoryId: true,
        restaurantId: true,
      },
    });
  }

  async deleteMenuItem(menuItemId: number) {
    await this.prisma.menuItems.delete({ where: { id: menuItemId } });
    return { ok: true };
  }
}

import { Patch, Controller, Get, Param, Post, Body, Delete } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) { }

  @Get()
  getAllRestaurants() {
    return this.restaurantsService.getAllRestaurants();
  }

  @Get(':id/details')
  getRestaurantDetails(@Param('id') id: string) {
    return this.restaurantsService.getRestaurantDetails(+id);
  }

  @Get(':id/edit')
  getRestaurantEditData(@Param('id') id: string) {
    return this.restaurantsService.getRestaurantEditData(+id);
  }

  @Patch(':id')
  updateRestaurant(
    @Param('id') id: string,
    @Body()
    body: {
      description?: string | null;
      imageUrl?: string | null;
      regionId?: number | null;
    }
  ) {
    return this.restaurantsService.updateRestaurant(+id, body);
  }

  @Post(':id/rate')
  rateRestaurant(
    @Param('id') id: string,
    @Body() body: { rating: number }
  ) {
    return this.restaurantsService.rateRestaurant(+id, body.rating);
  }

  @Get('menu-items/:id/edit')
  getMenuItemEditData(@Param('id') id: string) {
    return this.restaurantsService.getMenuItemEditData(+id);
  }

  @Patch('menu-items/:id')
  updateMenuItem(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string | null;
      imageUrl?: string | null;
      categoryId?: number | null;
    }
  ) {
    return this.restaurantsService.updateMenuItem(+id, body);
  }

  @Delete('menu-items/:id')
  deleteMenuItem(@Param('id') id: string) {
    return this.restaurantsService.deleteMenuItem(+id);
  }

  @Post('menu-items')
  createMenuItem(
    @Body()
    body: {
      restaurantId: number;
      title: string;
      description?: string | null;
      imageUrl?: string | null;
      categoryId?: number | null;
      price: number;
    }
  ) {
    return this.restaurantsService.createMenuItem(body);
  }

  @Post(':id/categories')
  createCategory(
    @Param('id') id: string,
    @Body() body: { name: string }
  ) {
    return this.restaurantsService.createCategory(+id, body.name);
  }

  @Patch('categories/:categoryId')
  updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() body: { name: string }
  ) {
    return this.restaurantsService.updateCategory(+categoryId, body.name);
  }

  @Delete('categories/:categoryId')
  deleteCategory(@Param('categoryId') categoryId: string) {
    return this.restaurantsService.deleteCategory(+categoryId);
  }

  @Get(':id/orders')
  getOrdersForRestaurant(@Param('id') id: string) {
    return this.restaurantsService.getOrdersForRestaurant(+id);
  }

  @Post('orders')
  createOrder(
    @Body() body: { userId: number; restaurantId: number; items: { menuItemId: number; quantity: number }[] }
  ) {
    return this.restaurantsService.createOrder(body.userId, body.restaurantId, body.items);
  }

  @Patch('orders/:orderId/status')
  updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() body: { status: 'PREPARING' | 'DELIVERING' | 'COMPLETED' }
  ) {
    return this.restaurantsService.updateOrderStatus(+orderId, body.status);
  }
}

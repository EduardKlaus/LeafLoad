import { Patch, Controller, Get, Param, Post, Body, Delete } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';


// Controller for restaurant related endpoints
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) { }

  // returns all restaurants (for main page)
  @Get()
  getAllRestaurants() {
    return this.restaurantsService.getAllRestaurants();
  }

  // returns a specific restaurant with all data related to it (for restaurant page)
  @Get(':id/details')
  getRestaurantDetails(@Param('id') id: string) {
    return this.restaurantsService.getRestaurantDetails(+id);
  }

  // returns a specific restaurant with all data related to it (for edit page)
  @Get(':id/edit')
  getRestaurantEditData(@Param('id') id: string) {
    return this.restaurantsService.getRestaurantEditData(+id);
  }

  // updates the data of a specific restaurant
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

  // rating for a specific restaurant
  @Post(':id/rate')
  rateRestaurant(
    @Param('id') id: string,
    @Body() body: { rating: number }
  ) {
    return this.restaurantsService.rateRestaurant(+id, body.rating);
  }

  // returns a specific menu item with all data related to it (for edit page)
  @Get('menu-items/:id/edit')
  getMenuItemEditData(@Param('id') id: string) {
    return this.restaurantsService.getMenuItemEditData(+id);
  }

  // updates the data of a specific menu item
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

  // deletes a specific menu item
  @Delete('menu-items/:id')
  deleteMenuItem(@Param('id') id: string) {
    return this.restaurantsService.deleteMenuItem(+id);
  }

  // creates a new menu item
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

  // creates a new category for a specific restaurant
  @Post(':id/categories')
  createCategory(
    @Param('id') id: string,
    @Body() body: { name: string }
  ) {
    return this.restaurantsService.createCategory(+id, body.name);
  }

  // updates the data of a specific category
  @Patch('categories/:categoryId')
  updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() body: { name: string }
  ) {
    return this.restaurantsService.updateCategory(+categoryId, body.name);
  }

  // deletes a specific category
  @Delete('categories/:categoryId')
  deleteCategory(@Param('categoryId') categoryId: string) {
    return this.restaurantsService.deleteCategory(+categoryId);
  }

  // returns all orders for a specific restaurant
  @Get(':id/orders')
  getOrdersForRestaurant(@Param('id') id: string) {
    return this.restaurantsService.getOrdersForRestaurant(+id);
  }

  // creates a new order
  @Post('orders')
  createOrder(
    @Body() body: { userId: number; restaurantId: number; items: { menuItemId: number; quantity: number }[] }
  ) {
    return this.restaurantsService.createOrder(body.userId, body.restaurantId, body.items);
  }

  // updates the status of a specific order
  @Patch('orders/:orderId/status')
  updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() body: { status: 'PREPARING' | 'DELIVERING' | 'COMPLETED' }
  ) {
    return this.restaurantsService.updateOrderStatus(+orderId, body.status);
  }
}

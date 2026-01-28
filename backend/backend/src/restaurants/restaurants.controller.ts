import {  Controller, Get, Param, Post, Body, Delete,} from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get(':id/details')
  getRestaurantDetails(@Param('id') id: string) {
    return this.restaurantsService.getRestaurantDetails(+id);
  }

  @Post(':id/rate')
  rateRestaurant(
    @Param('id') id: string,
    @Body() body: { rating: number }
  ) {
    return this.restaurantsService.rateRestaurant(+id, body.rating);
  }

  @Delete('menu-items/:id')
  deleteMenuItem(@Param('id') id: string) {
    return this.restaurantsService.deleteMenuItem(+id);
  }
}

import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const user = await this.authService.validateUser(body.username, body.password);

    // später: JWT-Token zurückgeben
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      restaurantId: user.restaurants?.[0]?.id ?? null,
    };
  }

  @Post('signup')
  signup(
    @Body()
    body: {
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      role: 'CUSTOMER' | 'RESTAURANT_OWNER';
      address?: string;
      regionId?: number;
    }) {
    return this.authService.signup(body);
  }

  @Post('signup/restaurant')
  signupRestaurant(
    @Body()
    body: {
      ownerId: number;
      name: string;
      address: string;
      imageUrl: string;    // can't be null? fix for later
      regionId?: number;
    }) {
    return this.authService.signupRestaurant(body);
  }
}

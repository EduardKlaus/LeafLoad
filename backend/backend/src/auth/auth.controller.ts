import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

// Controller for authentication related endpoints
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // authenticate user via username and password (calls AuthService.validateUser)
  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const user = await this.authService.validateUser(body.username, body.password);

    // später: JWT-Token zurückgeben
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      restaurantId: user.restaurants?.[0]?.id ?? null, // if user is restaurant owner, return restaurant id
    };
  }

  // register new user (calls AuthService.signup)
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

  // register new restaurant (calls AuthService.signupRestaurant)
  @Post('signup/restaurant')
  signupRestaurant(
    @Body()
    body: {
      ownerId: number;
      name: string;
      address: string;
      imageUrl: string;    // currently required, could be optional
      regionId?: number;
    }) {
    return this.authService.signupRestaurant(body);
  }
}

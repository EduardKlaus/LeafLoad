import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Controller for account related endpoints – all routes are JWT-protected
@UseGuards(JwtAuthGuard)
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) { }

  // get current user (/account/me)
  @Get('me')
  async me(@Request() req: any) {
    return this.accountService.getMe(req.user.userId);
  }

  // update current user (/account/me)
  @Patch('me')
  async updateMe(
    @Request() req: any,
    @Body()
    body: {
      name?: string;
      email?: string;
      password?: string;
      address?: string;
      regionId?: number;
    },
  ) {
    return this.accountService.updateMe(req.user.userId, body);
  }

  // get current user's orders (/account/orders)
  @Get('orders')
  async getMyOrders(@Request() req: any) {
    return this.accountService.getMyOrders(req.user.userId);
  }
}

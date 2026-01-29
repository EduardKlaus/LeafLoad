import {
  Body,
  Controller,
  Get,
  Patch,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { AccountService } from './account.service';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) { }

  // Demo: User-ID kommt aus Header (später JWT)
  private getUserIdFromHeaders(headers: Record<string, string | undefined>): number {
    const raw = headers['x-user-id'];
    const id = raw ? Number(raw) : NaN;
    if (!Number.isFinite(id)) {
      throw new BadRequestException('Missing or invalid x-user-id header.');
    }
    return id;
  }

  @Get('me')
  async me(@Headers() headers: Record<string, string | undefined>) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.accountService.getMe(userId);
  }

  @Patch('me')
  async updateMe(
    @Headers() headers: Record<string, string | undefined>,
    @Body()
    body: {
      name?: string;
      email?: string;
      password?: string;
      address?: string;
      regionId?: number;
    },
  ) {
    const userId = this.getUserIdFromHeaders(headers);
    return this.accountService.updateMe(userId, body);
  }
}

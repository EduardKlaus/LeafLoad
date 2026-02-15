import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
import { RegionsModule } from './regions/regions.module';

import { UploadModule } from './upload/upload.module';

@Module({
  imports: [PrismaModule, RestaurantsModule, AuthModule, AccountModule, RegionsModule, UploadModule],
})
export class AppModule { }


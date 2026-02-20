import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
import { RegionsModule } from './regions/regions.module';

import { UploadModule } from './upload/upload.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    RestaurantsModule,
    AuthModule,
    AccountModule,
    RegionsModule,
    UploadModule,
    MailModule,
  ],
})
export class AppModule { }


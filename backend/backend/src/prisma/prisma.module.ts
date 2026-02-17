import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // macht den Service in allen Modulen verfügbar
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

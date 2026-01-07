// backend/src/apps/apps.module.ts
import { Module } from '@nestjs/common';
import { AppsService } from './apps.service';
import { AppsController } from './apps.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppsController],
  providers: [AppsService],
})
export class AppsModule {} 
// DİKKAT: Buradaki class isminin "AppsModule" olması zorunlu!
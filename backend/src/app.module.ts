// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AppsModule } from './apps/apps.module';
import { ItemsModule } from './items/items.module';
import { DeliveriesModule } from './deliveries/deliveries.module';

@Module({
  imports: [
    PrismaModule, 
    AuthModule, 
    AppsModule, 
    ItemsModule, DeliveriesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
import { Module } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';
import { PrismaModule } from '../prisma/prisma.module'; // 👈 BU ÇOK ÖNEMLİ

@Module({
  imports: [PrismaModule], // 👈 Prisma servisini kullanabilmesi için şart!
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
})
export class DeliveriesModule {}
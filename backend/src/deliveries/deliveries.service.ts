import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeliveriesService {
  constructor(private prisma: PrismaService) {}

  // Tüm siparişleri getir (Admin ve Envanter için)
  async findAll() {
    return this.prisma.delivery.findMany({
      include: {
        itemPackage: {
          include: {
            app: true, // Paketin hangi uygulamaya ait olduğu
          },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Satın alma işlemini kaydet
  async create(data: any) {
    return this.prisma.delivery.create({
      data: {
        gameUserId: data.gameUserId || 'unknown',
        userId: data.userId,
        itemPackageId: data.itemPackageId,
      },
    });
  }
}
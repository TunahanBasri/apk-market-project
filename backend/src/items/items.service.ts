import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.itemPackage.create({
      data: {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price), // Fiyatı sayıya çevir
        appId: parseInt(data.appId),   // ID'yi sayıya çevir
      },
    });
  }

  async findByAppId(appId: number) {
    return this.prisma.itemPackage.findMany({
      where: { appId: parseInt(appId as any) },
    });
  }

  async delete(id: number) {
    return this.prisma.itemPackage.delete({ where: { id } });
  }

  // --- 🔥 YENİ: SATIN ALMA KAYDI OLUŞTURMA ---
  async buyItem(userId: number, itemPackageId: number) {
    return this.prisma.delivery.create({
      data: {
        userId: userId,           // Kim aldı?
        itemPackageId: itemPackageId, // Ne aldı?
        gameUserId: "Player_" + userId, // (Simülasyon) Oyundaki ID'si ne?
      }
    });
  }
}
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.itemPackage.create({
      data: {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        appId: parseInt(data.appId),
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

  // --- 🔥 FİNAL DÜZELTME: İSİM 'buyItem' OLARAK GÜNCELLENDİ ---
  async buyItem(userId: number, itemPackageId: number) {
    
    // 1. Verileri Bul
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const item = await this.prisma.itemPackage.findUnique({ where: { id: itemPackageId } });

    // 2. Kontroller
    if (!user) throw new BadRequestException('Kullanıcı bulunamadı');
    if (!item) throw new BadRequestException('Paket bulunamadı');
    if (user.balance < item.price) throw new BadRequestException('Yetersiz Bakiye!');

    // 3. TRANSACTION (Atomik İşlem)
    return this.prisma.$transaction(async (tx) => {
      
      // A. Parayı Düş
      await tx.user.update({
        where: { id: userId },
        data: { balance: user.balance - item.price }
      });

      // B. Envantere Ekle (Delivery)
      const delivery = await tx.delivery.create({
        data: {
          userId: userId,
          itemPackageId: itemPackageId,
          gameUserId: user.username, 
        }
      });

      return delivery;
    });
  }
}
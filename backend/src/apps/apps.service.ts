import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.app.findMany({
      include: { categories: true, itemPackages: true },
    });
  }

  async create(data: any) {
    return this.prisma.app.create({
      data: {
        name: data.name,
        version: data.version,
        description: data.description,
        apkDownloadUrl: data.apkDownloadUrl,
        imageUrl: data.imageUrl,
        
        // Kategori bağlantısı (Varsa bağla)
        categories: data.categoryId ? {
            connect: { id: parseInt(data.categoryId) } 
        } : undefined,
      },
    });
  }
  
  async findOne(id: number) {
    return this.prisma.app.findUnique({
      where: { id },
      include: { categories: true, itemPackages: true },
    });
  }

  // --- 🔥 YENİ EKLENEN UPDATE FONKSİYONU ---
  async update(id: number, data: any) {
    return this.prisma.app.update({
      where: { id },
      data: {
        name: data.name,
        version: data.version,
        description: data.description,
        apkDownloadUrl: data.apkDownloadUrl,
        imageUrl: data.imageUrl,

        // Kategori güncellenirse eskileri sil, yenisini bağla
        categories: data.categoryId ? {
            set: [], // Önceki bağlantıları kopar
            connect: { id: parseInt(data.categoryId) } // Yenisini bağla
        } : undefined,
      },
    });
  }
  // -----------------------------------------

  async delete(id: number) {
    return this.prisma.app.delete({
      where: { id },
    });
  }
}
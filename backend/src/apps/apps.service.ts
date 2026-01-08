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
        // Frontend'den gelen categories: { connect: [...] } yapısını doğrudan kullanıyoruz
        categories: data.categories, 
      },
    });
  }
  
  async findOne(id: number) {
    return this.prisma.app.findUnique({
      where: { id },
      include: { categories: true, itemPackages: true },
    });
  }

  async update(id: number, data: any) {
    return this.prisma.app.update({
      where: { id },
      data: {
        name: data.name,
        version: data.version,
        description: data.description,
        apkDownloadUrl: data.apkDownloadUrl,
        imageUrl: data.imageUrl,
        // Frontend'den gelen categories: { set: [], connect: [...] } yapısını doğrudan kullanıyoruz
        categories: data.categories,
      },
    });
  }

  async delete(id: number) {
    return this.prisma.app.delete({
      where: { id },
    });
  }
}
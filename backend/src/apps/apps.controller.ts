import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AppsService } from './apps.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('apps')
export class AppsController {
  constructor(private readonly appsService: AppsService, private prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.appsService.findAll();
  }

  // Kategorileri Getir
  @Get('categories')
  async getCategories() {
    return this.prisma.category.findMany();
  }

  // Kategori Ekle
  @Post('categories')
  async createCategory(@Body() body: { name: string }) {
    return this.prisma.category.create({
      data: { name: body.name },
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appsService.findOne(+id);
  }

  @Post()
  create(@Body() createAppDto: any) {
    return this.appsService.create(createAppDto);
  }

  // --- 🔥 YENİ: GÜNCELLEME (PATCH) ENDPOINT ---
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAppDto: any) {
    return this.appsService.update(+id, updateAppDto);
  }
  // --------------------------------------------

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.appsService.delete(+id);
  }
}
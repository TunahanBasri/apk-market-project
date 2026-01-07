import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ItemsService } from './items.service';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get('app/:appId')
  findByAppId(@Param('appId') appId: string) {
    return this.itemsService.findByAppId(+appId);
  }

  @Post()
  create(@Body() createItemDto: any) {
    return this.itemsService.create(createItemDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.itemsService.delete(+id);
  }

  // --- 🔥 YENİ: SATIN ALMA İSTEĞİ BURAYA GELİR ---
  @Post('buy')
  buyItem(@Body() body: { userId: number, itemId: number }) {
    return this.itemsService.buyItem(body.userId, body.itemId);
  }
}
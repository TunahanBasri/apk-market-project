import { Controller, Get, Post, Body } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';

@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  findAll() {
    return this.deliveriesService.findAll();
  }

  @Post()
  create(@Body() data: any) {
    return this.deliveriesService.create(data);
  }
}
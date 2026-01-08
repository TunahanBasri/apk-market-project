import { Controller, Post, Body, Get, UseGuards, Request, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  // Token kontrolünü test etmek için endpoint
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  // --- 🔥 YENİ: GÜNCEL KULLANICI BAKİYESİNİ ÇEKMEK İÇİN ---
  @Get('user/:id')
  async getUser(@Param('id') id: string) {
    return this.authService.getUserById(+id);
  }
}
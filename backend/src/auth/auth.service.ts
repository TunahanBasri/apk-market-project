import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // 🔥 GÜNCELLENDİ: ARTIK EMAIL İLE GİRİŞ YAPILIYOR
  async login(body: any) {
    // 1. Frontend'den artık 'email' ve 'password' alıyoruz
    const { email, password } = body;

    // 2. Kullanıcıyı EMAIL adresine göre bul (Eskiden username idi)
    const user = await this.prisma.user.findUnique({
      where: { email: email }, // 👈 Kritik değişiklik burası
      include: { roles: true },
    });

    if (!user) {
      throw new UnauthorizedException('Bu email adresiyle kayıtlı kullanıcı bulunamadı');
    }

    // 3. Şifreyi kontrol et (Aynı kalıyor)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Şifre hatalı');
    }

    // 4. Token oluştur
    const payload = { 
      sub: user.id, 
      username: user.username, // Token içinde username durabilir, ekranda göstermek için lazım
      roles: user.roles.map(r => r.name) 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance, 
        roles: user.roles.map(r => r.name)
      }
    };
  }

  // KAYIT OLMA (REGISTER) - AYNI KALIYOR
  async register(body: any) {
    const { username, email, password } = body;

    // Kullanıcı var mı kontrol et
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser) {
      throw new ConflictException('Kullanıcı adı veya email zaten kayıtlı');
    }

    // Şifreyi şifrele
    const hashedPassword = await bcrypt.hash(password, 10);

    // USER rolünü bul
    const userRole = await this.prisma.role.findUnique({ where: { name: 'USER' } });

    if (!userRole) {
      throw new InternalServerErrorException('Sistemde USER rolü tanımlı değil.');
    }

    // Kaydet
    const newUser = await this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        roles: {
          connect: { id: userRole.id },
        },
      },
    });

    return { message: 'Kayıt başarılı', userId: newUser.id };
  }

  // ID İLE KULLANICI GETİR
  async getUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id: id },
    });
  }
}
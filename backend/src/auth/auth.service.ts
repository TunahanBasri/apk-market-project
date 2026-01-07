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

  // GİRİŞ YAPMA (LOGIN)
  async login(body: any) {
    const { username, password } = body;

    // 1. Kullanıcıyı bul
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { roles: true },
    });

    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    // 2. Şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Şifre hatalı');
    }

    // 3. Token oluştur
    const payload = { 
      sub: user.id, 
      username: user.username, 
      roles: user.roles.map(r => r.name) 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles.map(r => r.name)
      }
    };
  }

  // KAYIT OLMA (REGISTER)
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

    // --- HATA DÜZELTME KISMI ---
    // Eğer veritabanında USER rolü yoksa hata fırlat (TypeScript null hatasını önler)
    if (!userRole) {
      throw new InternalServerErrorException('Sistemde USER rolü tanımlı değil. Lütfen yönetici ile iletişime geçin.');
    }
    // ---------------------------

    // Kaydet
    const newUser = await this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        roles: {
          connect: { id: userRole.id }, // Artık userRole kesinlikle var, hata vermez.
        },
      },
    });

    return { message: 'Kayıt başarılı', userId: newUser.id };
  }
}
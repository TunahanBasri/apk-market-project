import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express'; // Body parser yerine bunları kullanıyoruz

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 🔥 CORS AYARI: En garanti yöntem
  app.enableCors({
    origin: true, // Gelen isteğin domaini neyse ona izin verir (Vercel linklerin için en iyisi)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 🔥 LİMİT AYARI: NestJS/Express tarzı güncel yazım
  app.use(json({ limit: '50mb' })); 
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // Port ayarı (Railway için '0.0.0.0' kritik)
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Uygulama port ${port} üzerinde çalışıyor...`);
}
bootstrap();
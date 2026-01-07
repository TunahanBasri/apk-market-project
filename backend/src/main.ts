import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // 1. Swagger importlarını ekledik

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 2. 🔥 SWAGGER YAPILANDIRMASI
  const config = new DocumentBuilder()
    .setTitle('APK Market API')
    .setDescription('APK Market backend dökümantasyonu ve test paneli')
    .setVersion('1.0')
    .addBearerAuth() // JWT token ile test yapabilmek için kilit ikonu ekler
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  // Dokümantasyona 'api/docs' adresinden ulaşacaksın
  SwaggerModule.setup('api/docs', app, document);

  // 🔥 CORS AYARI: En garanti yöntem
  app.enableCors({
    origin: true, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 🔥 LİMİT AYARI
  app.use(json({ limit: '50mb' })); 
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // Port ayarı (Railway için '0.0.0.0' kritik)
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Uygulama port ${port} üzerinde çalışıyor...`);
  console.log(`Swagger dökümantasyonu: http://localhost:${port}/api/docs`);
}
bootstrap();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors(); // Frontend'in Backend'e erişmesi için şart

  const bodyParser = require('body-parser');
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // --- 🔥 DEĞİŞTİRİLEN KISIM ---
  // Eğer bulut sistemi bir port verirse onu kullan (process.env.PORT), yoksa 3000 kullan.
  // "0.0.0.0" adresi bulut sistemlerinde dışarıya açılmak için gereklidir.
  await app.listen(process.env.PORT || 3000, '0.0.0.0'); 
}
bootstrap();
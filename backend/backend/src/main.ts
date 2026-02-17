import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Disable ETag (Express specific)
  // Dies verhindert 304 Responses im Dev-Mode, damit wir immer den vollen Body bekommen.
  // NestJS verwendet Express als Default, daher können wir auf die darunterliegende Instanz zugreifen.
  const expressApp = app.getHttpAdapter().getInstance();
  if (expressApp && typeof expressApp.disable === 'function') {
    expressApp.disable('etag');
  }

  // Setze 'Cache-Control: no-store' global
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.enableCors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

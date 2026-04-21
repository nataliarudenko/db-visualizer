import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // Дозволяємо запити з будь-якого фронтенду (для легкого деплою)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Meta-DB Visualizer Backend running on port ${port}`);
}
bootstrap();

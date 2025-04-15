import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Games API')
    .setDescription(`
      API para gerenciamento de informações de jogos, integrando com a RAWG API.
      
      Recursos Principais
      - Busca de jogos na RAWG API
      - Cache de resultados
      - Armazenamento em PostgreSQL
      - Filtros e paginação
      
       Fluxo de Dados
      1. Ao buscar um jogo, primeiro verificamos o cache
      2. Se não encontrado, buscamos na RAWG API
      3. Os dados são salvos no PostgreSQL
      4. Resultados são cacheados para futuras consultas
    `)
    .setVersion('1.0')
    .addTag('games', 'Operações relacionadas a jogos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
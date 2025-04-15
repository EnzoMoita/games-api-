# Games API

Uma API NestJS para gerenciamento de informações de jogos, com PostgreSQL, cache em Redis e integração com a API da RAWG.

## Features

- Busca de jogos utilizando a API da RAWG
- Cache de resultados com Redis
- Armazenamento de dados dos jogos em PostgreSQL
- Filtros e paginação na listagem de jogos
- Documentação com Swagger

## Prerequisites

- Node.js
- Docker e Docker Compose
- RAWG API key (obtenha em: https://rawg.io/apidocs)

## Setup

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Copie o `.env.example` para `.env` e preencha com os valores corretos
4. Inicie o banco de dados e o Redis:
   ```bash
   docker-compose up -d
   ```
5. Execute as migrações do banco de dados:
   ```bash
   npx prisma migrate dev
   ```
6. Inicie a aplicação:
   ```bash
   npm run start:dev
   ```

## Documentação da API

Com a aplicação em execução, acesse http://localhost:3000/api para visualizar a documentação via Swagger.

### Endpoints

- `GET /games/search?title=game_title` - Buscar jogos
- `GET /games?title=filter&platform=filter&page=1&limit=10` - Listar jogos com filtros e paginação

## Testes

```bash
npm run test
```

## Build para Produção

```bash
npm run build
npm run start:prod
```

# Games API

Uma API NestJS para gerenciamento de informações de jogos, com PostgreSQL, cache em Redis, autenticação JWT e integração com a API da RAWG.

## Features

- Autenticação JWT com registro e login de usuários
- Rotas protegidas com middleware de autenticação
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
3. Copie o `.env.example` para `.env` e preencha com os valores corretos:

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

## Endpoints da API

### Autenticação

#### POST /auth/register

Registra um novo usuário no sistema.

Body:

```json
{
  "email": "user@example.com",
  "password": "senha123",
  "name": "Seu nome"
}
```

#### POST /auth/login

Realiza login e retorna um token JWT.

Body:

```json
{
  "email": "user@example.com",
  "password": "senha123"
}
```

### Jogos (Requer Autenticação)

Para acessar estes endpoints, é necessário incluir o token JWT no header:

```
Authorization: Bearer <seu_token_jwt>
```

#### GET /games/search

Busca um jogo específico pelo título.

Query Parameters:

- `title` (string, required): Título do jogo para busca

Exemplos:

```bash
GET http://localhost:3000/games/search?title=elden ring
GET http://localhost:3000/games/search?title=the witcher 3
```

#### GET /games

Lista os jogos armazenados com suporte a filtros e paginação.

Query Parameters:

- `title` (string, optional): Filtrar por título
- `platform` (string, opcional): Filtrar por nome da plataforma
- `page` (number, optional, default: 1): Página atual
- `limit` (number, optional, default: 10): Itens por página

Exemplos:

```bash
GET http://localhost:3000/games
GET http://localhost:3000/games?page=2&limit=5
GET http://localhost:3000/games?platform=PC
GET http://localhost:3000/games?title=god&platform=PS5&page=1&limit=3
```

## Testes

```bash
npm run test:e2e
```

## Build para Produção

```bash
npm run build
npm run start:prod
```

## Segurança

- Senhas são armazenadas com hash usando bcrypt
- Tokens JWT expiram em 24 horas
- Todas as rotas de jogos são protegidas e requerem autenticação
- Validação de dados usando class-validator
- Proteção contra ataques comuns usando Helmet

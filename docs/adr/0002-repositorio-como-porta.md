# 2. Definir o repositório como porta

Data: 2026-08-12

## Status

Aceito

## Contexto

Os handlers precisam guardar e buscar jogos. A saída óbvia em NestJS é injetar o
repositório do TypeORM direto. O problema é que isso faz a regra de negócio
depender do ORM: o tipo `Repository<GameRow>` entra na assinatura, e a partir daí o
handler só existe se o TypeORM existir.

## Decisão

A interface `GameRepository` vive em `shared/game.repository.ts`, junto de quem a usa, e
não junto de quem a implementa. Ela fala em `Game` (a entidade), não em linha de tabela.
Os adaptadores em `shared/persistence/` é que implementam a interface.

Como TypeScript apaga interfaces na compilação, não dá para injetar por tipo. Usei um
token `Symbol('GAME_REPOSITORY')` exportado ao lado da interface, e o handler pede
com `@Inject(GAME_REPOSITORY)`.

Comecei com `InMemoryGameRepository` de propósito. Ele não é só um mock de teste: é um
adaptador de verdade, usado pela aplicação rodando. Isso força a interface a ficar
honesta antes de existir banco.

## Consequências

Ganhei:

- Os testes de handler usam o adaptador in-memory real, sem mock e sem stub. O que
  o teste exercita é o mesmo caminho que a aplicação executa.
- A porta é pequena por necessidade: `save`, `findById`, `findAll`, `delete`.
  Nada de `QueryBuilder` vazando para dentro de uma fatia.
- Trocar para Postgres é escrever uma classe nova e mudar uma linha do módulo.

Paguei:

- O token por Symbol é cerimônia. Quem lê pela primeira vez estranha o `@Inject`
  em vez da injeção por tipo, e isso obriga a importar o tipo com `import type` por
  causa do `emitDecoratorMetadata`.
- `save` faz insert e update ao mesmo tempo. Resolve agora porque o Map sobrescreve a
  chave, mas quando entrar Postgres preciso decidir se mantenho upsert ou separo as
  operações.

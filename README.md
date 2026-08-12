# Game Letterbox

API para catalogar jogos, dar nota e acompanhar o que estou jogando. Um Letterboxd
de jogos, em escopo pequeno.

Organizado em **vertical slices**: uma pasta por funcionalidade, contendo tudo que só
ela usa. O escopo é propositalmente enxuto — o que quero demonstrar é organização de
código e isolamento de regra de negócio, não quantidade de features. As decisões estão
em [`docs/adr/`](docs/adr).

## Arquitetura

```mermaid
flowchart TD
    subgraph features["features — uma pasta por funcionalidade"]
        CREATE["create-game<br/>controller · handler · dto"]
        LIST["list-games<br/>controller · handler · dto"]
        RANK["rank-backlog<br/>controller · handler · dto<br/>BacklogRanker · presenter"]
        REST["get-game · rate-game<br/>update-status · delete-game"]
    end

    subgraph shared["shared — só o que é de todos"]
        ENT["Game<br/>(entidade e suas regras)"]
        PORT["GameRepository<br/>(porta)"]
        ERR["DomainError"]
        PRES["game.presenter"]
    end

    subgraph adapters["shared/persistence"]
        MEM["InMemoryGameRepository"]
        PG["TypeOrmGameRepository<br/>+ GameSchema + mapper"]
    end

    CREATE --> ENT
    LIST --> PORT
    RANK --> ENT
    REST --> ENT
    CREATE --> PORT
    RANK --> PORT
    REST --> PORT
    MEM -.implementa.-> PORT
    PG -.implementa.-> PORT
    ENT --> ERR
```

Duas coisas para reparar.

**As fatias não conversam entre si.** Nenhuma seta liga uma funcionalidade a outra.
Mexer em `rate-game` não pode quebrar `rank-backlog`, e os testes de cada fatia
constroem seus próprios dados em vez de chamar o handler da vizinha.

**As setas pontilhadas continuam sendo a inversão de dependência.** Os adaptadores de
banco dependem da interface, nunca o contrário — foi o que sobreviveu inteiro da
organização anterior. Trocar Postgres por memória continua sendo uma variável de
ambiente, sem tocar em fatia nenhuma.

### Por que não em camadas

A alternativa que considerei primeiro foi dividir em `domain/`, `application/` e
`infrastructure/`, ao estilo Clean Architecture. O raciocínio completo está no
[ADR 1](docs/adr/0001-organizacao-por-funcionalidade.md); o resumo cabe em um exemplo.

Um campo como `hoursToBeat` atravessa entidade, schema, mapper, DTO e presenter.
Nenhuma dessas mudanças é sobre uma camada — todas são sobre *o campo*. Dividir por
camada organiza o código por um eixo pelo qual ele quase nunca muda, e cobra a conta em
todo campo novo.

Clean Architecture se paga quando a regra de negócio é o ativo principal e precisa
sobreviver a anos de troca de framework e de time. Num catálogo pequeno com um
algoritmo, não se paga. O que aquele desenho tem de valioso — porta de repositório e
regra dentro da entidade — não depende das três pastas, e está aqui.

## O que jogar agora

A pergunta que o catálogo existe para responder. `GET /games/backlog` ordena o
que está esperando e diz por quê:

```json
[
  {
    "game": { "title": "Tunic", "genre": "Metroidvania", "hoursToBeat": 11 },
    "score": 0.498,
    "because": { "genreMatch": 0.738, "shortness": 0.645, "waiting": 0 }
  },
  {
    "game": { "title": "Elden Ring", "genre": "Soulslike", "hoursToBeat": 120 },
    "score": 0.31,
    "because": { "genreMatch": 0.563, "shortness": 0.143, "waiting": 0 }
  }
]
```

A nota é a soma ponderada de três partes, cada uma entre 0 e 1: afinidade com o
gênero (peso 0,5), quão curto é (0,2) e há quanto tempo espera (0,3).

**A afinidade é aprendida das notas que dei**, sem eu declarar gosto nenhum. Um
gênero avaliado poucas vezes é puxado para a média geral, pela mesma média
bayesiana que o IMDb usa no Top 250 — uma nota 10 solta não vira paixão. Gênero
nunca avaliado recebe a média, não zero.

**Cada parte é medida contra uma referência fixa, nunca contra os outros jogos.**
Normalizar por min-max dentro do backlog faria a nota de um jogo depender dos
demais, e cadastrar um jogo de 200 horas reordenaria a lista inteira em silêncio.
Com curvas de saturação isso não acontece, e há um teste que trava esse
comportamento.

**A resposta devolve a decomposição**, não só o total. Um número sozinho não se
discute; com as partes dá para ver por que um jogo veio na frente.

Custo: **O(h + b log b)** para `h` jogos avaliados e `b` no backlog — uma passada
para aprender o gosto, uma para pontuar, e a ordenação. Memória **O(g)** para os
gêneros distintos. O raciocínio completo está no
[ADR 5](docs/adr/0005-ranking-do-backlog-no-dominio.md).

O ranking vive em [`BacklogRanker`](src/features/rank-backlog/backlog-ranker.ts),
dentro da própria fatia: recebe os jogos e o instante, devolve a ordem. Não conhece
banco, não conhece HTTP, e roda em milissegundos nos testes.

## Trocando a persistência

Os dois adaptadores entram pela mesma porta, e a escolha é uma variável de ambiente:

```bash
DB_DRIVER=memory     # padrão, nada para instalar
DB_DRIVER=postgres   # usa DATABASE_URL
```

Nenhuma fatia, nenhuma entidade e nenhum controller muda entre os dois. O que muda
está inteiro em [`persistence.module.ts`](src/shared/persistence/persistence.module.ts).

Para garantir que "mesma porta" signifique mesmo comportamento, existe um teste de
contrato: [`game-repository.contract.ts`](src/shared/persistence/game-repository.contract.ts)
é uma suíte única que os dois adaptadores precisam passar. O in-memory roda sempre; o
Postgres roda quando há banco alcançável e é pulado quando não há.

Esse contrato já pagou o próprio custo três vezes:

- O in-memory guardava a referência do objeto, então mutar um `Game` devolvido alterava o
  "banco" sem nenhum `save`. O Postgres nunca se comportaria assim. Passou a guardar cópia.
- O driver `pg` devolve `numeric` como string, então `rating` chegava como `"8.5"`.
- Uma data de lançamento gravada em coluna `date` perdia um dia em qualquer fuso a oeste
  de UTC, porque o driver formata a partir dos componentes locais. Rodo em UTC-3, e
  `2017-02-24` virava `2017-02-23`.

Nenhum dos três apareceria testando os adaptadores separadamente.

### Regra de dependência

| Pasta | Pode importar | Não pode importar |
| --- | --- | --- |
| `shared/game.ts` | `shared/errors.ts` | qualquer fatia, NestJS, ORM |
| `shared/` (resto) | `shared/` | qualquer fatia |
| `features/<fatia>/` | `shared/`, a própria fatia | **outra fatia** |

A última linha é a que importa. Uma fatia importar outra é o começo do fim desta
organização, e é a única regra que exige disciplina para manter.

Sobre o que entra em `shared/`: só o que **já** é usado por duas fatias, nunca por
antecipação. Duplicar antes de compartilhar é preferível a compartilhar cedo demais e
transformar `shared/` em depósito.

## Endpoints

| Método | Rota | O que faz |
| --- | --- | --- |
| `POST` | `/games` | Cadastra um jogo |
| `GET` | `/games` | Lista, com filtros `genre`, `platform`, `status` |
| `GET` | `/games/backlog` | Ranqueia o que jogar em seguida, com `limit` opcional |
| `GET` | `/games/:id` | Busca um jogo |
| `PATCH` | `/games/:id/rating` | Atualiza a nota (0 a 10) |
| `PATCH` | `/games/:id/status` | Muda o status |
| `DELETE` | `/games/:id` | Remove |

Status possíveis: `backlog`, `playing`, `completed`, `dropped`.

Exemplo:

```bash
curl -X POST http://localhost:3000/games -H 'Content-Type: application/json' -d '{"title":"Hollow Knight","genre":"Metroidvania","platform":"PC","releaseDate":"2017-02-24","description":"Explore a ruined kingdom of insects."}'
```

## Rodando

Direto, com armazenamento em memória:

```bash
npm install
npm run start:dev
```

Com Postgres, tudo em contêiner:

```bash
docker compose up
```

O compose publica o banco em `5433` no host, para não disputar a porta com um Postgres
já instalado na máquina. Dentro da rede do compose a API fala com ele em `db:5432`.

Há um [`api.http`](api.http) com as chamadas prontas, incluindo os casos de erro.

## Testes

```bash
npm test          # entidade, handlers de cada fatia e contrato do adaptador in-memory
npm run test:e2e  # HTTP de ponta a ponta
```

O contrato do adaptador Postgres só roda com um banco de pé:

```bash
docker compose up -d db
DATABASE_URL=postgres://letterbox:letterbox@localhost:5433/letterbox npm test
```

No CI ele roda sempre, contra um service container.

## Decisões e trade-offs

Os ADRs têm o raciocínio completo. O resumo:

- **[ADR 1](docs/adr/0001-organizacao-por-funcionalidade.md) — organizar por
  funcionalidade, não por camada.** Uma pasta por operação, com controller, handler e
  DTO juntos. Ganha localidade: a funcionalidade inteira cabe em uma pasta. Custa a
  ordem frágil entre `/games/backlog` e `/games/:id`, que vivem em controllers
  diferentes e dependem da ordem de registro no módulo.

- **[ADR 2](docs/adr/0002-repositorio-como-porta.md) — repositório como porta no domínio.**
  Comecei com adaptador in-memory de propósito, para a interface ficar honesta antes de
  existir banco. O custo é injetar por `Symbol` em vez de por tipo, porque TypeScript
  apaga interfaces na compilação.

- **[ADR 3](docs/adr/0003-erros-de-dominio-na-borda.md) — erro de domínio traduzido só na borda.**
  A entidade lança `InvalidRatingError`, não `BadRequestException`, e um filtro na
  infraestrutura mapeia para 422. DTO valida forma, domínio valida regra: `rating: "abc"`
  é 400, `rating: 42` é 422. O custo é a mensagem de faixa não sair no mesmo formato das
  demais mensagens de validação.

- **[ADR 4](docs/adr/0004-mapeamento-por-entityschema.md) — mapeamento por `EntitySchema`,
  fora da entidade.** Decorar `Game` com `@Entity()` seria mais curto e colocaria o ORM
  dentro do domínio. O schema fica declarado à parte e um mapper converte nos dois
  sentidos. O custo é escrever e manter esse mapper à mão.

- **[ADR 5](docs/adr/0005-ranking-do-backlog-no-dominio.md) — ranking isolado de I/O.**
  A decisão de o que jogar em seguida não é banco e não é HTTP, então vive numa classe
  própria dentro da fatia, testável sem subir nada. O custo é mais um conceito; o ganho
  é uma regra pura que roda em milissegundos.

### O trade-off que mais pesa

Vertical Slice é padrão menos reconhecido que Clean Architecture ou camadas simples.
Quem abre o repositório esperando `domain/` e `application/` precisa de um momento para
se localizar, e em conversa técnica o vocabulário é menos comum.

Escolhi assim porque o eixo de organização deve seguir o eixo pelo qual o código muda, e
aqui o código muda por funcionalidade. Mas é uma troca de familiaridade por adequação, e
ela é real.

O que não abri mão foi do que sustenta os dois desenhos: a porta de repositório e a
regra dentro da entidade. É por isso que trocar Postgres por memória continua sendo uma
variável de ambiente, e que a entidade e o ranker são testáveis sem subir nada.

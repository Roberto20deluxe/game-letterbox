# 1. Organizar o código por funcionalidade

Data: 2026-08-12

## Status

Aceito.

## Contexto

Já escrevi API em NestJS do jeito que a documentação sugere: controller chama
service, service usa o repositório do ORM direto. Funciona, mas a regra de
negócio acaba espalhada entre o service e o schema do banco. Quando quis testar
uma regra simples, precisei subir módulo do Nest e mock de ORM para verificar um
`if`.

Quero duas coisas deste projeto: que a regra de negócio seja testável sem
framework e sem banco, e que trocar a persistência não signifique reescrever o
núcleo. Falta decidir por qual eixo dividir as pastas.

### O que considerei

**Camadas ao estilo Clean Architecture** — `domain/`, `application/` e
`infrastructure/`, com a dependência sempre apontando para dentro. É o desenho
mais conhecido e resolve os dois objetivos acima.

Foi a primeira que cogitei, e por dois motivos que não são técnicos: é a que eu
conheço melhor, e é a que um amigo meu usa no trabalho, então é o vocabulário em
que a gente discute arquitetura. Vale registrar isso porque familiaridade é um
critério de verdade — pesa na velocidade de escrever e na de manter — mas é fácil
confundi-la com adequação, e foi o que quase aconteceu aqui.

O que me fez recusar foi o tamanho do problema. Clean Architecture existe para
proteger regra de negócio complexa ao longo de anos, contra troca de framework,
de banco e de time. Este é um catálogo pequeno com um algoritmo. Pelo custo,
divide o código por um eixo pelo qual ele quase nunca muda: adicionar um campo
como `hoursToBeat` obriga a tocar entidade, schema, mapper, DTO e presenter — e
nenhuma dessas mudanças é sobre uma camada, todas são sobre *o campo*.

Há um segundo sintoma. Em um catálogo, a maior parte das operações é consulta e
escrita simples. Uma camada de aplicação dedicada produziria arquivos como
`ListGamesUseCase`, cujo corpo inteiro seria `return this.games.findAll(filters)`.
Existiriam por simetria, não por necessidade.

**Controller, service e repositório** — o padrão que a própria documentação do
Nest sugere. É honesto para o tamanho do problema, mas concentra tudo em um
`GamesService` que cresce sem limite claro, e é justamente o desenho onde eu já
tinha visto a regra de negócio escapar para o service.

## Decisão

O código é organizado por funcionalidade. Cada operação da API é uma pasta que
contém tudo que só ela usa:

```
src/
  shared/                      o que é genuinamente de todos
    game.ts                    entidade e suas invariantes
    errors.ts
    game.repository.ts         a porta
    game.presenter.ts          a forma com que um jogo é devolvido
    persistence/               os dois adaptadores e o contrato entre eles
  features/
    create-game/               controller + handler + dto
    list-games/
    get-game/
    rate-game/
    update-status/
    delete-game/
    rank-backlog/              controller + handler + dto + o ranker + presenter
```

Cada fatia tem um `handler`, que é onde a operação acontece, e um controller que
só traduz HTTP. Adicionar uma funcionalidade é criar uma pasta e registrá-la no
módulo. Adicionar um campo a uma funcionalidade existente toca a pasta dela e,
quando o campo é persistido, o `shared/`.

Duas regras sustentam o desenho:

**Uma fatia nunca importa outra.** É a única restrição que exige disciplina, e é
o que impede que a organização degenere em pastas com nomes bonitos e
dependências cruzadas. Os testes de cada fatia constroem seus próprios dados a
partir da entidade, em vez de chamar o handler da vizinha.

**Só entra em `shared/` o que já é usado por duas fatias.** Nunca por
antecipação. Duplicar antes de compartilhar é preferível a compartilhar cedo
demais e transformar `shared/` em depósito.

O que a organização por camadas tem de valioso não foi descartado, porque não
dependia das três pastas:

- A **porta de repositório** vive em `shared/`, e os adaptadores dependem dela e
  não o contrário ([ADR 2](0002-repositorio-como-porta.md)).
- A **regra de negócio fica na entidade**, não no DTO nem no handler, porque vale
  para qualquer entrada.
- O **erro de domínio** é traduzido para HTTP só na borda
  ([ADR 3](0003-erros-de-dominio-na-borda.md)).

## Consequências

Ganhei:

- Localidade. Ler `rank-backlog/` mostra a funcionalidade inteira em uma pasta:
  como entra, o que valida, o algoritmo, como sai.
- Nenhum arquivo existe por simetria. `ListGamesHandler` tem seis linhas e mora
  na pasta da própria funcionalidade, sem precisar justificar-se como camada.
- Isolamento entre funcionalidades. Mexer em `rate-game` não quebra
  `rank-backlog`, e o teste de uma fatia não depende de outra.
- Regra de negócio testável sem framework e sem banco, que era o objetivo
  original. Os testes da entidade e do ranker rodam em milissegundos.

Paguei:

- **A ordem de rotas ficou frágil.** `/games/backlog` e `/games/:id` são literal
  e curinga no mesmo caminho, e vivem em controllers diferentes. O Nest resolve
  na ordem em que o módulo lista os controllers, então `RankBacklogController`
  precisa vir antes de `GetGameController`. Com um controller único a ordem dos
  métodos no arquivo bastaria e seria visível. Hoje é um acoplamento entre a
  lista do módulo e o comportamento, contido por um comentário e por um teste de
  ponta a ponta.
- **`shared/` exige vigilância.** A regra das duas fatias é uma decisão de
  processo, não algo que o compilador garanta.
- **É um padrão menos reconhecido** que Clean Architecture ou camadas simples.
  Quem abre o repositório esperando `domain/` e `application/` precisa de um
  momento para se localizar.

Se o domínio crescesse muito — muitas regras, vários agregados, invariantes entre
eles — eu reconsideraria. Quando a regra de negócio é o ativo principal, isolá-la
em uma camada própria compensa a cerimônia. A organização por funcionalidade se
paga quando o sistema é um conjunto de operações relativamente independentes
sobre um núcleo pequeno, que é este caso.

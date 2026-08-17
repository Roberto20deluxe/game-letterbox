# 4. Mapear o Postgres por EntitySchema, fora da entidade

Data: 2026-08-12

## Status

Aceito.

## Contexto

Até aqui o único adaptador de persistência era o in-memory. Ele resolve os testes
e o desenvolvimento local, mas não prova nada: a promessa da arquitetura é que dá
para trocar o banco sem tocar no domínio, e uma promessa com um adaptador só é
uma afirmação, não uma demonstração. Precisava de um segundo adaptador real.

Escolhido o TypeORM com Postgres, apareceu a decisão que de fato importa. O
caminho que todo tutorial mostra é decorar a entidade de domínio:

```ts
@Entity()
export class Game {
  @PrimaryColumn('uuid') id: string;
  @Column() title: string;
}
```

Isso é conveniente e custa caro. A entidade `Game` passaria a importar `typeorm`,
e o `shared/game.ts` — o arquivo que toda fatia usa e que não deve conhecer nem
banco nem framework — ficaria amarrado a um ORM específico. O teste da entidade
deixaria de rodar sem os `reflect-metadata`, e a regra de negócio de `rating`
viveria em um arquivo que também descreve tipos de coluna.

## Decisão

O mapeamento fica declarado fora da entidade, em `EntitySchema`, e a conversão
entre linha e objeto de domínio é explícita, em um mapper.

- `game.schema.ts` descreve a tabela: colunas, tipos, nomes em snake_case, índices.
- `game.mapper.ts` converte nos dois sentidos.
- `typeorm-game.repository.ts` implementa a porta `GameRepository` usando os dois.
- `Game` continua sem um único import de infraestrutura.

A escolha do adaptador acontece em `PersistenceModule.register()`, lendo
`DB_DRIVER`. Nenhuma fatia sabe qual dos dois está em pé.

Junto disso veio um teste de contrato: `game-repository.contract.ts` é uma suíte
única que os dois adaptadores precisam passar. O in-memory roda sempre; o Postgres
roda quando há um banco alcançável (`docker compose up -d db`, ou o service
container do CI) e é pulado quando não há.

## Consequências

O domínio permanece puro e testável sem nenhuma dependência de banco. Trocar de
ORM no futuro é reescrever o schema, o mapper e o repositório, sem tocar em
entidade ou fatia.

O mapper é código que precisa ser escrito e mantido à mão, e é uma duplicação
aparente: os campos aparecem na entidade, no schema e no mapper. Aceito esse
custo — ele é o preço de manter a dependência apontando para dentro, e me
protegeu de um bug concreto: o driver `pg` devolve `numeric` como string e `date`
como `'YYYY-MM-DD'`, então sem conversão explícita um `rating` viria como
`"8.5"`. O teste de contrato verifica o tipo justamente por isso.

O contrato compartilhado também expôs uma divergência real entre os adaptadores.
O in-memory guardava a referência do objeto, então mutar um `Game` devolvido
alterava o "banco" sem nenhum `save` — comportamento que o Postgres jamais teria.
Passou a guardar uma cópia. Sem o contrato, os dois adaptadores teriam passado nos
seus próprios testes escondendo a diferença, e ela apareceria só em produção.

O esquema é criado por `synchronize`, controlado por `DB_SYNCHRONIZE`, e não por
migrations. É um atalho consciente: para um repositório de estudo com uma tabela,
migrations seriam cerimônia sem contrapartida, e o `synchronize` mantém o foco no
que este projeto quer mostrar. Não é o que eu faria em produção com dados reais —
lá ele pode dropar coluna para fazer o banco bater com o código. O caminho seria
`typeorm migration:generate` e desligar o `synchronize`; a estrutura atual já
comporta isso sem tocar em domínio, porque o schema já está declarado à parte.

A escolha por variável de ambiente significa que uma configuração errada só é
descoberta em runtime. Mitigado em parte pelo `resolveDriver`, que trata qualquer
valor diferente de `postgres` como `memory`, e pelo suite e2e, que fixa o driver
para não seguir o que estiver no shell.

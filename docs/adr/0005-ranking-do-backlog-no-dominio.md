# 5. Isolar o ranking do backlog em uma classe própria

Data: 2026-08-17

## Status

Aceito.

## Contexto

A pergunta que um catálogo de jogos naturalmente faz é "o que eu jogo agora?".
Responder isso não é buscar dados: é decidir uma ordem, com regra e com
trade-off. Precisava escolher onde essa decisão mora.

Três opções:

1. **No controller.** Rápido e errado: a regra ficaria presa ao HTTP e sumiria no
   dia em que existisse um CLI ou um job.
2. **Dentro do handler.** Funcionaria, mas misturaria duas coisas de naturezas
   diferentes — buscar dados é I/O, decidir a ordem é regra. Testar a segunda
   exigiria encenar a primeira.
3. **Em uma classe própria, sem I/O.** A regra fica isolada, pura e testável
   sozinha.

## Decisão

O ranking mora em `BacklogRanker`, dentro da fatia `features/rank-backlog/`, ao
lado do único lugar que o usa. Ele recebe os jogos e o instante atual, e devolve a
lista pontuada. Não busca nada, não conhece repositório, não importa NestJS.

O `RankBacklogHandler` faz o que cabe à fatia: lê o catálogo, separa o que está no
backlog do que serve de histórico, chama o ranker e aplica o limite.

Para o `BacklogRanker` chegar ao handler sem carregar `@Injectable`, o módulo o
registra por factory. A regra continua sendo código simples, usável sem framework
em volta.

### A pontuação

A nota final é a soma ponderada de três componentes, cada um entre 0 e 1:

| Componente | O que mede | Peso |
| --- | --- | --- |
| `affinity` | quanto eu gosto do gênero, aprendido das notas que dei | 0,5 |
| `brevity` | quão curto o jogo é | 0,2 |
| `patience` | há quanto tempo espera na fila | 0,3 |

Três decisões dentro disso merecem registro.

**Cada componente é medido contra uma referência fixa, não contra os outros
jogos.** A alternativa óbvia seria normalizar por min-max dentro do backlog. Ela
tem um defeito grave: a nota de um jogo passaria a depender dos outros, e
cadastrar um jogo de 200 horas reordenaria silenciosamente a lista inteira.
Com curvas de saturação (`20 / (20 + horas)`, `dias / (dias + 30)`) a nota de um
jogo é dele e não muda quando o catálogo muda. Há um teste que fixa isso.

**A afinidade é puxada para a média geral quando há poucas notas.** Uma única
nota 10 em um gênero não é prova de que eu amo o gênero. A afinidade é calculada
como `(C * média_geral + soma_do_gênero) / (C + n)`, com `C = 3`. Com muitas
notas o gênero fala por si; com poucas, ele empresta da média. É o mesmo
princípio da média bayesiana que o IMDb usa no Top 250, e resolve de graça o
problema de gênero nunca avaliado, que recebe a média em vez de zero.

Isso tem uma consequência contraintuitiva: enquanto todas as minhas notas forem
iguais, a afinidade não distingue nada, porque a média geral é aquele valor e
todo gênero converge para ele. Está correto — não há informação em um histórico
uniforme — mas surpreende o bastante para virar teste com nome explícito.

**A resposta devolve as partes, não só o total.** O endpoint retorna `because`
com os três componentes. Um número sozinho não se discute; com a decomposição dá
para ver por que um jogo veio na frente, e para perceber quando o ranking
discorda do que eu realmente quero jogar.

### Custo

Para `h` jogos avaliados e `b` no backlog: uma passada para aprender o gosto,
uma para pontuar, e a ordenação. **O(h + b log b)** de tempo, **O(g)** de
memória para os gêneros distintos. O handler faz uma leitura só do repositório,
porque o backlog e o histórico se sobrepõem e duas consultas buscariam as mesmas
linhas duas vezes.

## Consequências

O `BacklogRanker` é testável sem subir nada. Os testes fixam um peso em 1 e o
resto em 0 para isolar cada componente, o que permite afirmar números exatos em
vez de "maior que o outro" — uma asserção relativa continuaria passando se a
fórmula mudasse.

Manter o ranker dentro da fatia significa que a funcionalidade inteira, do
controller ao algoritmo, cabe em uma pasta. Se um dia outra fatia precisar
pontuar jogos, ele sobe para `shared/` — mas só nesse dia, não por antecipação.

Os pesos e as constantes são valores que escolhi, não resultado de medição. É
uma heurística, não um modelo. Estão nomeados e em um só lugar, e trocá-los é
mudar um objeto — mas continuam sendo opinião minha sobre o que importa ao
escolher um jogo.

O ranking é a única operação da API que não é consulta ou escrita direta, e é a
razão de a classe existir separada. `ListGamesHandler` continua sendo uma linha,
e está certo assim: listar com filtro é consulta, não decisão.

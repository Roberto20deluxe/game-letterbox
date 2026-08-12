# 3. Traduzir erro de domínio para HTTP só na borda

Data: 2026-08-12

## Status

Aceito

## Contexto

A regra "nota vai de 0 a 10" é do domínio. O caminho fácil em NestJS é lançar
`BadRequestException` de dentro da entidade e deixar o framework responder. Isso resolve
em uma linha, mas coloca `@nestjs/common` dentro do núcleo — a entidade passa a saber o
que é status code, e a regra só funciona dentro de uma requisição HTTP.

Se amanhã eu plugar um CLI ou um consumidor de fila no mesmo handler, a exceção HTTP
não faz sentido nenhum.

## Decisão

O domínio lança erros próprios que herdam de `DomainError`: `InvalidRatingError` e
`GameNotFoundError`. Nenhum deles conhece HTTP.

Na borda, `DomainExceptionFilter` captura `DomainError` e mapeia para status:
`GameNotFoundError` vira 404, `InvalidRatingError` vira 422, e qualquer outro
`DomainError` cai em 400. O mapa fica no filtro, na borda, fora de qualquer fatia.

A divisão de responsabilidade é: **DTO valida forma, domínio valida regra.**

O `ValidationPipe` com os DTOs rejeita payload malformado (campo faltando, tipo errado,
string longa demais) com 400, antes de chegar no handler. A faixa da nota não está
no DTO — `RateGameDto` só exige que `rating` seja número. Quem decide que 0 a 10 é o
intervalo válido é a entidade.

Cheguei nisso corrigindo um erro meu. Na primeira versão eu tinha `@Min(0) @Max(10)` no
DTO *e* a checagem na entidade. Ao exercitar a API percebi que `{"rating": 42}` devolvia
400, nunca 422: o pipe barrava antes, e o `InvalidRatingError` era inalcançável por HTTP.
A regra estava duplicada e a duplicata escondia a regra de verdade. Tirei do DTO.

## Consequências

Ganhei:

- O domínio roda fora de HTTP. Os testes de entidade não importam nada do Nest.
- Distinção real entre 400 e 422: `{"rating": "abc"}` é 400 (forma), `{"rating": 42}`
  é 422 (regra). Os dois casos estão cobertos no teste e2e.
- Um lugar só define o intervalo da nota. Mudar de 0-10 para 0-5 é uma linha na entidade.
- Adicionar uma regra nova é criar o erro no domínio e uma linha no mapa do filtro.

Paguei:

- A mensagem de erro de faixa vem do domínio, não do `class-validator`. É menos
  padronizada que as outras mensagens de validação da API, e a inconsistência aparece
  para quem consome.
- O filtro usa o construtor do erro como chave do mapa. Funciona, mas é mais frágil
  que um campo de código explícito no erro. Se a lista crescer, troco por um `code`.

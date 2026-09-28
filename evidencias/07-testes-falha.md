# Testes de falha

- **Ambiente:** https://cloudflare-project2.pages.dev (implantação de produção, ramificação `main`)
- **Provedor usado nos testes:** Google
- **Data:** 28/09/2026
- Nenhum valor de `state`, `code`, cookie ou token foi registrado neste arquivo.

---

## Caso 1: retorno sem cookie temporário

- **Preparação:** iniciei o login com Google em uma janela comum e parei na página do provedor, sem fazer login. Copiei a URL de autorização para uma janela privativa, que não possuía o cookie `__Host-oauth-tx`.
- **Pedido enviado:** concluí o login com Google na janela privativa, o que fez o navegador chamar a rota de retorno `/oauth/callback/google` sem o cookie temporário.
- **Resultado esperado:** a rota de retorno recusa a resposta e não cria sessão.
- **Resultado observado:** o site exibiu "Falha na autenticacao." Ao consultar `/api/me` na janela privativa, a resposta foi 401 (`{"error":"unauthorized"}`). Nenhuma sessão foi criada.

## Caso 2: state alterado

- **Preparação:** iniciei outro login com Google e parei antes de fornecer as credenciais, com o cookie `__Host-oauth-tx` presente na janela.
- **Pedido enviado:** o retorno foi feito com o parâmetro `state` diferente do valor emitido na transação (um caractere alterado).
- **Resultado esperado:** a rota de retorno recusa a resposta antes de trocar o código com o provedor.
- **Resultado observado:** o site exibiu "Falha na autenticacao." e `/api/me` respondeu 401, sem criação de sessão.

## Caso 3: reutilização da transação

- **Preparação:** concluí um login com Google com sucesso e, no painel Network, copiei a URL da requisição de retorno (Copy URL).
- **Pedido enviado:** abri novamente essa mesma URL de retorno em uma nova aba.
- **Resultado esperado:** a transação já foi removida do D1, portanto a repetição falha.
- **Resultado observado:** o site exibiu "Falha na autenticacao." e nenhuma nova sessão foi criada.

## Caso 4: sessão expirada

- **Preparação:** com uma sessão de teste criada, executei no console do D1: `UPDATE sessions SET expires_at = 0;`
- **Pedido enviado:** recarreguei a página e consultei `/api/me`.
- **Resultado esperado:** `/api/me` responde 401.
- **Resultado observado:** a página exibiu "Nenhuma sessão neste navegador." e `/api/me` respondeu 401 (`{"error":"unauthorized"}`).

## Caso 5: origem inválida na saída

- **Preparação:** com uma sessão válida aberta na URL_BASE, abri outra origem (`https://example.com`) em uma aba separada.
- **Pedido enviado:** executei no console dessa aba `fetch("https://cloudflare-project2.pages.dev/oauth/logout", { method: "POST", credentials: "include" })`.
- **Resultado esperado:** a rota recusa a operação (403) e a sessão original permanece válida.
- **Resultado observado:** a requisição `logout` foi recusada com status 403 (o console também pode exibir mensagem de CORS). De volta à aba da URL_BASE, `/api/me` continuou respondendo 200 e a sessão original permaneceu válida.

## Caso 6: reutilização do cookie revogado

- **Preparação:** em sessão exclusiva do laboratório, copiei temporariamente o valor do cookie `__Host-session` pelas ferramentas de desenvolvimento. O valor não foi salvo e a cópia foi apagada em seguida.
- **Pedido enviado:** executei o logout, restaurei o mesmo valor do cookie e consultei `/api/me`.
- **Resultado esperado:** 401, pois a linha correspondente foi removida do D1.
- **Resultado observado:** `/api/me` respondeu 401 (`{"error":"unauthorized"}`); o cookie revogado não restaurou a sessão.

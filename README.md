# Cardápio Digital

Sistema de cardápio digital com duas áreas separadas:

- **Cliente (`index.html`)**: monta pedido e envia no WhatsApp.
- **Administrador (`admin.html`)**: faz login e gerencia produtos (nome, preço, imagem, ativo/inativo).

## Funcionalidades

- Catálogo com imagem por produto.
- Carrinho com remoção individual e limpeza total.
- Checkout com forma de pagamento.
- Endereço separado por campos (`CEP`, rua, número, bairro, cidade, estado) com busca automática pelo ViaCEP.
- Painel administrativo separado com login.
- Integração de leitura de produtos por API e fallback para cache local (`localStorage`).

## Integração de produtos (API)

O front tenta buscar produtos em:

`http://localhost:9000/api/produto/buscartodosintegracao`

Se a API responder, os produtos são exibidos no catálogo e também gravados localmente.
Se a API não responder (CORS, API fora, etc.), o sistema usa o cache local automaticamente.

Campos aceitos da API (mapeamento flexível):

- ID: `id`, `codigo`, `produtoId`
- Nome: `name`, `nome`
- Preço: `price`, `valor`, `preco`
- Imagem: `image`, `imagem`, `foto`
- Status: `active`, `ativo`

## Login do administrador

Por padrão:

- Usuário: `admin`
- Senha: `123456`

> Ajuste em `admin.js` nas constantes `ADMIN_USER` e `ADMIN_PASSWORD`.

## Como usar

1. Ajuste o número da loja em `app.js` na constante `WHATSAPP_NUMBER`.
2. Rode um servidor local na pasta do projeto.
3. Acesse:
   - Cliente: `http://localhost:8000/index.html`
   - Admin: `http://localhost:8000/admin.html`

## Servidor local (opcional)

```bash
python3 -m http.server 8000
```

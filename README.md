# Cardápio Digital

MVP de um sistema de cardápio digital onde o cliente final pode montar um pedido em casa e enviar para o WhatsApp da loja por meio de um link.

## Funcionalidades

- Lista de produtos com preços.
- Carrinho com cálculo automático de total.
- Formulário de nome e endereço de entrega.
- Botão para enviar o pedido pronto para o WhatsApp.

## Como usar

1. Altere o número da loja em `app.js` na constante `WHATSAPP_NUMBER`.
2. Abra `index.html` no navegador (ou sirva com um servidor local).
3. Compartilhe o link/página com os clientes.

## Servidor local (opcional)

Se quiser rodar localmente com Python:

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

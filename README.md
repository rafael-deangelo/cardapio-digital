# Sistema de Cadastro e Escala de Voluntários

Aplicação web estática para cadastro de voluntários e geração de escala mensal para igrejas e ministérios.

## Cenário inicial já configurado

- Igreja: **Primeira Igreja Batista de Curitiba**
- Campus: **PIB Curitiba - Campos Piraquara**
- Ministério: **Ministério de Produção de Culto**
- Funções padrão: **Manager** e **Apoio de palco**

> A configuração é editável para qualquer outro ministério.

## Funcionalidades

- Cadastro de ministério com funções customizáveis.
- Cadastro de voluntários com nome, telefone, e-mail e múltiplas funções.
- Tela mensal de disponibilidade para sábados (19h), domingos (9h e 19h).
- Geração de mensagem padrão para disparo aos voluntários.
- Geração automática de escala mensal por função.
- Campo de fallback para autoescala (quando faltar voluntário disponível).
- Persistência local via `localStorage`.

## Como usar

1. Abra `index.html` em um navegador.
2. Ajuste os dados do ministério na seção **Configuração do ministério**.
3. Cadastre os voluntários.
4. Escolha o mês e marque a disponibilidade.
5. Clique em **Gerar escala do mês automaticamente**.
6. Se faltar alguém em alguma data/função, informe seu nome no campo de fallback para autoescala.

## Servidor local (opcional)

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

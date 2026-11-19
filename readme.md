# Agenda

Aplicação web para cadastrar e acompanhar compromissos, com interface em React,
build com webpack e API em Node.js. Os dados são armazenados em um arquivo JSON
local.

## Funcionalidades

- Criar, editar e excluir compromissos com título, data, hora e descrição opcional.
- Visualizar compromissos agrupados por dia e ordenados por horário.
- Consultar e navegar pelo calendário mensal.

## Requisitos

- Node.js 20.19.0 ou superior.
- npm 10 ou superior.

## Instalação

Na pasta do projeto, instale as dependências usando o arquivo de versões
`package-lock.json`:

```bash
npm ci
```

## Executar em desenvolvimento

```bash
npm run dev
```

A API fica em `http://127.0.0.1:3001` e a interface em
`http://localhost:8080`, com atualização automática durante o desenvolvimento.
O webpack encaminha as chamadas de `/api` para a API local.

## Executar a versão de produção localmente

```bash
npm start
```

O comando gera os arquivos da interface em `dist/` e inicia a aplicação e a API
em `http://127.0.0.1:3001`. Para gerar apenas a interface, execute
`npm run build`.

## Dados e privacidade

Os compromissos são armazenados em texto no arquivo
`data/compromissos.json`. Se ele não existir, a agenda começa vazia e o arquivo
é criado automaticamente na primeira operação de gravação.

A pasta `data/` não é versionada pelo Git. Portanto, os compromissos não serão
publicados junto com o código nem recuperados ao clonar o repositório. Faça
backup dos seus dados separadamente. A API escuta apenas em `127.0.0.1` e não
possui autenticação.

## API

A API usa JSON e está disponível em `/api/compromissos`:

| Método | Rota | Ação |
| --- | --- | --- |
| GET | `/api/compromissos` | Lista os compromissos. |
| POST | `/api/compromissos` | Cria um compromisso. |
| PUT | `/api/compromissos/:id` | Atualiza um compromisso. |
| DELETE | `/api/compromissos/:id` | Exclui um compromisso. |

Para criar ou atualizar, envie um objeto com `titulo`, `data` no formato
`AAAA-MM-DD`, `hora` no formato `HH:MM` e `descricao` opcional:

```json
{
  "titulo": "Reunião",
  "data": "2030-03-15",
  "hora": "09:30",
  "descricao": "Planejamento"
}
```

## Testes

Os testes de ponta a ponta usam Playwright e Chromium. Após instalar as
dependências, instale o navegador e execute os testes:

```bash
npx playwright install chromium
npx playwright test
```

Se não houver um servidor em `http://127.0.0.1:3001`, o Playwright executa
`npm start` automaticamente. Fora de CI, ele reutiliza um servidor que já esteja
disponível nesse endereço.

**Atenção:** os testes usam os dados do servidor e apagam compromissos cujo
título começa com `E2E` antes e depois de cada teste, mesmo que esses
compromissos não tenham sido criados pelos testes. Faça backup e execute-os em
uma cópia isolada do projeto, sem dados pessoais.

Para abrir o relatório gerado após a execução:

```bash
npx playwright show-report
```

Os resultados e relatórios dos testes não são versionados.

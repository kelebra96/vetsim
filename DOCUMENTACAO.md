# VetSim — Documentação Completa do Sistema

> Sistema de gestão veterinária com simulação de rodadas de castração para uso acadêmico.

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Stack Tecnológica](#stack-tecnológica)
3. [Banco de Dados](#banco-de-dados)
4. [Requisitos Funcionais](#requisitos-funcionais)
5. [Requisitos Não Funcionais](#requisitos-não-funcionais)
6. [Regras de Negócio](#regras-de-negócio)
7. [Rotas e Endpoints](#rotas-e-endpoints)
8. [Views (Telas)](#views-telas)
9. [Funcionalidades por Perfil](#funcionalidades-por-perfil)
10. [Fluxos Principais](#fluxos-principais)
11. [Variáveis de Ambiente](#variáveis-de-ambiente)

---

## Visão Geral

O **VetSim** é uma plataforma web de suporte ao ensino veterinário que permite:

- Gerenciar turmas e alunos por semestre
- Registrar rodadas de castração animal (machos, fêmeas, abrigos)
- Executar simulações matemáticas de dinâmica populacional
- Gamificar o processo educativo com XP, níveis e streaks
- Exportar e auditar operações administrativas

Público-alvo: professores e alunos de cursos de veterinária.

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Runtime | Node.js (ES Modules) | — |
| Framework web | Express.js | 5.1.0 |
| Banco de dados | MongoDB (Atlas ou local) | — |
| ORM | Mongoose | 8.14.1 |
| Autenticação | JWT (jsonwebtoken) | 9.0.2 |
| Hash de senha | bcryptjs | — |
| Sessão | express-session + cookie-parser | 1.18.1 |
| Templating | EJS | 3.1.10 |
| CSS | Bootstrap | 5.3.6 |
| Gráficos | Chart.js | 4.4.9 |
| Upload de arquivos | Multer | 2.1.1 |
| Exportação | ExcelJS | 4.4.0 |
| Simulação | Python 3 (script externo) | — |
| Dev | Nodemon | 3.1.14 |

---

## Banco de Dados

Banco NoSQL: **MongoDB**. Conexão gerenciada via Mongoose com fallback Atlas → Local.

### User

Representa qualquer usuário do sistema (aluno, professor, administrador).

| Campo | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `name` | String | Sim | Nome completo |
| `code` | Number | Sim | Matrícula / código |
| `email` | String | Sim | Único, case-insensitive |
| `semester` | Number | Sim | 1 a 8 |
| `password` | String | Sim | bcrypt, não retornado por padrão |
| `status` | Boolean | — | Padrão: `true` (ativo) |
| `type` | Enum | — | `"admin"`, `"teacher"`, `"student"` |
| `avatarUrl` | String | — | Caminho para foto de perfil |
| `points` | Number | — | XP total (padrão: 0) |
| `level` | Number | — | Nível calculado (padrão: 1) |
| `xpBySemester` | [Number] | — | Array de 8 posições — XP por semestre |
| `streakCount` | Number | — | Sequência de acessos diários |
| `streakLast` | Date | — | Data do último tick de streak |
| `balance` | Number | — | Moeda "VIDA" (padrão: 50 000) |
| `createdAt` | Date | — | Automático |
| `updatedAt` | Date | — | Automático |

**Hook pre-save**: senha é hasheada com bcrypt (salt 10) antes de persistir.

---

### RoundUser

Registro de uma rodada de castração de um aluno específico.

| Campo | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `numberRound` | Number | Sim | 1 a 4 |
| `nameusr` | String | — | Nome do aluno (desnormalizado) |
| `codeUser` | String | — | Código do aluno |
| `semester` | Number | Sim | 1 a 8 |
| `quantMales` | Number | — | Machos castrados (≥ 0) |
| `quantFemales` | Number | — | Fêmeas castradas (≥ 0) |
| `shelter` | Number | — | Capacidade de abrigo (≥ 0) |
| `status` | Boolean | — | `true` = aberta, `false` = fechada |
| `createdAt` | Date | — | Automático |
| `updatedAt` | Date | — | Automático |

**Índice único**: `(codeUser, numberRound, semester)` — impede duplicação de rodada por aluno.

---

### Settings

Configurações globais do sistema (chave-valor único).

| Campo | Tipo | Notas |
|---|---|---|
| `key` | String | Identificador único da config (ex.: `"costs"`) |
| `shelterCost` | Number | Custo por unidade de abrigo |
| `maleNeuterCost` | Number | Custo por macho castrado |
| `femaleNeuterCost` | Number | Custo por fêmea castrada |
| `highVolumeThreshold` | Number | Limite para operações de alto volume (padrão: 200) |
| `updatedAt` | Date | Automático |

---

### GamificationEvent

Registro de cada evento de XP concedido a um usuário.

| Campo | Tipo | Notas |
|---|---|---|
| `user` | ObjectId | Ref: User |
| `amount` | Number | Pontos concedidos |
| `reason` | String | Ex.: `"create_round"`, `"update_round"`, `"close_round"` |
| `createdAt` | Date | Automático |

**Índices**: `user`, `createdAt`.

---

### BulkActionLog

Auditoria de operações em massa realizadas por admins/professores.

| Campo | Tipo | Notas |
|---|---|---|
| `user` | ObjectId | Ref: User (quem executou) |
| `action` | Enum | `"bulk_close"`, `"bulk_reopen"`, `"bulk_delete"` |
| `semester` | Number | Semestre alvo |
| `numberRound` | Number | Rodada alvo (opcional) |
| `statusFilter` | String | Filtro usado: `"active"`, `"closed"` ou vazio |
| `affectedCount` | Number | Quantidade de registros afetados |
| `createdAt` | Date | Automático |

---

## Requisitos Funcionais

### RF01 — Autenticação de Usuários
- O sistema deve permitir login com e-mail e senha.
- O sistema deve gerar um token JWT válido por 3 horas ao autenticar.
- O sistema deve redirecionar usuários não autenticados para a tela de login.
- O sistema deve permitir logout (remoção do token do cookie).

### RF02 — Gerenciamento de Usuários
- Admins e professores devem poder cadastrar novos usuários.
- Admins e professores devem poder listar, editar e ativar/desativar usuários.
- Admins e professores devem poder importar usuários em lote via CSV ou XLSX.
- Admins e professores devem poder redefinir a senha de qualquer usuário.
- Admins e professores devem poder ajustar o saldo de moeda "VIDA" de um aluno.
- Qualquer usuário autenticado deve poder editar seu próprio perfil e foto.

### RF03 — Gerenciamento de Rodadas
- Admins/professores devem poder criar rodadas para todos os alunos ativos de um semestre.
- O sistema deve permitir no máximo 4 rodadas distintas por semestre.
- Rodadas devem ser numeradas de 1 a 4.
- Alunos devem poder preencher os dados da sua rodada ativa (machos, fêmeas, abrigo).
- Admins/professores devem poder fechar rodadas individualmente ou em massa.
- Admins/professores devem poder reabrir ou excluir rodadas em massa.

### RF04 — Simulação Populacional
- Ao fechar uma rodada, o sistema deve executar o script Python com o histórico de castrações do aluno.
- O resultado da simulação deve ser exibido graficamente (Chart.js) na tela de resultados.
- O sistema deve mostrar o delta (variação) em relação à rodada anterior.
- Em caso de falha no script, o sistema deve exibir mensagem de erro sem travar.

### RF05 — Gamificação
- O sistema deve conceder XP ao usuário ao criar (20 XP), atualizar (15 XP) e fechar (30 XP) uma rodada.
- O sistema deve manter um registro de todos os eventos de XP.
- O sistema deve calcular o nível do usuário com base no XP.
- O sistema deve rastrear a sequência de acessos diários (streak).
- Alunos devem poder visualizar seu histórico de XP e streak.

### RF06 — Configurações do Sistema
- Admins/professores devem poder configurar os custos de operações (machos, fêmeas, abrigo).
- Admins/professores devem poder definir o limiar de alto volume de operações.

### RF07 — Exportação e Auditoria
- Admins/professores devem poder exportar todas as rodadas em CSV.
- O sistema deve registrar automaticamente todas as operações em massa em `BulkActionLog`.
- Admins/professores devem poder visualizar e exportar logs de ações em massa.

### RF08 — Dashboard
- O dashboard deve exibir estatísticas do usuário: XP, nível, saldo, streak.
- O dashboard deve exibir a linha do tempo de rodadas do semestre atual.
- O dashboard deve calcular e mostrar o custo total com base nas configurações vigentes.

### RF09 — Saúde do Sistema
- O sistema deve expor um endpoint `/health` com status da conexão ao banco e contagem de usuários.

---

## Requisitos Não Funcionais

### RNF01 — Segurança
- Senhas devem ser armazenadas com hash bcrypt (salt 10).
- Tokens JWT devem ser transmitidos via cookies `httpOnly`.
- Tokens devem expirar em 3 horas.
- Rotas protegidas devem retornar 401/403 para acessos não autorizados.
- E-mails devem ser armazenados e comparados sem diferenciação de maiúsculas/minúsculas.
- Nomes de arquivo de avatar devem ser sanitizados para evitar path traversal.

### RNF02 — Desempenho
- Consultas de leitura devem usar `.lean()` onde possível para reduzir uso de memória.
- Exportações de grande volume devem usar cursores MongoDB (streaming) para evitar picos de memória.
- Importações em massa devem realizar lookup único antes do loop, evitando N+1 queries.
- Consultas independentes devem ser executadas em paralelo com `Promise.all`.

### RNF03 — Escalabilidade
- O banco de dados deve suportar conexão com MongoDB Atlas (cloud) com fallback para instância local.
- O sistema deve funcionar como aplicação Node.js padrão, compatível com containerização.

### RNF04 — Manutenibilidade
- O código deve seguir arquitetura MVC (Model → Controller → Service → Route → View).
- Lógica de negócio deve residir nos services, não nos controllers.
- Variáveis sensíveis devem ser gerenciadas exclusivamente via `.env`.

### RNF05 — Usabilidade
- A interface deve ser responsiva (Bootstrap 5).
- Feedbacks de sucesso/erro devem ser exibidos como flash messages.
- Formulários devem validar dados antes do envio.

### RNF06 — Compatibilidade
- O sistema deve tentar múltiplos binários Python (`PYTHON_BIN` → `python3` → `python`) para compatibilidade de ambiente.
- A importação CSV deve normalizar cabeçalhos com acentos e variações regionais.

### RNF07 — Auditabilidade
- Toda operação em massa deve ser registrada com usuário responsável, ação, alvo e contagem de afetados.
- Logs devem ser filtráveis e exportáveis.

### RNF08 — Disponibilidade
- O sistema deve expor `/health` para monitoramento externo.

---

## Regras de Negócio

| Código | Regra |
|---|---|
| RN01 | Um aluno pode ter apenas **1 rodada por número de rodada por semestre** (índice único no banco). |
| RN02 | Um semestre pode ter no máximo **4 rodadas distintas** (números 1 a 4). |
| RN03 | Rodadas fechadas (`status = false`) são imutáveis — apenas reabrir as torna editáveis. |
| RN04 | Somente alunos preenchem dados de rodada (`/rounds`); admins/professores são redirecionados. |
| RN05 | O **saldo ("VIDA")** não pode ser negativo — ao remover, é limitado a 0. |
| RN06 | O **streak** incrementa apenas uma vez por dia calendário (comparado via `.toDateString()`). |
| RN07 | O **nível de alunos** é limitado ao seu semestre atual (`min(8, semester)`). |
| RN08 | O **nível de admins/professores** escala com XP global: `floor(points / 100) + 1`. |
| RN09 | O XP de alunos é rastreado **por semestre** (array `xpBySemester[8]`). |
| RN10 | A criação de rodadas gera automaticamente **uma entrada por aluno ativo** do semestre alvo. |
| RN11 | A simulação Python recebe o **histórico completo de castrações** do aluno (todas as rodadas). |
| RN12 | Usuários desativados (`status = false`) não recebem rodadas na criação. |
| RN13 | O custo total é calculado com base nos valores de `Settings` (key: `"costs"`) vigentes no momento. |
| RN14 | XP concedido por ação: criar rodada = **20 XP**, atualizar = **15 XP**, fechar = **30 XP**. |
| RN15 | Ao importar usuários, e-mails já existentes são **ignorados** (não sobrescritos). |

---

## Rotas e Endpoints

### Usuários (`/`)

| Método | Caminho | Autenticação | Descrição |
|---|---|---|---|
| GET | `/` | Pública | Tela de login |
| POST | `/login` | Pública | Autentica e gera token JWT |
| GET | `/register` | Admin/Prof | Formulário de cadastro |
| POST | `/createuser` | Admin/Prof | Cria novo usuário |
| GET | `/userimport` | Admin/Prof | Formulário de importação |
| POST | `/importcsv` | Admin/Prof | Importa usuários via CSV |
| POST | `/importstudents` | Admin/Prof | Importa usuários via XLSX/CSV |
| GET | `/userall` | Admin/Prof | Lista todos os usuários (JSON) |
| GET | `/userid/:id` | Autenticado | Busca usuário por ID (JSON) |
| PATCH | `/userupdate/:id` | Admin/Prof | Atualiza campos de usuário |
| GET | `/profile` | Autenticado | Exibe perfil do usuário logado |
| POST | `/profile` | Autenticado | Atualiza nome e avatar |
| GET | `/users` | Admin/Prof | Lista todos os usuários (view) |
| GET | `/users/edit/:id` | Admin/Prof | Formulário de edição de usuário |
| POST | `/users/edit/:id` | Admin/Prof | Salva edição de usuário |
| POST | `/users/:id/toggle` | Admin/Prof | Ativa/desativa usuário |
| POST | `/users/:id/balance` | Admin/Prof | Adiciona/remove saldo VIDA |
| POST | `/users/:id/resetpass` | Admin/Prof | Redefine senha do usuário |
| POST | `/users/bulk` | Admin/Prof | Ativa/desativa usuários em massa |
| GET | `/logout` | Autenticado | Invalida sessão e token |

---

### Rodadas (`/`)

| Método | Caminho | Autenticação | Descrição |
|---|---|---|---|
| GET | `/roundcreate` | Admin/Prof | Formulário de criação de rodadas |
| POST | `/createround` | Admin/Prof | Cria rodadas para o semestre |
| GET | `/roundclose` | Admin/Prof | Formulário para fechar rodada |
| POST | `/roundclose` | Admin/Prof | Fecha rodada e executa simulação |
| GET | `/roundsexisting` | Admin/Prof | Lista rodadas existentes (JSON) |
| GET | `/roundslist` | Admin/Prof | Agrega informações de rodadas (JSON) |
| GET | `/semesterusers` | Admin/Prof | Conta alunos ativos do semestre |
| GET | `/roundall` | Admin/Prof | Lista todas as rodadas (JSON) |
| GET | `/rounds` | Aluno | Tela de preenchimento de rodada |
| GET | `/roundid/:id` | Autenticado | Busca rodada por ID (JSON) |
| POST | `/roundupdate/:id` | Autenticado | Atualiza dados de uma rodada |
| GET | `/roundsadmin` | Admin/Prof | Painel admin de rodadas |
| GET | `/roundsadmin/export` | Admin/Prof | Exporta rodadas para CSV |
| POST | `/roundsadmin/close` | Admin/Prof | Fecha rodadas em massa |
| POST | `/roundsadmin/reopen` | Admin/Prof | Reabre rodadas em massa |
| POST | `/roundsadmin/delete` | Admin/Prof | Exclui rodadas em massa |
| GET | `/roundsadmin/count` | Admin/Prof | Conta rodadas filtradas |

---

### Home e Sobre

| Método | Caminho | Autenticação | Descrição |
|---|---|---|---|
| GET | `/home` | Autenticado | Dashboard principal |
| GET | `/sobre` | Autenticado | Página "Sobre o sistema" |

---

### Gamificação (`/me`)

| Método | Caminho | Autenticação | Descrição |
|---|---|---|---|
| GET | `/me/xp` | Aluno | Dashboard de XP e histórico |
| GET | `/me/streak` | Autenticado | Retorna streak atual (JSON) |
| POST | `/me/streak/tick` | Aluno | Incrementa streak do dia |

---

### Configurações (`/settings`)

| Método | Caminho | Autenticação | Descrição |
|---|---|---|---|
| GET | `/settings/costs` | Admin/Prof | Exibe configurações de custo |
| POST | `/settings/costs` | Admin/Prof | Salva configurações de custo |

---

### Logs (`/logs`)

| Método | Caminho | Autenticação | Descrição |
|---|---|---|---|
| GET | `/logs` | Admin/Prof | Lista logs de ações em massa |
| GET | `/logs/export` | Admin/Prof | Exporta logs para CSV |

---

### Sistema

| Método | Caminho | Autenticação | Descrição |
|---|---|---|---|
| GET | `/health` | Pública | Status do banco e contagem de usuários |

---

## Views (Telas)

### Autenticação
| Arquivo | Rota | Descrição |
|---|---|---|
| `views/authenticate/login.ejs` | `GET /` | Formulário de login |
| `views/authenticate/register.ejs` | `GET /register` | Formulário de cadastro de usuário |

### Home
| Arquivo | Rota | Descrição |
|---|---|---|
| `views/home/index.ejs` | `GET /home` | Dashboard com estatísticas, linha do tempo de rodadas e cálculo de custos |

### Rodadas
| Arquivo | Rota | Descrição |
|---|---|---|
| `views/round/create.ejs` | `GET /roundcreate` | Formulário para criar rodadas por semestre |
| `views/round/management.ejs` | `GET /rounds` | Preenchimento de dados da rodada (aluno) |
| `views/round/close.ejs` | `GET /roundclose` | Formulário para fechar rodada e disparar simulação |
| `views/round/admin.ejs` | `GET /roundsadmin` | Painel de gerenciamento com filtros e ações em massa |
| `views/round/graph.ejs` | Resultado de fechamento | Gráficos de simulação populacional com Chart.js |

### Usuários
| Arquivo | Rota | Descrição |
|---|---|---|
| `views/user/list.ejs` | `GET /users` | Listagem de usuários com filtros |
| `views/user/edit.ejs` | `GET /users/edit/:id` | Edição completa de usuário (admin) |
| `views/user/profile.ejs` | `GET /profile` | Perfil do usuário logado com upload de avatar |
| `views/user/import.ejs` | `GET /userimport` | Upload e importação de CSV/XLSX |

### Configurações
| Arquivo | Rota | Descrição |
|---|---|---|
| `views/settings/costs.ejs` | `GET /settings/costs` | Formulário de configuração de custos |

### Gamificação
| Arquivo | Rota | Descrição |
|---|---|---|
| `views/gamification/me_xp.ejs` | `GET /me/xp` | Histórico de XP e streak do aluno |

### Logs
| Arquivo | Rota | Descrição |
|---|---|---|
| `views/logs/index.ejs` | `GET /logs` | Lista de logs de ações em massa com filtros |

### Parciais e Outros
| Arquivo | Descrição |
|---|---|
| `views/partials/navbar.ejs` | Barra de navegação lateral (incluída em todas as telas) |
| `views/sobre.ejs` | Página informativa sobre o sistema |
| `views/unauthorized.ejs` | Tela de erro 403 (acesso negado) |

---

## Funcionalidades por Perfil

### Administrador (`admin`)
- Todas as funcionalidades de professor
- Gerenciar outros admins e professores
- Acesso irrestrito a todos os dados

### Professor (`teacher`)
- Cadastrar, editar, ativar/desativar alunos
- Importar alunos em lote (CSV/XLSX)
- Criar, fechar, reabrir e excluir rodadas
- Visualizar e gerenciar rodadas de todos os alunos
- Ajustar saldo e senha de alunos
- Configurar custos do sistema
- Visualizar e exportar logs de auditoria
- Exportar dados de rodadas em CSV

### Aluno (`student`)
- Preencher dados da rodada ativa
- Visualizar dashboard pessoal (XP, nível, saldo, streak)
- Visualizar histórico de XP e eventos de gamificação
- Editar perfil e foto de avatar
- Registrar streak diário

---

## Fluxos Principais

### Fluxo de Autenticação
```
1. Usuário acessa "/"
2. Submete e-mail e senha
3. Controller valida credenciais (bcrypt compare)
4. JWT gerado e armazenado em cookie httpOnly (3h)
5. Middleware global popula res.locals.user em cada requisição
6. Usuário redirecionado para /home
```

### Fluxo de Rodadas (Visão Geral)
```
1. Prof/Admin cria rodadas para semestre X (POST /createround)
   → Uma RoundUser criada por aluno ativo do semestre
   → XP concedido ao criador (20 XP)

2. Aluno preenche dados (POST /roundupdate/:id)
   → Salva quantMales, quantFemales, shelter
   → XP concedido ao aluno (15 XP)

3. Prof/Admin fecha a rodada (POST /roundclose)
   → status = false em todas as rodadas do semestre/número
   → Script Python executado com histórico acumulado do aluno
   → Gráfico de simulação exibido (view: round/graph.ejs)
   → XP concedido ao fechador (30 XP)
```

### Fluxo de Importação de Alunos
```
1. Admin/Prof acessa /userimport
2. Faz upload de arquivo CSV ou XLSX
3. Sistema normaliza cabeçalhos (remove acentos, lowercase)
4. Busca prévia de e-mails já existentes (batch lookup)
5. Cria apenas usuários com e-mails novos
6. Retorna relatório: criados, ignorados, erros
```

### Fluxo de Simulação Python
```
1. Sistema coleta histórico de rodadas do aluno (todas as fechadas)
2. Monta JSON: {"YYYY-MM-DD": {"f": N, "m": N}}
3. Executa: python script.py --quant 4 --dataini 2024-07-01 --dados '{...}'
4. Script retorna JSON com projeções populacionais
5. View graph.ejs renderiza gráficos com Chart.js
```

---

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `PORT` | Não | Porta do servidor (padrão: 3000) |
| `MONGODB_ATLAS_URI` | Não | URI do MongoDB Atlas (se vazio, usa local) |
| `MONGODB_LOCAL_URI` | Sim | URI do MongoDB local |
| `JWT_SECRET` | Sim | Chave secreta para assinar tokens JWT |
| `SESSION_SECRET` | Sim | Chave secreta para sessões Express |
| `NODE_ENV` | Não | `development` ou `production` |
| `PYTHON_BIN` | Não | Caminho para o executável Python |
| `SEED_TEST_NAME` | Não | Nome do usuário de seed |
| `SEED_TEST_EMAIL` | Não | E-mail do usuário de seed |
| `SEED_TEST_PASSWORD` | Não | Senha do usuário de seed |
| `SEED_TEST_CODE` | Não | Código do usuário de seed |
| `SEED_TEST_SEMESTER` | Não | Semestre do usuário de seed |
| `SEED_TEST_ROLE` | Não | Perfil do usuário de seed |

---

*Documentação gerada em 2026-05-23.*

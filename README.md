# VetSim

VetSim é um sistema de gestão veterinária desenvolvido em Node.js com Express e MongoDB. O projeto permite cadastrar usuários, controlar "rounds" de castração e gerar gráficos de simulação populacional utilizando um script Python.

## Requisitos

- Node.js 16+
- MongoDB (Atlas ou local)
- Python 3 (para a simulação)

## Instalação

1. Clone o repositório e acesse a pasta do projeto.
2. Instale as dependências do Node:
   ```bash
   npm install
   ```
3. Copie o arquivo `.env` e ajuste as variáveis `PORT`, `MONGODB_ATLAS_URI`, `MONGODB_LOCAL_URI` e `JWT_SECRET` conforme sua configuração.

## Execução

Inicie o servidor com:
```bash
npm start
```
O servidor será executado na porta definida em `PORT` (padrão 3000).

## Funcionalidades

### Autenticação de Usuários
- Cadastro de novos usuários (nome, código, e‑mail, semestre e senha).
- Login com geração de token JWT armazenado em cookie.
- Importação em massa de usuários via CSV (`/userimport`).
- Diferentes papéis: `admin`, `teacher` ou `student`.

### Rounds
- **Criação de Rounds** (`/roundcreate`): cria automaticamente um round para cada aluno ativo de um semestre.
- **Gerenciamento** (`/rounds`): alunos preenchem informações de machos, fêmeas e abrigo do round aberto.
- **Fechamento** (`/roundclose`): administradores e professores encerram um round e geram gráficos de simulação populacional.
- **Gráficos**: após fechar o round, é executado `script.py`, que simula a evolução populacional e apresenta gráficos individuais para cada aluno.

### Estrutura do Projeto

```
public/       Arquivos estáticos (CSS, imagens)
src/
  controllers/ Lógica das rotas
  data/        Conexão com MongoDB
  models/      Schemas Mongoose (User e Round)
  routes/      Definição das rotas Express
  services/    Regras de negócio
views/        Templates EJS
script.py     Simulação em Python
index.js      Ponto de entrada do servidor
```

## Como Usar

1. Acesse `http://localhost:3000` e faça login (usuário previamente cadastrado ou importado).
2. Usuários com papel `admin` ou `teacher` podem acessar:
   - `/register` para criar novos usuários.
   - `/userimport` para importar planilhas CSV.
   - `/roundcreate` para liberar rounds.
   - `/roundclose` para fechar rounds e gerar gráficos.
3. Alunos acessam `/rounds` para preencher os dados de seu round ativo.

## Licença

Este projeto está licenciado sob os termos do arquivo `LICENSE` (caso existente).

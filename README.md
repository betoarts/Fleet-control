# Fleet Control 🚗📊

**Fleet Control** é uma solução abrangente de gerenciamento de frota desenvolvida para a **Controle de Frota**. Combina uma aplicação web moderna em React com um banco de dados PostgreSQL robusto para gerenciamento de viagens e veículos.

> **Principais Funcionalidades**: Análise com IA, Rastreamento em Tempo Real e Dashboard Administrativo.

---

## 💻 Web App

Esta aplicação foi construída como um **Web App Responsivo** otimizado para Desktop e Mobile (via Navegador).

### Funcionalidades Web

- **Design Responsivo**: Funciona em navegadores Desktop, Tablet e Mobile.
- **Capacidade Offline**: Service workers armazenam recursos em cache para uso offline (PWA).
- **Instalável**: Pode ser instalado na tela inicial através do navegador.
- **Geolocalização**: Rastreia coordenadas da rota em tempo real durante as viagens.

---

## 🛠️ Módulos Funcionais

### 1. App do Usuário (Motorista)

- **Registro de Viagem**: Fluxo fácil de "Iniciar/Parar" com validação de hodômetro (KM).
- **Itinerário Inteligente**: A IA analisa a descrição do destino para categorizar a viagem.
- **Histórico**: Registro pessoal de todas as viagens passadas com indicadores de status.
- **Gerenciamento de Tarefas**: "Lista de Tarefas" integrada para motoristas com níveis de prioridade e status tipo Kanban.
- **Seleção de Veículo**: Visualização ao vivo de veículos disponíveis (não bloqueados).

### 2. Dashboard Administrativo (Desktop)

Acessado via atalho secreto (`Ctrl + Shift + A`) ou Login de Admin.

- **Visão Geral de KPIs**: Total de KM, Total de Viagens, Usuários Ativos e contagem de Viagens em Andamento.
- **Mapa em Tempo Real**: Mapa em tela cheia mostrando a última localização conhecida dos veículos ativos.
- **Feed de Atividade ao Vivo**: Fluxo em tempo real de viagens iniciando, terminando e logins de usuários.
- **Ranking de Motoristas**: Tabela de classificação gamificada baseada em KM rodados.
- **Gerenciamento de Veículos**: Registrar, editar, bloquear/desbloquear veículos (ex: para manutenção).
- **Atribuição de Tarefas**: Criar e atribuir tarefas a motoristas específicos.
- **Relatórios**: Tabela de dados filtrável com capacidade de **Exportação CSV**.
- **Configurações do Sistema**: Configurar marca da empresa, URLs de Webhook e preferências gerais.

### 3. Inteligência Artificial (Google Gemini)

- **Resumos Semanais**: Gera relatórios em linguagem natural sobre a eficiência da frota.
- **Análise de Itinerário**: Etiqueta automaticamente padrões de uso corporativo vs. pessoal.

---

## 🚀 Tecnologias Utilizadas

- **Framework**: React 19 + TypeScript + Vite
- **Estilização**: Tailwind CSS v4 (Design System Personalizado)
- **Backend / Banco de Dados**: PostgreSQL Local (via Docker + PostgREST + Nginx Gateway)
- **Motor de IA**: Google Gemini Flash 1.5 (`@google/genai`)
- **Mapas**: Leaflet / React-Leaflet
- **Gráficos**: Recharts
- **Ícones**: FontAwesome 6

---

## 📂 Estrutura do Projeto

```bash
FleetControl/
├── src/
│   ├── components/      # Componentes de UI (AdminDashboard, Mapas, Forms)
│   ├── services/        # Lógica de Negócios (Gemini, Rastreamento, Admin)
│   ├── lib/             # Camada de Conexão com o Banco/API
│   └── App.tsx          # Entrada Principal & Lógica de Roteamento
├── database/            # Scripts de inicialização do banco local (SQL)
└── docker-compose.yml   # Orquestração do banco, API e Gateway local
```

---

## ⚙️ Instalação e Configuração

### Pré-requisitos

- Node.js (v18+)
- Local: **Docker Desktop** (para rodar o banco local)
- Chave de API Google Gemini

### 1. Iniciar Infraestrutura Local (Docker)

Para rodar o banco de dados e a API localmente:

```bash
# Inicia PostgreSQL, PostgREST e Gateway Nginx
docker compose up -d
```

### 2. Variáveis de Ambiente

Crie um arquivo `.env` no diretório raiz:

```env
# URL da API gerada pelo PostgREST
VITE_API_URL=http://localhost:3000
VITE_API_KEY=sua_chave_de_acesso_local

# Inteligência Artificial
VITE_GEMINI_API_KEY=sua_chave_gemini
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Rodar para Web (Desenvolvimento + Rede)

```bash
npm run dev -- --host
```

O aplicativo estará disponível em:

- Local: **http://seu_ip:3001**
- Rede: **http://10.100.110.141:3001** (Para acesso via celular/tablet)

### 🔑 Acesso Padrão

- **Usuário**: Administrador
- **Telefone**: 999999999
- **Atalho Admin**: `Ctrl + Shift + A`

---

## 🌎 Deploy (Vercel + Supabase Cloud)

Para colocar a aplicação online, o Frontend (Vite) deve subir no **Vercel** e o Banco de Dados no **Supabase**.

### 1. Configurar o Banco (Supabase)

O Docker é apenas para desenvolvimento local. Para a nuvem:

1.  Crie um projeto em [Supabase.com](https://supabase.com).
2.  Vá em **SQL Editor** -> **New Query**.
3.  Cole o conteúdo do arquivo local `database/init.sql` e clique em **Run**.
4.  _(Opcional)_ Em **Table Editor**, você pode desativar o **RLS** (Row Level Security) nas tabelas para facilitar a migração inicial.

### 2. Configurar o Frontend (Vercel)

Ao conectar o repositório na Vercel, você deve configurar as **Environment Variables**.

> **IMPORTANTE**: O Vite exige que todas as variáveis comecem com o prefixo `VITE_`.

| Nome da Variável          | Origem no Supabase (Settings -> API) |
| :------------------------ | :----------------------------------- |
| **`VITE_API_URL`**        | `Project URL`                        |
| **`VITE_API_KEY`**        | `anon` / `public` Key                |
| **`VITE_GEMINI_API_KEY`** | Sua chave do Google Gemini Flash     |

### 3. Sincronização

Após configurar, se o app já estiver rodando na Vercel, vá em **Deployments** e faça um **Redeploy** para que as novas variáveis sejam aplicadas ao build.

---

## 🧾 Licença

Software Privado - Fleet Control® - Todos os Direitos Reservados.
Desenvolvido por Humberto Neto - 2026.

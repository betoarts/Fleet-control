# Fleet Control

> Plataforma PWA para gestão de veículos, viagens, motoristas, tarefas, quilometragem e indicadores operacionais.

![Fleet Control — Gestão, Rastreamento e Inteligência](https://github.com/betoarts/fleet-control/raw/main/docs/fleet-control-cover.jpg)

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=20232a)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

O **Fleet Control** centraliza o controle de uma frota em uma interface moderna, responsiva e instalável. Motoristas registram viagens e tarefas, enquanto gestores acompanham veículos, rotas, quilometragem, manutenção e resultados em um dashboard operacional.

> **Status:** em desenvolvimento ativo. Revise permissões, políticas do Supabase e chaves de ambiente antes de disponibilizar o sistema em produção.

## Principais recursos

- **Registro de viagens:** início e encerramento com validação de hodômetro e quilometragem.
- **Rastreamento geográfico:** captura de coordenadas e visualização de rotas no mapa.
- **Gestão de veículos:** cadastro, disponibilidade, bloqueio e status de manutenção.
- **Dashboard administrativo:** KPIs, viagens ativas, usuários, quilometragem e atividade recente.
- **Mapa em tempo real:** última localização conhecida dos veículos em operação.
- **Gestão de motoristas:** histórico, atividade e ranking por quilometragem.
- **Tarefas operacionais:** criação, prioridade, atribuição e acompanhamento em fluxo Kanban.
- **Relatórios:** filtros operacionais e exportação para CSV.
- **Inteligência artificial:** análise de itinerários e resumos periódicos com Google Gemini.
- **PWA responsivo:** uso em desktop, tablet e celular, com possibilidade de instalação.
- **Modo offline:** cache de recursos por Service Worker para melhorar a continuidade de uso.
- **Personalização:** marca, preferências gerais e configurações da operação.

## Arquitetura

    fleet-control/
    ├── App.tsx                  # Aplicação e roteamento da interface
    ├── index.tsx                # Entrada do React
    ├── components/              # Dashboard, mapas, formulários e UI
    ├── services/                # IA, rastreamento e regras administrativas
    ├── lib/                     # Cliente e integrações com dados
    ├── database/                # SQL de inicialização e estrutura do banco
    ├── public/                  # Ícones e assets públicos da PWA
    ├── tests/                   # Testes e cenários automatizados
    ├── Dockerfile               # Imagem da aplicação
    ├── docker-compose.yml       # PostgreSQL, PostgREST e Nginx
    ├── nginx.conf               # Gateway local
    ├── vite.config.ts           # Vite e configuração PWA
    └── application-docs/        # Documentação funcional

## Stack tecnológica

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 19 + TypeScript |
| Build | Vite 6 |
| Estilos | Tailwind CSS |
| Banco de dados | PostgreSQL 17 |
| API local | PostgREST 12 + Nginx |
| Nuvem | Supabase |
| Mapas | Leaflet + React-Leaflet |
| Gráficos | Recharts |
| IA | Google Gemini via @google/genai |
| PWA | vite-plugin-pwa |
| Testes | Playwright |
| Deploy | Vercel ou Netlify |

## Pré-requisitos

- Node.js 18 ou superior;
- npm;
- Docker Desktop para o ambiente local;
- uma chave da API Google Gemini, quando os recursos de IA forem utilizados;
- um projeto Supabase para implantação em nuvem.

## Execução local com Docker

1. Suba PostgreSQL, PostgREST e o gateway Nginx:

       docker compose up -d

2. Instale as dependências:

       npm install

3. Crie o arquivo `.env.local`:

       VITE_SUPABASE_URL=http://localhost:3000
       VITE_SUPABASE_ANON_KEY=sua_chave_anon_local
       VITE_GEMINI_API_KEY=sua_chave_gemini

4. Inicie o frontend:

       npm run dev -- --host

5. Acesse:

       http://localhost:3000

O script SQL em `database/init.sql` inicializa as tabelas e estruturas previstas para o ambiente local.

## Execução sem Docker

Para apontar o frontend diretamente para o Supabase, configure:

       VITE_SUPABASE_URL=https://seu-projeto.supabase.co
       VITE_SUPABASE_ANON_KEY=sua_chave_anon
       VITE_GEMINI_API_KEY=sua_chave_gemini

Depois execute:

       npm install
       npm run dev

## Variáveis de ambiente

| Variável | Obrigatória | Finalidade |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sim | Chave pública anon do Supabase |
| `VITE_GEMINI_API_KEY` | Para IA | Chave da API Google Gemini |
| `SUPABASE_URL` | Alternativa | URL reconhecida pela configuração de build |
| `SUPABASE_ANON_KEY` | Alternativa | Chave reconhecida pela configuração de build |

Nunca versione arquivos de ambiente ou chaves privadas. A chave anon do Supabase deve estar protegida pelas políticas RLS adequadas.

## Banco de dados e Supabase

### Ambiente local

O Docker Compose disponibiliza:

| Serviço | Porta | Função |
| --- | ---: | --- |
| PostgreSQL 17 | 5432 | Persistência dos dados |
| PostgREST | interna 3000 | API REST sobre o PostgreSQL |
| Nginx | 3000 | Gateway para o frontend e API |

As credenciais definidas no Compose são destinadas somente ao desenvolvimento. Troque todas as senhas e o segredo JWT antes de usar uma infraestrutura compartilhada.

### Implantação no Supabase

1. Crie um projeto no [Supabase](https://supabase.com/).
2. Execute o conteúdo de `database/init.sql` no SQL Editor.
3. Configure RLS e as permissões de acesso necessárias.
4. Copie a URL e a chave anon em `.env.local` ou nas variáveis do provedor de deploy.
5. Faça um novo build após alterar as variáveis.

## Funcionalidades administrativas

O painel administrativo reúne:

- visão geral de veículos, viagens, usuários e quilometragem;
- mapa com posições recentes;
- feed de atividade;
- ranking de motoristas;
- cadastro e bloqueio de veículos;
- criação e atribuição de tarefas;
- relatórios filtráveis e exportação CSV;
- configurações de marca e operação.

Os recursos administrativos devem ser protegidos por autenticação e autorização no banco. Um atalho visual ou controle no frontend não substitui políticas de segurança no Supabase.

## Inteligência artificial

A integração com Google Gemini apoia:

- classificação e análise de itinerários;
- identificação de viagens corporativas ou pessoais;
- geração de resumos semanais sobre eficiência da frota.

As respostas da IA devem ser tratadas como apoio operacional. Valide informações antes de utilizá-las para decisões administrativas, financeiras ou disciplinares.

## PWA e uso mobile

A aplicação foi configurada para:

- funcionar em telas desktop, tablet e celular;
- ser instalada pela opção do navegador;
- atualizar o Service Worker automaticamente;
- manter recursos estáticos disponíveis após o primeiro carregamento;
- solicitar permissões de câmera quando necessárias ao fluxo da aplicação.

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm install` | Instala dependências |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run dev -- --host` | Permite acesso pela rede local |
| `npm run build` | Gera o build de produção |
| `npm run preview` | Visualiza o build localmente |
| `npm run lint` | Executa a verificação TypeScript |
| `npm run type-check` | Valida os tipos TypeScript |
| `docker compose up -d` | Inicia a infraestrutura local |
| `docker compose down` | Para a infraestrutura local |

## Deploy na Vercel

1. Importe o repositório na [Vercel](https://vercel.com/).
2. Configure as variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e, se necessário, `VITE_GEMINI_API_KEY`.
3. Confirme que o comando de build é `npm run build`.
4. Faça o deploy.
5. Após alterar variáveis, execute um novo redeploy.

O projeto também contém configurações compatíveis com Netlify. Não inclua chaves secretas no código do frontend.

## Segurança

- Ative e revise RLS em todas as tabelas do Supabase.
- Nunca exponha a service role key no frontend.
- Troque as credenciais padrão do Docker e o segredo JWT.
- Restrinja o acesso ao PostgreSQL e ao PostgREST em ambientes compartilhados.
- Valide permissões no banco, não apenas na interface.
- Limite o uso da API de IA e monitore custos.
- Remova dados pessoais desnecessários dos prompts enviados à IA.
- Faça backups e teste restaurações periodicamente.
- Proteja dados de localização e histórico de motoristas conforme a legislação aplicável.

## Contribuição

1. Crie uma branch para a alteração.
2. Mantenha componentes, serviços e tipos organizados.
3. Execute `npm run lint`, `npm run build` e os testes relevantes.
4. Atualize a documentação ao alterar fluxos ou integrações.
5. Abra um pull request com descrição, contexto e validações realizadas.

## Licença

Este projeto está distribuído sob a licença [MIT](LICENSE).

## Autor

Desenvolvido por [betoarts](https://github.com/betoarts).

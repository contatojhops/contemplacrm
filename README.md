# Contempla CRM

Build a complete Sales CRM for a consórcio sales consultant in Brazil called 
"Consórcio CRM". The application must be entirely in Brazilian Portuguese.

---

## TECH STACK
- React + TypeScript
- Tailwind CSS
- Shadcn/ui components
- Lucide React icons
- Recharts for all charts
- @dnd-kit/core and @dnd-kit/sortable for drag-and-drop
- All data must be persisted using localStorage so nothing 
  is lost on page refresh
- Create a custom useLocalStorage hook to manage all state persistence
- No backend needed

---

## DATA PERSISTENCE RULE
Every entity (leads, clients, tasks, proposals, campaigns, settings) 
must be saved to localStorage immediately on create/edit/delete.
On app load, always read from localStorage first. If localStorage is 
empty, load the mock data defined in Part 3 of this project.

---

## NAVIGATION — Dark Sidebar
Fixed left sidebar with icons + labels. Collapsible on smaller screens.
Highlight the active page. Pages:

1. 📊 Dashboard (default home page)
2. 🎯 Leads & Pipeline
3. 👥 Clientes
4. 📅 Agenda & Tarefas
5. 📄 Propostas & Simulações
6. 💼 Carteira Ativa
7. 📣 Campanhas
8. ⚙️ Configurações

Sidebar bottom: user profile avatar + name + role ("Consultor de Consórcio")

---

## PAGE 1 — DASHBOARD (Default Page)
This is the most important page. It must load first and display 
a rich, data-driven overview of the consultant's operation.

### Top KPI Cards (row of 6):
- Total de Leads do Mês (count)
- Leads Quentes (temperature = "Quente", count)
- Propostas Enviadas (count, this month)
- Vendas Fechadas (count, this month)
- Receita Potencial em Pipeline (sum of carta values in active stages, R$)
- Meta Mensal: progress bar showing R$ closed vs R$ goal (% label)

Each card: icon, label, value, and a subtle trend indicator 
(+X% vs last month where applicable).

### Charts Section (2x2 grid):

**Chart 1 — Funil de Vendas (funnel or horizontal bar chart)**
Stages and lead counts:
Novo Lead | Contato Realizado | Proposta Enviada | Em Análise | Fechado | Perdido

**Chart 2 — Leads por Origem (pie/donut chart)**
Slices: Meta Ads | Instagram | WhatsApp | Indicação | Orgânico | Outros

**Chart 3 — Leads por Produto (vertical bar chart)**
Bars: Imóvel | Veículo | Serviço | Moto | Investimento | Outros bens móveis

**Chart 4 — Evolução Mensal (line chart, last 6 months)**
Two lines: Leads Gerados and Vendas Fechadas

**Chart 5 — Taxa de Conversão por Produto (horizontal bar chart)**
One bar per product showing conversion rate %

### Alert Panels (bottom row of 3):

**Panel 1 — Leads sem contato há +7 dias**
List: avatar initial + name + last contact date + "Contatar" button 
(opens WhatsApp wa.me link)

**Panel 2 — Follow-ups de Hoje**
List: time + client name + task type + "Concluir" button

**Panel 3 — Leads Quentes sem Proposta**
List: name + product + score badge + "Criar Proposta" button

---

## PAGE 2 — LEADS & PIPELINE

### Above the board:
- Title "Pipeline de Vendas"
- Search bar (search by name or phone)
- Filter dropdowns: Produto | Origem | Temperatura | Fase
- Toggle buttons: [Kanban] [Lista]
- Button: "+ Novo Lead" (opens modal)

### Kanban View:
Use @dnd-kit/core and @dnd-kit/sortable to implement fully 
functional drag-and-drop between columns.

6 columns (pipeline stages):
1. Novo Lead
2. Contato Realizado
3. Proposta Enviada
4. Em Análise
5. ✅ Fechado (green header)
6. ❌ Perdido (red header)

Each column shows: stage name + lead count badge + total carta 
value of leads in that column (R$).

### Each Kanban Card:
- Lead name (bold)
- Product badge (color-coded):
  Imóvel=blue | Veículo=orange | Serviço=purple | 
  Moto=yellow | Investimento=green | Outros=gray
- Temperature badge: 🔵 Frio | 🟡 Morno | 🔴 Quente
- Origin tag (small, subtle)
- "X dias nesta etapa" label
- Next scheduled action (date + type icon)
- Score badge (0–100)
- Bottom action row: WhatsApp icon button | Edit icon button | 
  Move to next stage arrow button

### List View (table):
Columns: Nome | Produto | Temperatura | Origem | Etapa | 
Score | Próximo Follow-up | Valor Carta | Ações

### Lead Score — Automatic Calculation Logic:
Calculate score (0–100) based on these rules:
- Renda estimada preenchida: +20pts
- Respondeu pelo menos 1 mensagem: +15pts
- Reunião agendada ou realizada: +25pts
- Urgência declarada (tag "tem urgência"): +20pts
- Produto definido: +10pts
- Sem resposta há mais de 7 dias: -30pts
- Marcado como Frio: -20pts
- Marcado como Quente: +10pts
Score displayed as colored badge: 0-30 red | 31-60 yellow | 61-100 green

### New Lead Modal (form fields):
Nome completo | Telefone (WhatsApp) | E-mail | Produto de interesse |
Valor da carta desejada (R$) | Origem | Temperatura inicial | 
Perfil do cliente | Observações iniciais
On save: add to "Novo Lead" column, save to localStorage, 
show toast "Lead cadastrado com sucesso!"

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://contemplacrm.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/05a8725a-adda-486d-9d02-9924b3f3c000).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

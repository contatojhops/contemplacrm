# Plano: rolagem do Kanban e busca tolerante

Observação: o ambiente está no commit 3a4c334 ("Identifica descrição da atividade como opcional"), em uma branch de edição sincronizada; confirmar que corresponde a feat/atividade-opcional-historico-etapas antes de implementar.

## 1. Rolagem horizontal do Kanban (src/components/PipelineBoard.tsx)

Situação atual confirmada:
- Barra flutuante própria espelha `scrollLeft` do quadro em dois sentidos (onScroll da barra + listener `scroll` do quadro), e cada evento de rolagem chama `setKanbanMetrics`, re-renderizando o componente inteiro (todas as colunas e cards) a cada quadro de rolagem.
- Um `useEffect` extra reescreve `scrollbar.scrollLeft` sempre que `kanbanMetrics.scrollLeft` muda (terceira escrita, causa "briga" entre as barras).
- Arrastar o fundo com o mouse (pan) escreve `scrollLeft` direto a cada `pointermove`, sem rAF.
- Botões ‹ › rolam uma largura inteira de tela.

Mudanças:
1. Sincronização via `requestAnimationFrame`: um único agendador lê o quadro e atualiza a barra no próximo frame; flag `syncingFrom` ("board" | "bar") evita o eco entre as duas barras. Remover o `useEffect` de reescrita.
2. Tirar `scrollLeft` do estado React: guardar em ref; o estado só guarda `canScrollLeft`/`canScrollRight` (booleanos) e `scrollWidth/clientWidth`, atualizados só quando mudam. Assim rolar não re-renderiza os cards.
3. Pan com mouse: atualizar em rAF, limiar de 4 px antes de iniciar (não rouba cliques), `cursor: grabbing` só durante o pan, `user-select: none` temporário.
4. Roda do mouse: rolagem vertical sobre o fundo do quadro (fora de colunas com rolagem própria) vira horizontal; Shift+roda e trackpad horizontal ficam nativos. Listener com `passive: false` apenas quando há conversão.
5. Botões ‹ ›: avançar por coluna (largura da coluna + gap, ~80% da tela), `behavior: "smooth"`; respeitar `prefers-reduced-motion`.
6. CSS: `overscroll-behavior-x: contain`, `scroll-padding-inline` e `will-change` apenas durante o pan; sem scroll-snap obrigatório (atrapalharia o drag).
7. Drag-and-drop (dnd-kit): manter `data-kanban-drag` excluído do pan; durante um arrasto ativo, desligar pan/conversão da roda e deixar o auto-scroll do dnd-kit atuar (ajustar `autoScroll` com `threshold` nas bordas e aceleração moderada).
8. Corrigir as dependências do efeito de métricas (`filtered.length`, `stages.length`) para observar via ResizeObserver só o conteúdo, evitando reinstalar listeners a cada filtro.

Preservado: drag-and-drop dos cards, barra flutuante, botões ‹ ›, rolagem nativa por trackpad, rolagem até `?leadId=`.

## 2. Busca sem acentos, sem caixa e tolerante a erros

Campos de busca afetados (confirmados no código):
- `src/components/PipelineBoard.tsx:205` — busca de leads (nome/telefone) no Kanban e lista, rotas /pipeline/todos e /pipeline/$id.
- `src/routes/clientes.index.tsx:77` — busca de clientes (nome, telefone, CPF).
- `src/routes/agenda.tsx:173` — busca de lead ao vincular tarefa.
- `src/components/TopNavbar.tsx:58-64` — busca global (leads, clientes, propostas).
- `src/routes/propostas.tsx:68` — busca por nome do lead (página oculta, mas mantida coerente).
- Já existe normalização só para produtos em `LeadImportDialog.tsx:40` (`normalizeProductKey`) — passará a reutilizar o utilitário, sem mudar o comportamento de importação.
Nenhuma busca acontece no banco: todas filtram em memória, portanto nada muda em consultas, RLS ou dados.

Novo utilitário `src/lib/search.ts`:
- `normalizeText(s)`: NFD, remove diacríticos, `toLocaleLowerCase("pt-BR")`, troca pontuação por espaço, colapsa espaços.
- `digitsOnly(s)`: para telefone/CPF ("(11) 9 9999" casa com "119999").
- `matchesSearch(query, fields: { text?: string[]; digits?: string[] })` → boolean, e `searchScore(...)` → número para ordenar.
Regras de correspondência segura:
1. Consulta vazia: tudo passa.
2. Consulta só com dígitos (≥3): compara apenas com campos numéricos por "contém".
3. Texto: cada palavra da consulta precisa casar com alguma palavra do nome (AND entre palavras), por: igual, prefixo, ou "contém" (≥3 letras).
4. Aproximação (Damerau-Levenshtein contra palavra ou prefixo do mesmo tamanho), só para palavras com ≥4 letras: 1 erro até 7 letras, 2 erros a partir de 8. Palavras de 1–3 letras exigem prefixo exato (evita "Ana" casar com "Ina"/"Ada").
5. Ordenação: exato > prefixo > contém > aproximado, para que resultados exatos venham antes.
Exemplos: "joao" → "João"; "JOSÉ" → "jose"; "marcia sous" → "Márcia Souza"; "fernado" → "Fernando"; "henriqe" → "Henrique"; "ana" não casa "Ivan"? casa por "contém" só se ≥3 letras — decisão: "contém" exige ≥3 letras e só no início de alguma sílaba? Mantido simples: contém para ≥3 letras, como hoje.

Aplicação: substituir os cinco filtros acima por `matchesSearch`; na busca global, ordenar por `searchScore` e manter o limite atual de itens.

## Testes (`src/lib/search.test.js`, rodados com `bun test`)
- Acentos e caixa: "joao"↔"João", "MÁRCIA"↔"marcia", "conceição"↔"conceicao".
- Telefone/CPF com e sem máscara.
- Erro de digitação: "fernado"→Fernando, "henriqe"→Henrique, "souza"↔"sousa".
- Rejeições: "ana" não casa "Ina"; "carlos" não casa "Marcos"; "pedro silva" não casa "Pedro Costa" (todas as palavras precisam casar); dígitos não casam nomes.
- Ordenação: exato antes de aproximado.
- Consulta vazia retorna todos.
Rolagem: verificação no navegador (Playwright) em 1280px e 390px — arrastar card entre colunas, roda do mouse, barra flutuante, botões ‹ ›, sem erros no console.

## Fora do escopo
Sem alterações em banco, RLS, autenticação, estrutura de dados ou publicação.

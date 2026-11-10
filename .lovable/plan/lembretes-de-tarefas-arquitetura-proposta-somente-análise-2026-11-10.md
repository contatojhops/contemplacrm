# Lembretes de tarefas: arquitetura proposta (somente análise)

## Estado atual confirmado
- Hospedagem: TanStack Start compilado para Cloudflare Worker (`wrangler.jsonc`, `nodejs_compat`). Não há Cron Trigger configurado no wrangler, nem `src/start.ts`, nem pasta `public/`, nem rotas `src/routes/api/`.
- Nenhum Service Worker, manifest ou uso de `Notification` no código (só o sino do TopNavbar, que calcula pendências ao renderizar).
- Tarefas ficam em `public.tarefas` como JSON (`data jsonb`), chave `(user_id, id)`, RLS somente dono. O campo `data.data` é texto local sem fuso; `data.lembrete` já existe (boolean) mas não é usado para disparo.
- Backend único Lovable Cloud (mesma instância para prévia e publicado).

## Camada 1 — Modal dentro do CRM (qualquer rota)
- Componente `ReminderWatcher` montado no `AppLayout` (fora do `<Outlet />`), lendo `useTarefas()`.
- Um timer (`setTimeout` até o próximo vencimento, recalculado a cada mudança de tarefas, foco da janela e `visibilitychange`) abre um Dialog compacto: título, lead, horário, ações "Concluir", "Adiar 10 min", "Abrir lead".
- Dedupe local: tarefa só dispara uma vez por `remind_at` (registro em memória + `sessionStorage`), e sincronização entre abas via `BroadcastChannel`. Ao "Adiar", grava novo `remind_at` na nuvem.
- Funciona só com o CRM aberto (abas em segundo plano têm timers atrasados até ~1 min pelo Chrome).

## Camada 2 — Web Push com o CRM fechado
- `public/push-sw.js`: Service Worker dedicado só a push (`push` → `showNotification`, `notificationclick` → abrir/focar `/agenda`). Sem cache de páginas, sem `vite-plugin-pwa`; registro bloqueado em prévia/iframe.
- Chaves VAPID: pública no front, privada como secret do servidor.
- Botão "Ativar lembretes no navegador" em Configurações (permissão exige gesto do usuário), salvando a assinatura na nuvem.
- Envio a partir do Worker: `web-push` do Node não roda bem no workerd; usar uma implementação compatível com WebCrypto (ex.: `@block65/webcrypto-web-push` ou criptografia VAPID/aes128gcm própria). Validar no publicado.

## Camada 3 — Agendamento no servidor
- Opção recomendada: `pg_cron` + `pg_net` no Lovable Cloud chamando a rota `POST /api/public/reminders/dispatch` (handler valida segredo compartilhado). Exige rodar a reparação de credencial de cron gerenciada antes de criar o job HTTP.
- Frequência: a cada 1 minuto = 1.440 execuções/dia, mantém o banco ativo e aumenta custo; a cada 5 min = 288/dia com atraso de até 5 min. Decisão sua.
- Cloudflare Cron Trigger: não confirmado como disponível na hospedagem gerenciada; não usar sem confirmação.
- Edge Functions do backend: tecnicamente existem, mas o padrão deste projeto é rota de servidor TanStack; não usar.
- Dispatcher: seleciona lembretes vencidos e não enviados com `FOR UPDATE SKIP LOCKED`, marca `sent_at` na mesma transação (via função SQL), envia push, remove assinaturas que retornarem 404/410.

## Recursos do Lovable Cloud
- Disponíveis direto: banco, RLS, rotas de servidor no Worker, secrets (VAPID_PRIVATE_KEY, REMINDER_CRON_SECRET), extensões `pg_cron`/`pg_net`.
- Exigem ação manual/aprovação: criar secrets (gerar par VAPID), reparo da credencial de cron, publicar o app (push e SW só funcionam no domínio publicado HTTPS), permissão de notificação em cada navegador.

## Mudanças de schema/RLS (futuras)
- `public.task_reminders`: `user_id uuid`, `task_id text`, `remind_at timestamptz`, `status` (pending/sent/dismissed), `sent_at`, `attempts`, `last_error`, único `(user_id, task_id, remind_at)`. RLS dono para select/update; inserção pelo app do próprio usuário.
- `public.push_subscriptions`: `user_id`, `endpoint` único, `p256dh`, `auth`, `user_agent`, `created_at`, `last_success_at`. RLS dono; leitura pelo dispatcher só com cliente admin dentro da rota após validar o segredo.
- Sincronização tarefa → lembrete: na gravação da tarefa (cloudStore) ou trigger SQL que extrai `data->>'data'` + fuso do usuário. Preferível trigger para não depender do front.
- `configuracoes.data.timezone` (ex.: `America/Sao_Paulo`), capturado de `Intl.DateTimeFormat().resolvedOptions().timeZone`.

## Riscos
- Duplicidade: modal + push na mesma hora (resolver: push com `tag=task_id` e modal suprime se `status=sent` recente; aceitável mostrar ambos); várias abas (BroadcastChannel); vários dispositivos (um push por assinatura, intencional); cron sobreposto (SKIP LOCKED + marca atômica); edição de horário (novo `remind_at` invalida o antigo).
- Fuso: `data.data` sem offset hoje — servidor UTC interpretaria errado; converter para `timestamptz` usando o fuso salvo do usuário. Brasil sem horário de verão atualmente, mas usar nome IANA mesmo assim.
- Prévia: SW e push não devem rodar no iframe da prévia.

## Limitações reais do Chrome desktop
- Com a aba fechada mas Chrome aberto: push chega normalmente.
- Com o Chrome totalmente encerrado: no Windows/Linux a notificação só aparece se "Continuar executando apps em segundo plano" estiver ativo; senão é entregue quando o Chrome reabrir (se o TTL não expirou). No macOS, o Chrome precisa estar em execução (pode estar sem janelas).
- Modo de economia/“Não perturbe” do sistema e permissões bloqueadas suprimem a notificação; não há garantia de exatidão ao segundo (FCM pode atrasar).
- Safari/iOS só com app instalado na tela inicial (fora de escopo agora).

## Ordem de implementação sugerida
1. Fuso no perfil + modal in-app (sem backend novo).
2. Tabelas + trigger de lembretes + testes de regra (horário, dedupe).
3. Service Worker de push, VAPID, tela de ativação.
4. Rota dispatcher + job de cron com a frequência escolhida; validação no app publicado.

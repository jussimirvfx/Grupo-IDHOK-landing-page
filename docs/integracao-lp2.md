# Integração do formulário — LP 2 IDHOK

Atualização: 23/10/2026.

Domínio: https://lp2.idhok.com.br/

Origem do design: commit `27e97baee738107a1f408b0426b1395e56ef08d7`. A confirmação simulada em localStorage foi substituída pelo aceite de `/api/leads`. As opções de tipo de loja seguem a configuração de lead scoring enviada em 23/10/2026.

## Destino existente

- Workflow: https://n8n.agenciavfx.com.br/workflow/uxlrbZaj952r9BIX
- Planilha: https://docs.google.com/spreadsheets/d/1h-QVSRz16-hvPiyf-nMpbfmYDuACaJV96IdGKfl2OBY/edit?gid=807911912#gid=807911912
- Aba confirmada: `Leads Essence`.
- O workflow e os cabeçalhos da planilha não foram alterados.
- A Production URL foi confirmada contra o Webhook do workflow ativo e a configuração da LP antiga. Ela fica apenas no Secret `N8N_GRUPO_IDHOK_WEBHOOK_URL`, em Production e Preview.

## Contrato

| Formulário atual | Payload do workflow | Destino existente |
| --- | --- | --- |
| Nome completo proprietário / ownerName | fullName | Nome |
| Nome da loja / storeName | storeName | Nome da Loja |
| Telefone / WhatsApp / phone | phone, phoneE164 | Telefone / CRM |
| E-mail / email | email | Email |
| CNPJ / cnpj | cnpj, cnpj_digits | CNPJ |
| @Instagram da loja / instagram | instagram | Instagram |
| Tipo de loja / storeType | storeType | Tipo de Loja |
| Loja física? / hasPhysicalStore | hasPhysicalStore | Possui loja física? |
| Principais marcas / mainBrands | message, mainBrands | Marcas que a loja vendem |
| Cadastro do CNPJ, no servidor | city, state | Cidade, Estado |
| URL e UTMs | url, utm_* | URL, Criativo de conversão |

Todos os nove campos visíveis são obrigatórios. Cidade, estado e tempo de CNPJ são obtidos da consulta cadastral no servidor e não aparecem no formulário. `salespeople` e `segments` seguem vazios porque não existem perguntas correspondentes.

O score considera apenas tipo de loja, loja física, estado prioritário e tempo de CNPJ. Os pontos seguem a configuração enviada: Boutique/Multimarcas 40; shopping 5; online 10; autônomo 1; Magazine 5; loja física Sim 34/Não 5; estado prioritário 1; CNPJ com menos de 1 ano 10, 1 a 2 anos 15, 3 a 4 anos 20, 5 anos ou mais 25. O total é limitado a 100. Loja online, autônomo, Magazine, ausência de loja física e CNPJ com menos de um ano desqualificam; o payload e os logs incluem score, critérios, status e motivos. Se não houver data de abertura nem tempo de CNPJ confiável, o status fica `pending_company_data` e não é marcado como qualificado.

## Validação e confirmação

A API valida o formato dos campos, telefone brasileiro, dígitos verificadores do CNPJ e mantém a confirmação de CNPJ ativo usada pela LP anterior. O usuário confirmou expressamente esse modo em 23/10/2026. A consulta cadastral usa a API central, com OIDC do runtime da Vercel e a identidade do projeto novo. Cidade e estado vêm dessa resposta, sem confiar no navegador. O payload inclui também `encontrado`, `fonte` e `company` normalizado pelo servidor, com o mesmo conteúdo no backup e no webhook.

O formulário valida os dois dígitos verificadores imediatamente ao completar o CNPJ; valor válido não gera mensagem. CNPJ incompleto recebe aviso ao sair do campo. A consulta ocorre no servidor durante o envio, sem mostrar dados cadastrais no campo. A confirmação obrigatória que falhar produz uma única mensagem genérica no formulário e não agenda entrega. O navegador exibe cada erro de preenchimento junto ao campo e desloca o foco para o primeiro erro.

Telefone usa a mesma regra na interface e na API: DDD brasileiro, celular de 11 dígitos iniciado por 9 após o DDD ou fixo de 10 iniciado por 2 a 5. Aceita `+55` completo e preserva DDD 55 nacional. Não corta colagens excedentes; após um celular válido, uma tecla numérica excedente é ignorada. O 11º dígito depois de um aparente fixo é preservado e invalidado. O submit lê os valores visíveis, inclusive autofill sem evento, antes de verificar as restrições nativas de campos obrigatórios e e-mail. A máscara preserva cursor e foco. O foco atrasado do botão de cadastro é cancelado quando o visitante escolhe outro campo.

`POST /api/cnpj` é uma rota de consulta sem entrega de lead, com o mesmo cliente central/OIDC, validação prévia, proteção de origem e limite por IP de 10 consultas/minuto por instância (a API central mantém seus próprios controles). Não existe consulta cadastral no navegador nem segunda cascata no n8n. A rota permite verificar a integração sem enviar o formulário.

O recebimento é registrado em logs do servidor, correlacionado por `submission_id`. A entrega ao workflow é agendada com `waitUntil`; o navegador espera o aceite da API da LP, sem esperar a planilha, CRM ou WhatsApp. A resposta de aceite não é prova de entrega downstream. Falhas posteriores ficam registradas como `lead_delivery_failed`.

O formulário só confirma após receber `accepted`, `backup_recorded`, `delivery_scheduled` e o mesmo `submission_id`. Falhas não exibem sucesso. Tentativas com o mesmo conteúdo preservam a identificação para a idempotência já existente no workflow. Marcadores de teste do workflow permanecem intactos. Flags de dry-run são rejeitadas antes de qualquer consulta, backup ou entrega; testes locais usam dependências simuladas.

## Validação feita sem leads reais

- `npm run lint` e `npm run build`.
- `npm test`: contrato completo, igualdade do backup com o payload, score calculado, aceite antes de resposta do webhook, falhas posteriores, validação, configuração e agendamento, bloqueio de dry-run e propagação do OIDC.
- O HTML inicial renderizado contém os nove campos obrigatórios e seletores inicialmente vazios.
- Testes renderizados cobrem digitação, colagem, edição no meio, exclusão, erro e correção, autofill sem evento, foco de CTA e foco após submit inválido.
- Handler real com consulta e entrega simuladas confirma zero efeitos para telefone inválido, contrato cadastral no backup/webhook e token OIDC do runtime, ignorando Authorization do navegador.
- O workflow e a aba de destino foram inspecionados, sem executar envio de cadastro, mensagem ou gravação de teste na planilha.

O botão flutuante e os demais CTAs de cadastro levam ao formulário. A consulta real de CNPJ depende do token OIDC da Vercel; testes locais usam uma resposta cadastral simulada.

## Console no localhost

Com `npm run dev`, o envio de um formulário válido em localhost calcula uma prévia usando o mesmo `calculateLeadScore` da API. O Vite encaminha apenas `/api/cnpj` para a rota de consulta da LP publicada, que mantém a autenticação da API central no servidor. Nenhum cadastro de teste local é enviado ao webhook.

No console do navegador, o grupo `Lead score — Grupo IDHOK` apresenta os pontos de cada critério, o total, o status, a qualificação e os motivos de desqualificação. Se a consulta falhar, o console informa que a nota é parcial e os dados ausentes não recebem pontos. CNPJ inativo não é marcado como qualificado. O formulário permanece disponível para outro teste, sem exibir confirmação de entrega comercial.

## Meta Pixel e Conversion API — etapa 2

O projeto usa React/Vite. `scoretrack@1.0.0` foi instalado pelo registry público do npm e fixado nessa versão. `src/main.tsx` monta `TrackingProvider`, com configuração manual em `src/MetaTrackingProvider.tsx`. Não montar o componente adicional `MetaPixel`: o provider do pacote já envia `PageView`.

O provider também envia o evento personalizado `Scroll` nos marcos 0%, 25%, 50%, 75% e 100%, pelo Pixel e pela CAPI, com `scroll_depth`, `scroll_percentage` e `page_path`. Cada marco dispara uma única vez por carregamento, inclusive ao voltar e descer novamente. O marco zero é registrado após inicializar o Pixel; o de 100% usa tolerância de um pixel no final da página, sem arredondar antecipadamente. A API aceita somente esses cinco valores. Os marcos estão centralizados em `lib/meta-events.js`.

O cadastro aceito dispara `Lead`. `LeadQualificado` exige `isQualifiedLead: true`, status `qualified`, score de pelo menos 50 e lista vazia de motivos de desqualificação. A API devolve cidade, estado e CEP confirmados na consulta cadastral para matching; o telefone segue E.164. `value` e `lead_score` preservam o mesmo valor calculado na etapa 1. Falhas do tracking não alteram o aceite do cadastro nem a mensagem de agradecimento. Pixel e CAPI usam o mesmo nome e identificador gerados pelo pacote.

### Configuração

- Público no Vite: `VITE_META_PIXEL_ID=2372940856574782`.
- Servidor: `META_PIXEL_ID`, `META_API_ACCESS_TOKEN` e, somente em Development/Preview, `META_TEST_EVENT_CODE`.
- `.env.local` contém as credenciais recebidas e permanece ignorado pelo Git. O token nunca recebe prefixo `VITE_` nem entra na configuração pública do pacote.
- Em Production (`VERCEL_ENV=production`), a rota ignora o código de teste mesmo que esteja configurado por engano.
- A configuração local não configura as variáveis no painel da Vercel.

### Observabilidade

`POST /api/meta/conversions` prepara e registra `conversion_api_event_backup` antes da chamada externa, incluindo identidade do projeto/rota/evento, custom data, presença de identificadores e payload preparado com SHA-256. Valores já hasheados não são hasheados novamente. Cookies `_fbp` e `_fbc` permanecem sem hash.

Header `X-VFX-Dry-Run` e body `dry_run`, `dryRun`, `vfx_dry_run`, `skip_webhook` retornam HTTP 200 com `dry_run: true` e `skipped_meta: true`, sem chamar a Meta. Erros externos, configuração ausente ou erro interno retornam HTTP 202 com `accepted: true` e registram `conversion_api_event_error`, com payload de entrada e payload preparado recuperáveis. Tokens são removidos inclusive de mensagens de erro retornadas pela Meta. `GET /api/meta/conversions` oferece uma verificação de configuração sem revelar credenciais.

O Vite serve a mesma rota de conversão localmente. O Pixel carrega também no localhost, permitindo sua identificação pela extensão e o envio de `PageView`. A CAPI local usa `META_TEST_EVENT_CODE` do `.env.local`. Apenas `?dry_run=1` desativa explicitamente o provider. A prévia local do formulário continua sem enviar cadastros ao webhook comercial. O teste real da API usa dados fictícios e o código de teste.

### Evidência e publicação

- Testes isolados verificam regra de qualificação, falhas, dry-run, hash e redação de tokens. O pacote real também é executado em navegador simulado, verificando um único `PageView` e igualdade de IDs entre Pixel e CAPI.
- A rota local foi chamada em dry-run e em teste real; a Meta confirmou `events_received: 1` para `Lead` e para `LeadQualificado` em 26/10/2026.
- Antes de considerar produção pronta: configurar as variáveis server-side da Vercel, publicar a alteração e verificar a rota no domínio customizado e os respectivos logs do deployment.
- O script `scripts/lp-production-observability-check.sh` citado no material não existe neste repositório nem nos checkouts locais consultados. O gate `OK_PRODUCTION_OBSERVABILITY_READY` ainda não foi executado; a evidência local não o substitui.
- `npm audit` aponta cinco alertas altos na árvore atual, em `body-parser` e na cadeia de `zod`/Vercel. O pacote solicitado também aumenta o bundle e gera avisos de `eval` e tamanho no build; isso não impede a compilação.

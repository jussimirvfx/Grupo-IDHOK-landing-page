# Integração do formulário — LP 2 IDHOK

Atualização: 23/10/2026.

Domínio: https://lp2.idhok.com.br/

Origem do design: commit `27e97baee738107a1f408b0426b1395e56ef08d7`. Os campos, opções e classes do formulário foram mantidos. A confirmação simulada em localStorage foi substituída pelo aceite de `/api/leads`.

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

O usuário decidiu manter apenas os campos atuais e ajustar o score depois. Portanto `salespeople` e `segments` seguem vazios, `leadScore` e `lead_score` seguem `null`, e `score_status` é `not_evaluated`. Não se inventa score zero, qualificação ou respostas ausentes. Não foram criados campos de vendedores ou segmentos, nem alteradas as opções de tipo de loja.

## Validação e confirmação

A API valida o formato dos campos, telefone brasileiro, dígitos verificadores do CNPJ e mantém a confirmação de CNPJ ativo usada pela LP anterior. O usuário confirmou expressamente esse modo em 23/10/2026. A consulta cadastral usa a API central, com OIDC do runtime da Vercel e a identidade do projeto novo. Cidade e estado vêm dessa resposta, sem confiar no navegador. O payload inclui também `encontrado`, `fonte` e `company` normalizado pelo servidor, com o mesmo conteúdo no backup e no webhook.

O formulário valida os dois dígitos verificadores imediatamente ao completar o CNPJ; valor válido não gera mensagem. CNPJ incompleto recebe aviso ao sair do campo. A consulta ocorre no servidor durante o envio, sem mostrar dados cadastrais no campo. A confirmação obrigatória que falhar produz uma única mensagem genérica no formulário e não agenda entrega.

Telefone usa a mesma regra na interface e na API: DDD brasileiro, celular de 11 dígitos iniciado por 9 após o DDD ou fixo de 10 iniciado por 2 a 5. Aceita `+55` completo e preserva DDD 55 nacional. Não corta colagens excedentes; após um celular válido, uma tecla numérica excedente é ignorada. O 11º dígito depois de um aparente fixo é preservado e invalidado. O submit lê os valores visíveis, inclusive autofill sem evento, antes de verificar as restrições nativas de campos obrigatórios e e-mail. A máscara preserva cursor e foco. O foco atrasado do botão de cadastro é cancelado quando o visitante escolhe outro campo.

`POST /api/cnpj` é uma rota de consulta sem entrega de lead, com o mesmo cliente central/OIDC, validação prévia, proteção de origem e limite por IP de 10 consultas/minuto por instância (a API central mantém seus próprios controles). Não existe consulta cadastral no navegador nem segunda cascata no n8n. A rota permite verificar a integração sem enviar o formulário.

O recebimento é registrado em logs do servidor, correlacionado por `submission_id`. A entrega ao workflow é agendada com `waitUntil`; o navegador espera o aceite da API da LP, sem esperar a planilha, CRM ou WhatsApp. A resposta de aceite não é prova de entrega downstream. Falhas posteriores ficam registradas como `lead_delivery_failed`.

O formulário só confirma após receber `accepted`, `backup_recorded`, `delivery_scheduled` e o mesmo `submission_id`. Falhas não exibem sucesso. Tentativas com o mesmo conteúdo preservam a identificação para a idempotência já existente no workflow. Marcadores de teste do workflow permanecem intactos. Flags de dry-run são rejeitadas antes de qualquer consulta, backup ou entrega; testes locais usam dependências simuladas.

## Validação feita sem leads reais

- `npm run lint` e `npm run build`.
- `npm test`: contrato completo, igualdade do backup com o payload, score não calculado, aceite antes de resposta do webhook, falhas posteriores, validação, configuração e agendamento, bloqueio de dry-run e propagação do OIDC.
- O HTML inicial renderizado preserva os campos, textos e classes do design; só acrescenta atributos de validação e autocomplete.
- Testes renderizados cobrem digitação, colagem, edição no meio, exclusão, erro e correção, autofill sem evento, foco de CTA e foco após submit inválido.
- Handler real com consulta e entrega simuladas confirma zero efeitos para telefone inválido, contrato cadastral no backup/webhook e token OIDC do runtime, ignorando Authorization do navegador.
- O workflow e a aba de destino foram inspecionados, sem executar envio de cadastro, mensagem ou gravação de teste na planilha.

O escopo final desta alteração é conectar o formulário ao webhook existente e atualizar a Central. Score, novos campos, mudança de rastreamento e configuração do botão de WhatsApp ficaram fora desta alteração após a orientação mais recente do usuário.

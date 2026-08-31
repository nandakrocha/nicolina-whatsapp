IMPLEMENTAÇÃO CONTROLADA — ETAPA 1 DA INTEGRAÇÃO WHATSAPP

O diagnóstico anterior confirmou que a página
src/app/pages/IntegracaoWhatsApp.tsx
possui várias seções estáticas.

O Firebase Authentication e o Firebase Realtime Database JÁ ESTÃO
FUNCIONANDO corretamente no sistema.

NÃO ALTERE:
- firebaseConfig
- Firebase Authentication
- signInAnonymously
- authReadyPromise
- regras do Firebase
- sincronização global existente
- encomendas
- produtos
- clientes
- usuários
- orçamentos
- Service Worker
- outras páginas do sistema
- estrutura visual atual da página Integração WhatsApp

OBJETIVO DESTA ETAPA:

Transformar a página Integração WhatsApp em uma interface dinâmica
conectada ao Firebase Realtime Database, SEM ainda implementar comunicação
direta do navegador com a API da Meta.

IMPORTANTE SOBRE SEGURANÇA:

NÃO criar campo para armazenar Access Token da Meta no Firebase.
NÃO armazenar App Secret.
NÃO colocar credenciais secretas no frontend.
NÃO colocar tokens dentro de IntegracaoWhatsApp.tsx.
Esses segredos deverão permanecer posteriormente no backend/Cloud Run.

--------------------------------------------------
1. CONFIGURAÇÕES DA INTEGRAÇÃO
--------------------------------------------------

Utilizar o nó já previsto:

nicolina/integracao_whatsapp/configuracoes

Criar leitura em tempo real desse nó usando onValue().

Considere uma estrutura pública de configuração semelhante a:

{
  "whatsappConfigurado": false,
  "metaConfigurado": false,
  "automacaoAtiva": false,
  "phoneNumberId": "",
  "wabaId": "",
  "webhookUrl": "",
  "ultimaMensagemEm": null
}

Esses dados NÃO devem conter Access Token, App Secret ou qualquer
credencial secreta.

--------------------------------------------------
2. STATUS DA INTEGRAÇÃO
--------------------------------------------------

Substituir SOMENTE os textos hardcoded da seção "Status da Integração".

WHATSAPP:
whatsappConfigurado === true
→ mostrar "Configurado"

false/ausente
→ mostrar "Não configurado"

META:
metaConfigurado === true
→ mostrar "Configurado"

false/ausente
→ mostrar "Não configurado"

AUTOMAÇÃO:
automacaoAtiva === true
→ mostrar "Ativada"

false/ausente
→ mostrar "Desativada"

ÚLTIMA MENSAGEM:
usar ultimaMensagemEm.

Se não existir:
"Nenhuma"

Se existir:
formatar data/hora em pt-BR.

Não inventar status.
A interface deve representar exclusivamente o conteúdo real do Firebase.

--------------------------------------------------
3. PEDIDOS RECEBIDOS
--------------------------------------------------

Utilizar o nó já previsto:

nicolina/integracao_whatsapp/pedidos

Criar listener onValue().

Converter os filhos do Firebase para array preservando o Firebase key
como id.

Exibir os pedidos reais na tabela já existente "Pedidos Recebidos".

Manter as colunas atuais:

Data/Hora
Cliente
Grupo
Resumo
Status
Ações

Se não houver pedidos, continuar mostrando:

"Nenhum pedido recebido"

Não criar dados de demonstração.
Não criar pedidos fictícios.

--------------------------------------------------
4. MENSAGENS
--------------------------------------------------

Também preparar listener para:

nicolina/integracao_whatsapp/messages

Nesta etapa não é necessário criar nova interface visual para mensagens.

O listener poderá ser utilizado para atualizar a informação da última
mensagem recebida caso exista timestamp válido.

Não modificar outras seções da página desnecessariamente.

--------------------------------------------------
5. CONFIGURAR INTEGRAÇÃO
--------------------------------------------------

O botão atualmente disabled "Configurar Integração" NÃO deve solicitar
Access Token.

Pode continuar desabilitado NESTA ETAPA.

Não implementar ainda comunicação direta com Meta.

--------------------------------------------------
6. BACKEND
--------------------------------------------------

NÃO criar webhook dentro do frontend.

NÃO tentar receber POST da Meta no Figma.

NÃO criar Cloud Run nesta etapa.

NÃO implementar X-Hub-Signature-256 no frontend.

O backend existente/externo será conectado posteriormente.

--------------------------------------------------
7. COMPATIBILIDADE
--------------------------------------------------

Antes de alterar, identifique e reutilize as funções e instâncias
Firebase já existentes no projeto.

Não inicialize um segundo Firebase App.
Não crie uma segunda instância independente do Realtime Database.

Use a infraestrutura existente em src/app/services/firebase.ts.

As subscriptions devem possuir cleanup com off()/unsubscribe ou
retorno apropriado no useEffect para evitar listeners duplicados.

--------------------------------------------------
8. RESULTADO ESPERADO
--------------------------------------------------

Depois da implementação:

A página deverá continuar visualmente igual.

Se configuracoes estiver vazio:
WhatsApp = Não configurado
Meta = Não configurado
Automação = Desativada
Última mensagem = Nenhuma

Se os valores forem alterados no Firebase, a tela deverá mudar
automaticamente em tempo real.

Se um pedido for inserido em:
nicolina/integracao_whatsapp/pedidos

ele deverá aparecer automaticamente em "Pedidos Recebidos".

--------------------------------------------------
9. NÃO ALTERAR OUTRAS FUNCIONALIDADES
--------------------------------------------------

Preservar integralmente:
Dashboard
Lista de Encomendas
Encomendas
Fechamento Caixa
Produtos
Clientes
Relatórios
Usuários
Backup
Configurações
Administração
Fluxo de Caixa
e toda sincronização Firebase já funcionando.

--------------------------------------------------
10. AO TERMINAR

Não faça novas alterações automaticamente.

Informe exatamente:

- arquivos modificados;
- imports adicionados;
- funções adicionadas;
- listeners Firebase criados;
- caminhos Firebase utilizados;
- estrutura esperada de cada pedido;
- como foi feito o cleanup dos listeners;
- confirmação de que nenhuma credencial secreta foi colocada no frontend.

NÃO avance para a integração Meta/Cloud Run.
Pare após concluir esta etapa.
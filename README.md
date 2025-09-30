💰 ByteBanks - Minhas Contas em Dia

ByteBanks é uma aplicação web moderna de finanças pessoais, desenvolvida para ajudar você a organizar suas receitas, despesas e contas bancárias com praticidade. Com dashboards interativos e relatórios inteligentes, você tem uma visão clara da sua saúde financeira em tempo real.

🧩 Funcionalidades Principais
🔐 Autenticação Segura

Registro e login com Firebase Authentication (Email/Senha).

📊 Dashboard Interativo

Visão mensal e anual da sua situação financeira.

Gráficos de:

Despesas por categoria.

Despesas por banco.

Comparativo anual de receitas vs. despesas.

🧾 Lançamento de Transações

Cadastro fácil de despesas e receitas.

Categorização por tipo (alimentação, salário, saúde etc.).

Suporte para lançamentos parcelados (com ou sem juros).

📃 Extrato e Relatórios

Filtros por data, categoria, banco e forma de pagamento.

Exportação de extratos para PDF com layout organizado.

🏦 Gestão de Contas Bancárias

Adição, edição e exclusão de contas personalizadas.

📅 Previsão de Gastos

Visualização de parcelas futuras e lançamentos programados.

🚀 Tecnologias Utilizadas
Frontend

React

Vite

Tailwind CSS

shadcn/ui
 + Radix UI

Recharts
 para gráficos

React Hook Form
 para formulários

Backend e Base de Dados

Firebase

Authentication

Firestore Database

Exportação de PDF

jsPDF

jspdf-autotable

🛠️ Requisitos para rodar localmente

Certifique-se de ter os seguintes itens instalados:

Node.js
 (v18 ou superior)

pnpm
 (ou npm/yarn, se preferir)

⚙️ Instalação e Configuração

Clone o repositório e instale as dependências:

git clone https://github.com/seu-usuario/ByteBanks.git
cd ByteBanks
pnpm install

🔧 Configuração do Firebase

Crie um projeto no Firebase Console
.

Ative os serviços:

Authentication (Email/Senha)

Firestore Database

Gere as credenciais do seu projeto e crie o arquivo .env na raiz com o seguinte conteúdo:

VITE_FIREBASE_API_KEY="SUA_API_KEY"
VITE_FIREBASE_AUTH_DOMAIN="SEU_AUTH_DOMAIN"
VITE_FIREBASE_PROJECT_ID="SEU_PROJECT_ID"
VITE_FIREBASE_STORAGE_BUCKET="SEU_STORAGE_BUCKET"
VITE_FIREBASE_MESSAGING_SENDER_ID="SEU_MESSAGING_SENDER_ID"
VITE_FIREBASE_APP_ID="SEU_APP_ID"

📦 Scripts Disponíveis
Comando	Descrição
pnpm dev	Inicia o ambiente de desenvolvimento (localhost:5173)
pnpm build	Compila o projeto para produção na pasta dist/
pnpm preview	Visualiza a versão de produção localmente
pnpm lint	Executa o linter para garantir qualidade do código
📌 Roadmap (Futuras melhorias)

Integração com Open Finance.

Suporte para múltiplos perfis/usuários por conta.

Geração de gráficos personalizados salvos pelo usuário.

Notificações de vencimentos e metas financeiras.

Aplicativo mobile com sincronização automática.

👥 Contribuindo

Contribuições são bem-vindas! Se você tem ideias, sugestões ou correções, sinta-se à vontade para abrir uma issue ou enviar um pull request.

📄 Licença

Este projeto está licenciado sob a MIT License
.

🙌 Feito com dedicação por ByteUp Solutions

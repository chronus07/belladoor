# Guia de Publicação e Lançamento na Nuvem — BellaDoor 🚀

Este guia foi elaborado para você colocar o **BellaDoor** no ar na internet com **Custo R$ 0 / mês inicial**, de forma simples e rápida, mesmo sem ter experiência prévia com programação.

---

## ☁️ 1. Como Colocar o Site no Ar na Vercel (Gratuito)

A Vercel é a maior plataforma de hospedagem de aplicativos modernos do mundo e possui um plano gratuito generoso com SSL (cadeado de segurança) automático.

### Passo a Passo:
1. Crie uma conta gratuita em [vercel.com](https://vercel.com) (usando sua conta Google ou GitHub).
2. Instale o utilitário da Vercel no terminal ou conecte diretamente com seu repositório GitHub.
3. Pelo terminal, basta executar dentro da pasta do projeto (`belladoor`):
   ```bash
   npx vercel
   ```
4. Siga as instruções na tela pressionando `Enter` para aceitar os padrões.
5. Pronto! Em menos de 2 minutos você receberá um link público seguro (ex: `https://belladoor.vercel.app`) acessível de qualquer celular ou computador do mundo.

---

## 🗄️ 2. Como Configurar o Banco de Dados no Supabase (Gratuito)

O Supabase entrega um banco de dados PostgreSQL profissional com autenticação de usuários e armazenamento de fotos gratuitamente.

### Passo a Passo:
1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita.
2. Clique em **"New Project"** e escolha o nome: `belladoor`.
3. No menu lateral esquerdo, clique no ícone **SQL Editor** (ou Editor SQL).
4. Abra o arquivo [`database/schema.sql`](database/schema.sql) deste projeto, copie todo o conteúdo e cole no editor do Supabase.
5. Clique em **"Run"** (Executar).
6. Pronto! Todas as tabelas (`profissionais`, `servicos`, `bairros`, `agendamentos`, `assinaturas`) estarão criadas e ativas na nuvem.
7. *(Opcional)* Cole o arquivo [`database/seed.sql`](database/seed.sql) para já ter a profissional de exemplo (*Camila Martins*) cadastrada na nuvem.

---

## 📱 3. Como Gerar o Aplicativo Android (.APK) com Expo (Gratuito)

Para gerar o arquivo do aplicativo instalável no celular das profissionais:

1. Acesse a pasta `mobile` no terminal:
   ```bash
   cd mobile
   ```
2. Instale a ferramenta oficial do Expo (EAS):
   ```bash
   npm install -g eas-cli
   ```
3. Faça login com sua conta gratuita do Expo:
   ```bash
   npx eas login
   ```
4. Execute o comando para gerar o arquivo `.apk` de instalação direta:
   ```bash
   npx eas build -p android --profile preview
   ```
5. Os servidores na nuvem do Expo vão compilar o aplicativo para você. Ao final, você receberá um link direto e um QR Code para baixar e instalar o app no seu smartphone Android.

---

## 🌐 4. Como Configurar seu Domínio Próprio

Assim que você registrar o domínio (ex: `belladoor.app` ou `belladoorapp.com.br`):
1. No painel da Vercel, vá em **Settings** $\rightarrow$ **Domains**.
2. Digite o seu domínio (ex: `belladoor.app`).
3. A Vercel mostrará 2 registros de DNS (tipo `CNAME` ou `A`) para você colar no painel onde comprou o domínio (ex: Registro.br ou Google Domains).
4. Em poucas horas seu link oficial estará no ar!

---

## 🎯 5. Estratégia dos Primeiros 20 Assinantes Pagantes (Go-To-Market)

Para faturar seus primeiros R$ 600 a R$ 1.500 no primeiro mês com a assinatura de **R$ 39,90/mês ou R$ 299/ano**:

1. **Abordagem no Instagram de Profissionais a Domicílio:**
   * Pesquise no Instagram: *"Maquiadora a domicílio São Paulo"*, *"Manicure a domicílio"*, *"Penteados em casa"*.
   * Envie um Direct educado:
     > *"Olá [Nome]! Adorei seus trabalhos. Reparei que você atende a domicílio e gasta tempo respondendo endereço e combinando horário no WhatsApp. Criamos o BellaDoor para você ter seu próprio link onde a cliente já digita o CEP, calcula sua taxa de deslocamento e agenda no horário certo com margem de trânsito. Te liberei 14 dias de teste grátis, topa testar sem compromisso?"*
2. **Oferta Irresistível:**
   * Ofereça 14 dias grátis para elas usarem na prática com clientes reais.
   * Quando elas sentirem a tranquilidade de não ter mais atrasos e receberem os agendamentos organizados com botão de GPS, a conversão para o plano mensal (R$ 39,90) ou anual (R$ 299) torna-se natural.

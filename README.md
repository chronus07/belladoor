# 🚪 BellaDoor — A beleza que bate à sua porta ✨

Plataforma SaaS e Marketplace de gestão de vitrine, cálculo de deslocamento por CEP e agendamento online para **profissionais da beleza a domicílio** (manicures, maquiadoras, cabeleireiras, lash designers e esteticistas).

---

## ✨ Principais Funcionalidades

- **📸 Vitrine & Fotos Personalizável:**
  - Configuração de Nome, Especialidade, `@Instagram`, `WhatsApp` e Bio.
  - Upload direto do celular/computador para Foto de Perfil, Imagem de Banner (Capa) e Galeria de Portfólio de Trabalhos Realizados.
- **🔗 Link Direto na Bio (`/?pro=seu-slug`):**
  - Link exclusivo para Instagram e WhatsApp que abre diretamente a vitrine da profissional para a cliente agendar sem barreiras.
- **📍 Cálculo Automático de Deslocamento (ViaCEP):**
  - Consulta de CEP em tempo real cruzando com os bairros atendidos pela profissional e calculando automaticamente a taxa de deslocamento.
- **📅 Gestão de Agenda, Expediente e Bloqueios:**
  - Resumo financeiro (Receita Total, Serviços, Deslocamento e Ticket Médio).
  - Configuração de dias da semana atendidos, horário de início/término, pausa de almoço e tempo de margem no trânsito.
  - Fechamento de períodos de férias/cursos e integração 1-toque com **Waze**, **Google Maps** e **WhatsApp**.
- **⭐ Área "Meus Agendamentos" e Avaliações Verificadas:**
  - Clientes acompanham seus agendamentos, conversam no WhatsApp e avaliam o atendimento de 1 a 5 estrelas (atualizando a nota média da vitrine ao vivo).
- **💳 Assinatura SaaS BellaDoor Pro:**
  - Fluxo de Teste Grátis de 7 Dias e planos Mensal (`R$ 39,90/mês`) e Anual (`R$ 299,00/ano`) com checkout PIX Copia e Cola e Cartão.

---

## 🚀 Como Rodar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento (http://localhost:3000)
npm run dev

# 3. Gerar build de produção (pasta dist/)
npm run build
```

---

## ☁️ Como Fazer Deploy na Cloud (Vercel / Netlify)

O projeto já inclui [`vercel.json`](./vercel.json) e [`public/_redirects`](./public/_redirects) configurados para Single Page Application (SPA):

1. Suba este repositório para o **GitHub**.
2. Acesse [Vercel](https://vercel.com) ou [Netlify](https://netlify.com) e clique em **"Add New Project" / "Import from GitHub"**.
3. Selecione o repositório `belladoor`:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Clique em **Deploy** — em menos de 1 minuto sua plataforma estará no ar com HTTPS e deploy automático a cada `git push`!

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Award,
  ShieldCheck,
  CheckCircle,
  Eye,
  MessageCircle,
  Star,
  MapPin,
  CreditCard,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { UnifiedAdminUser } from './AdminUsersView';
import { ClientAppointment } from '../types/belladoor';
import { BetaFeedbackEntry } from '../../lib/firebaseClient';

interface AdminDashboardTabProps {
  unifiedUsers: UnifiedAdminUser[];
  allAppointments?: ClientAppointment[];
  betaFeedbacks?: BetaFeedbackEntry[];
  onQuickGrantDays?: (user: UnifiedAdminUser, days: number) => void;
  onOpenWhatsApp?: (user: UnifiedAdminUser) => void;
}

interface MonthData {
  month: string;
  shortMonth: string;
  year: number;
  pixRevenue: number;
  cardRevenue: number;
  annualRevenue: number;
  totalGross: number;
  mpFees: number;
  infraCost: number;
  netProfit: number;
  activePros: number;
  gmv: number;
  appointmentsCount: number;
  growthMoM: string;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  unifiedUsers,
  allAppointments = [],
  betaFeedbacks = [],
  onQuickGrantDays,
  onOpenWhatsApp,
}) => {
  const [chartView, setChartView] = useState<'SAAS' | 'GMV'>('SAAS');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(5); // Default: Outubro (mês atual)
  const [proSearchQuery, setProSearchQuery] = useState('');
  const [proSortBy, setProSortBy] = useState<'FATURAMENTO' | 'SUCESSO' | 'SERVICOS'>('FATURAMENTO');
  const [inspectingPro, setInspectingPro] = useState<any | null>(null);

  // Estatísticas de feedbacks das 10 primeiras profissionais beta
  const feedbackStats = useMemo(() => {
    const total = betaFeedbacks.length;
    const avg =
      total > 0
        ? (betaFeedbacks.reduce((acc, f) => acc + (f.rating || 5), 0) / total).toFixed(1)
        : '5.0';
    const wouldPayYesCount = betaFeedbacks.filter((f) => f.willingnessToPay === 'YES').length;
    const wouldPayPercent = total > 0 ? Math.round((wouldPayYesCount / total) * 100) : 100;
    return {
      total,
      avgRating: avg,
      wouldPayPercent,
    };
  }, [betaFeedbacks]);

  // Filtra profissionais
  const proUsers = useMemo(() => {
    return unifiedUsers.filter((u) => u.role === 'PROFESSIONAL');
  }, [unifiedUsers]);

  // Cálculos da base de assinantes atuais
  // Everton informou: "único usuário ativo é o meu mesmo e o da Thaynara Leticia, que ativou por cupom de desconto. Não foi feito nenhum pagamento ou algo do tipo até agora, só foram testadas as opções."
  const couponPros = useMemo(() => {
    return proUsers.filter(
      (u) =>
        u.subscriptionStatus === 'ACTIVE' &&
        (u.paymentMethod === 'COUPON' ||
          Boolean(u.appliedCoupon) ||
          u.fullName.toLowerCase().includes('thaynara') ||
          u.email.toLowerCase().includes('thaynara'))
    );
  }, [proUsers]);

  const paidPros = useMemo(() => {
    return proUsers.filter(
      (u) =>
        u.subscriptionStatus === 'ACTIVE' &&
        u.paymentMethod !== 'COUPON' &&
        !u.appliedCoupon &&
        !u.fullName.toLowerCase().includes('thaynara') &&
        !u.email.toLowerCase().includes('thaynara') &&
        (u.paymentMethod === 'PIX' ||
          u.paymentMethod === 'CARD_RECURRING' ||
          u.paymentMethod === 'ANNUAL')
    );
  }, [proUsers]);

  const trialPros = useMemo(() => {
    return proUsers.filter(
      (u) =>
        u.subscriptionStatus !== 'ACTIVE' &&
        (u.trialDaysLeft ?? 0) > 0 &&
        !u.fullName.toLowerCase().includes('thaynara')
    );
  }, [proUsers]);

  const expiredPros = useMemo(() => {
    return proUsers.filter(
      (u) =>
        u.subscriptionStatus !== 'ACTIVE' &&
        (u.trialDaysLeft ?? 0) <= 0 &&
        !u.fullName.toLowerCase().includes('thaynara')
    );
  }, [proUsers]);

  // Distribuição 100% REAL de formas de pagamento (zero valores fictícios)
  const paymentBreakdown = useMemo(() => {
    const pixCount = paidPros.filter((u) => u.paymentMethod === 'PIX').length;
    const cardCount = paidPros.filter((u) => u.paymentMethod === 'CARD_RECURRING').length;
    const annualCount = paidPros.filter((u) => u.paymentMethod === 'ANNUAL').length;
    const totalPaid = paidPros.length; // 0 pagantes financeiros
    const couponCount = couponPros.length; // 1 (Thaynara)

    const pixRevenue = pixCount * 44.9;
    const cardRevenue = cardCount * 39.9;
    const annualRevenue = annualCount * 299.0;

    const totalMonthlyGross = pixRevenue + cardRevenue + annualRevenue;
    const mpPixFee = pixRevenue * 0.0099; // 0.99% PIX no Mercado Pago
    const mpCardFee = cardRevenue * 0.0399; // 3.99% Cartão Recorrente no Mercado Pago
    const mpAnnualFee = annualRevenue * 0.0299; // Taxa média anual
    const totalMpFees = mpPixFee + mpCardFee + mpAnnualFee;
    const infraCosts = 0; // Período de testes / free tier sem desembolso ativo
    const netProfit = Math.max(0, totalMonthlyGross - totalMpFees - infraCosts);

    return {
      totalPaid,
      couponCount,
      pixCount,
      cardCount,
      annualCount,
      pixRevenue,
      cardRevenue,
      annualRevenue,
      totalMonthlyGross,
      totalMpFees,
      infraCosts,
      netProfit,
      marginPercent: totalMonthlyGross > 0 ? (netProfit / totalMonthlyGross) * 100 : 0,
    };
  }, [paidPros, couponPros]);

  // Dados históricos do ano de 2026 para o gráfico (100% reais, sem simulação artificial)
  const monthsData: MonthData[] = useMemo(() => {
    // GMV real de atendimentos concluídos na plataforma
    const currentGmv = allAppointments
      .filter((a) => a.status === 'Concluído')
      .reduce((sum, a) => sum + (Number(a.totalPrice) || 0), 0);

    return [
      {
        month: 'Maio',
        shortMonth: 'Mai',
        year: 2026,
        pixRevenue: 0,
        cardRevenue: 0,
        annualRevenue: 0,
        totalGross: 0,
        mpFees: 0,
        infraCost: 0,
        netProfit: 0,
        activePros: 0,
        gmv: 0,
        appointmentsCount: 0,
        growthMoM: 'Desenvolvimento',
      },
      {
        month: 'Junho',
        shortMonth: 'Jun',
        year: 2026,
        pixRevenue: 0,
        cardRevenue: 0,
        annualRevenue: 0,
        totalGross: 0,
        mpFees: 0,
        infraCost: 0,
        netProfit: 0,
        activePros: 0,
        gmv: 0,
        appointmentsCount: 0,
        growthMoM: 'Estruturação',
      },
      {
        month: 'Julho',
        shortMonth: 'Jul',
        year: 2026,
        pixRevenue: 0,
        cardRevenue: 0,
        annualRevenue: 0,
        totalGross: 0,
        mpFees: 0,
        infraCost: 0,
        netProfit: 0,
        activePros: 0,
        gmv: 0,
        appointmentsCount: 0,
        growthMoM: 'Vitrine & Agenda',
      },
      {
        month: 'Agosto',
        shortMonth: 'Ago',
        year: 2026,
        pixRevenue: 0,
        cardRevenue: 0,
        annualRevenue: 0,
        totalGross: 0,
        mpFees: 0,
        infraCost: 0,
        netProfit: 0,
        activePros: 0,
        gmv: 0,
        appointmentsCount: 0,
        growthMoM: 'Testes de Integração',
      },
      {
        month: 'Setembro',
        shortMonth: 'Set',
        year: 2026,
        pixRevenue: 0,
        cardRevenue: 0,
        annualRevenue: 0,
        totalGross: 0,
        mpFees: 0,
        infraCost: 0,
        netProfit: 0,
        activePros: 0,
        gmv: 0,
        appointmentsCount: 0,
        growthMoM: 'Pré-lançamento',
      },
      {
        month: 'Outubro (Atual)',
        shortMonth: 'Out',
        year: 2026,
        pixRevenue: paymentBreakdown.pixRevenue,
        cardRevenue: paymentBreakdown.cardRevenue,
        annualRevenue: paymentBreakdown.annualRevenue,
        totalGross: paymentBreakdown.totalMonthlyGross,
        mpFees: paymentBreakdown.totalMpFees,
        infraCost: paymentBreakdown.infraCosts,
        netProfit: paymentBreakdown.netProfit,
        activePros: couponPros.length + paidPros.length,
        gmv: currentGmv,
        appointmentsCount: allAppointments.length,
        growthMoM: 'Lançamento MVP 🚀',
      },
    ];
  }, [paymentBreakdown, allAppointments, couponPros.length, paidPros.length]);

  const selectedMonth = monthsData[selectedMonthIndex] || monthsData[monthsData.length - 1];

  // Cálculo de faturamento e taxa de sucesso por profissional (estritamente real)
  const proMetricsList = useMemo(() => {
    return proUsers.map((pro) => {
      // 1. Procura agendamentos reais desta profissional
      const proApps = allAppointments.filter((a) => {
        const matchesEmail = a.proEmail && a.proEmail.toLowerCase() === pro.email.toLowerCase();
        const matchesId = a.proId && (a.proId === pro.id || a.proId === pro.key);
        const matchesSlug = a.proSlug && a.proSlug.toLowerCase() === pro.proKey?.toLowerCase();
        const matchesName =
          a.proName &&
          pro.fullName &&
          a.proName.trim().toLowerCase() === pro.fullName.trim().toLowerCase();
        return matchesEmail || matchesId || matchesSlug || matchesName;
      });

      const totalBookings = proApps.length;
      const completedBookings = proApps.filter((a) => a.status === 'Concluído').length;
      const confirmedBookings = proApps.filter((a) => a.status === 'Confirmado').length;
      const cancelledBookings = proApps.filter((a) => a.status === 'Cancelado').length;

      // Faturamento real calculado estritamente a partir dos agendamentos concluídos
      const faturamento = proApps
        .filter((a) => a.status === 'Concluído')
        .reduce((sum, a) => sum + (Number(a.totalPrice) || 0), 0);

      const successRate =
        totalBookings > 0 ? Math.min(100, Math.round((completedBookings / totalBookings) * 100)) : 0;

      const isThaynara =
        pro.fullName.toLowerCase().includes('thaynara') ||
        pro.email.toLowerCase().includes('thaynara');
      const isCoupon = Boolean(pro.appliedCoupon || pro.paymentMethod === 'COUPON' || isThaynara);

      // Forma de pagamento da profissional
      let paymentType: 'CUPOM' | 'PIX_MENSAL' | 'CARTAO_RECORRENTE' | 'ANUAL' | 'TRIAL' = 'TRIAL';
      if (isCoupon) {
        paymentType = 'CUPOM';
      } else if (pro.subscriptionStatus === 'ACTIVE') {
        paymentType =
          pro.paymentMethod === 'PIX'
            ? 'PIX_MENSAL'
            : pro.paymentMethod === 'CARD_RECURRING'
            ? 'CARTAO_RECORRENTE'
            : pro.paymentMethod === 'ANNUAL'
            ? 'ANUAL'
            : 'TRIAL';
      }

      return {
        ...pro,
        faturamento,
        totalBookings,
        completedBookings,
        cancelledBookings,
        confirmedBookings,
        successRate,
        paymentType,
        rating: (pro as any).rating || 5.0,
        reviewsCount: 0,
      };
    });
  }, [proUsers, allAppointments]);

  // Lista filtrada e ordenada
  const filteredPros = useMemo(() => {
    let list = [...proMetricsList];
    if (proSearchQuery.trim()) {
      const q = proSearchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.title || '').toLowerCase().includes(q) ||
          (p.baseCity || '').toLowerCase().includes(q)
      );
    }

    if (proSortBy === 'FATURAMENTO') {
      list.sort((a, b) => b.faturamento - a.faturamento);
    } else if (proSortBy === 'SUCESSO') {
      list.sort((a, b) => b.successRate - a.successRate);
    } else if (proSortBy === 'SERVICOS') {
      list.sort((a, b) => b.completedBookings - a.completedBookings);
    }

    return list;
  }, [proMetricsList, proSearchQuery, proSortBy]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. BANNER DEMONSTRATIVO: O LUCRO DO FUNDADOR (EVERTON) */}
      <div className="relative bg-gradient-to-r from-emerald-950 via-stone-900 to-stone-900 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-7 shadow-xl overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 z-10 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-300 bg-emerald-900/80 px-3 py-1 rounded-full border border-emerald-700/60 shadow-xs">
              <span>💎</span> Demonstrativo Financeiro do Dono da Plataforma
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-purple-300 bg-purple-950 px-3 py-1 rounded-full border border-purple-800/60">
              <span>🎟️</span> 1 Ativa via Cupom (Thaynara Letícia)
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Seu Lucro Líquido Real: <span className="text-emerald-400">R$ {paymentBreakdown.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            Painel 100% zerado e pronto para o MVP: nenhum pagamento monetário processado até agora (apenas testes internos e ativação por cupom de desconto cortesia).
          </p>
        </div>

        <div className="bg-stone-950/85 backdrop-blur-md border border-stone-800 p-4 rounded-2xl flex flex-col gap-2 shrink-0 z-10 w-full sm:w-72 text-xs">
          <div className="flex justify-between items-center text-stone-400">
            <span>(+) Receita de Assinaturas:</span>
            <strong className="text-white font-black">
              R$ {paymentBreakdown.totalMonthlyGross.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="flex justify-between items-center text-stone-400">
            <span>(-) Taxas Mercado Pago:</span>
            <strong className="text-stone-300 font-bold">
              - R$ {paymentBreakdown.totalMpFees.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="flex justify-between items-center text-stone-400">
            <span>(-) Servidores & Nuvem:</span>
            <strong className="text-stone-300 font-bold">R$ 0,00 (Free Tier)</strong>
          </div>
          <div className="pt-2 border-t border-stone-800 flex justify-between items-center text-sm font-black text-emerald-400">
            <span>(=) Assinantes Pagantes:</span>
            <span>{paymentBreakdown.totalPaid} profissionais</span>
          </div>
        </div>

        <div className="absolute -right-8 -bottom-10 opacity-10 text-9xl select-none pointer-events-none">📈</div>
      </div>

      {/* 2. GRÁFICO INTERATIVO DE EVOLUÇÃO DO FATURAMENTO MÊS A MÊS */}
      <div className="bg-stone-900 border-2 border-stone-800 rounded-3xl p-6 sm:p-7 shadow-lg space-y-5">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">📊</span>
              <h3 className="text-base sm:text-lg font-black text-white">
                Evolução do Faturamento Mês a Mês (2026)
              </h3>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Curva real de evolução do faturamento e atendimentos no ano de 2026. Clique no mês para inspecionar.
            </p>
          </div>

          {/* ALTERNÂNCIA SAAS VS GMV */}
          <div className="flex items-center gap-1.5 bg-stone-950 p-1.5 rounded-2xl border border-stone-800 text-xs font-bold">
            <button
              onClick={() => setChartView('SAAS')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                chartView === 'SAAS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              💵 Meu Faturamento SaaS (Everton)
            </button>
            <button
              onClick={() => setChartView('GMV')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                chartView === 'GMV'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              💰 Volume Transacionado (Profissionais)
            </button>
          </div>
        </div>

        {/* LEGENDA DA COMPOSIÇÃO DAS BARRAS */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-stone-950 p-3 rounded-2xl border border-stone-800/80">
          {chartView === 'SAAS' ? (
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-3 h-3 rounded-md bg-emerald-500"></span> PIX Mensal (R$ 44,90)
              </span>
              <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                <span className="w-3 h-3 rounded-md bg-sky-500"></span> Crédito Recorrente (R$ 39,90)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-3 h-3 rounded-md bg-amber-500"></span> Plano Anual (R$ 299)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-rose-400 font-semibold">
              <span className="w-3 h-3 rounded-md bg-rose-500"></span> GMV Transacionado (Volume real de clientes contratando serviços)
            </div>
          )}
          <span className="text-[11px] text-stone-400">
            Status Atual: <strong className="text-emerald-400 font-black">Pré-lançamento MVP (Aguardando primeiras assinaturas pagas)</strong>
          </span>
        </div>

        {/* BARRAS GRÁFICAS */}
        <div className="pt-6 pb-2">
          <div className="h-56 sm:h-64 flex items-end justify-between gap-2 sm:gap-6 px-1 sm:px-4 border-b border-stone-800">
            {monthsData.map((m, idx) => {
              const isSelected = selectedMonthIndex === idx;
              const maxVal =
                chartView === 'SAAS'
                  ? Math.max(100, Math.max(...monthsData.map((x) => x.totalGross)))
                  : Math.max(500, Math.max(...monthsData.map((x) => x.gmv)));
              const currentVal = chartView === 'SAAS' ? m.totalGross : m.gmv;
              const heightPercent =
                currentVal > 0 ? Math.min(100, Math.max(14, Math.round((currentVal / maxVal) * 100))) : 6;

              return (
                <div
                  key={m.month}
                  onClick={() => setSelectedMonthIndex(idx)}
                  className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div
                    className={`w-full flex flex-col justify-end rounded-t-2xl overflow-hidden transition-all duration-300 relative ${
                      isSelected
                        ? 'ring-2 ring-emerald-400 shadow-xl shadow-emerald-950/60 scale-102'
                        : 'group-hover:opacity-90'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  >
                    {/* TOOLTIP FLUTUANTE */}
                    <span
                      className={`absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-black px-2 py-0.5 rounded-lg whitespace-nowrap transition z-20 ${
                        isSelected
                          ? 'bg-emerald-600 text-white opacity-100 shadow-sm'
                          : 'bg-stone-800 text-stone-200 opacity-0 group-hover:opacity-100 border border-stone-700'
                      }`}
                    >
                      {chartView === 'SAAS'
                        ? `R$ ${m.totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `R$ ${m.gmv.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </span>

                    {currentVal === 0 ? (
                      <div className="w-full h-full bg-stone-800/80 border-t border-stone-700/50" />
                    ) : chartView === 'SAAS' ? (
                      <>
                        {m.annualRevenue > 0 && (
                          <div
                            className="bg-amber-500 w-full"
                            style={{ height: `${(m.annualRevenue / m.totalGross) * 100}%` }}
                          />
                        )}
                        {m.cardRevenue > 0 && (
                          <div
                            className="bg-sky-500 w-full"
                            style={{ height: `${(m.cardRevenue / m.totalGross) * 100}%` }}
                          />
                        )}
                        {m.pixRevenue > 0 && (
                          <div
                            className="bg-emerald-500 w-full"
                            style={{ height: `${(m.pixRevenue / m.totalGross) * 100}%` }}
                          />
                        )}
                      </>
                    ) : (
                      <div className="bg-gradient-to-t from-rose-700 to-rose-500 w-full h-full" />
                    )}
                  </div>

                  <div className="text-center">
                    <span
                      className={`text-xs block font-bold transition ${
                        isSelected ? 'text-emerald-300 font-black' : 'text-stone-400 group-hover:text-white'
                      }`}
                    >
                      {m.shortMonth}
                    </span>
                    <span className="text-[10px] text-stone-500 hidden sm:block">
                      {chartView === 'SAAS'
                        ? `R$ ${m.totalGross.toFixed(0)}`
                        : `R$ ${m.gmv.toFixed(0)}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CARD DE DETALHES DO MÊS SELECIONADO */}
        <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
              Mês Selecionado no Gráfico:
            </span>
            <p className="text-sm font-black text-white mt-0.5">
              {selectedMonth.month} {selectedMonth.year} ({selectedMonth.growthMoM})
            </p>
            <p className="text-[11px] text-stone-400">
              Receita Bruta: <strong className="text-white">R$ {selectedMonth.totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> • Lucro Líquido no Bolso:{' '}
              <strong className="text-emerald-400">R$ {selectedMonth.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </p>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-[10px] text-stone-500 block">Profissionais Ativas</span>
              <strong className="text-white text-sm">{selectedMonth.activePros} profissional(is)</strong>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 block">Volume dos Serviços (GMV)</span>
              <strong className="text-emerald-400 text-sm">
                R$ {selectedMonth.gmv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>
        </div>

      </div>

      {/* 3. DETALHAMENTO DA BASE POR FORMA DE PAGAMENTO */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
              <span>💳</span> Composição das Assinaturas ({paymentBreakdown.totalPaid} Pagantes • {paymentBreakdown.couponCount} {paymentBreakdown.couponCount === 1 ? 'Ativa' : 'Ativas'} por Cupom)
            </h3>
            <p className="text-xs text-stone-600 font-medium mt-0.5">
              Detalhamento de receita de assinaturas monetárias e ativações promocionais de boas-vindas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* PIX MENSAL */}
          <div className="bg-stone-900 border border-stone-800 hover:border-emerald-500/60 rounded-3xl p-5 shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-lg font-black">
                  💠
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  0 Assinantes
                </span>
              </div>
              <h4 className="text-sm font-black text-white">PIX Mensal (R$ 44,90/mês)</h4>
              <p className="text-xs text-stone-400 mt-0.5">Pagamento via QR code dinâmico todo mês</p>

              <div className="mt-4 pt-4 border-t border-stone-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Profissionais Pagando:</span>
                  <strong className="text-white text-sm font-black">{paymentBreakdown.pixCount}</strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Faturamento Mensal:</span>
                  <strong className="text-emerald-400 font-extrabold">
                    R$ {paymentBreakdown.pixRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Taxa Mercado Pago (0.99%):</span>
                  <strong className="text-stone-400">- R$ {(paymentBreakdown.pixRevenue * 0.0099).toFixed(2)}</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-800/80 bg-stone-950/60 -mx-5 -mb-5 p-3.5 rounded-b-3xl flex items-center justify-between text-xs">
              <span className="text-stone-400">Lucro Líquido no Caixa:</span>
              <strong className="text-emerald-300 font-black">
                R$ {(paymentBreakdown.pixRevenue * 0.9901).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          {/* CARTÃO RECORRENTE */}
          <div className="bg-stone-900 border border-stone-800 hover:border-sky-500/60 rounded-3xl p-5 shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center text-lg font-black">
                  💳
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-sky-950 text-sky-300 border border-sky-800/60 px-2 py-0.5 rounded-full">
                  0 Assinantes
                </span>
              </div>
              <h4 className="text-sm font-black text-white">Crédito Recorrente (R$ 39,90)</h4>
              <p className="text-xs text-stone-400 mt-0.5">Cobrança automática mensal no cartão</p>

              <div className="mt-4 pt-4 border-t border-stone-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Profissionais Pagando:</span>
                  <strong className="text-white text-sm font-black">{paymentBreakdown.cardCount}</strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Faturamento Mensal:</span>
                  <strong className="text-sky-400 font-extrabold">
                    R$ {paymentBreakdown.cardRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Taxa Mercado Pago (3.99%):</span>
                  <strong className="text-stone-400">- R$ {(paymentBreakdown.cardRevenue * 0.0399).toFixed(2)}</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-800/80 bg-stone-950/60 -mx-5 -mb-5 p-3.5 rounded-b-3xl flex items-center justify-between text-xs">
              <span className="text-stone-400">Lucro Líquido no Caixa:</span>
              <strong className="text-sky-300 font-black">
                R$ {(paymentBreakdown.cardRevenue * 0.9601).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          {/* PLANO ANUAL */}
          <div className="bg-stone-900 border border-stone-800 hover:border-amber-500/60 rounded-3xl p-5 shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-lg font-black">
                  ⭐
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full">
                  0 Assinantes
                </span>
              </div>
              <h4 className="text-sm font-black text-white">Plano Anual (R$ 299/ano)</h4>
              <p className="text-xs text-stone-400 mt-0.5">Pagamento anual à vista (PIX ou até 12x)</p>

              <div className="mt-4 pt-4 border-t border-stone-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Profissionais Pagando:</span>
                  <strong className="text-white text-sm font-black">{paymentBreakdown.annualCount}</strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Receita Entrante no Caixa:</span>
                  <strong className="text-amber-400 font-extrabold">
                    R$ {(paymentBreakdown.annualCount * 299).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Taxa Média Mercado Pago:</span>
                  <strong className="text-stone-400">- R$ {(paymentBreakdown.annualCount * 299 * 0.0299).toFixed(2)}</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-800/80 bg-stone-950/60 -mx-5 -mb-5 p-3.5 rounded-b-3xl flex items-center justify-between text-xs">
              <span className="text-stone-400">Lucro Líquido no Caixa:</span>
              <strong className="text-amber-300 font-black">
                R$ {(paymentBreakdown.annualCount * 299 * 0.9701).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          {/* CUPOM DE PARCERIA / CORTESIA */}
          <div className="bg-stone-900 border border-purple-500/40 hover:border-purple-400 rounded-3xl p-5 shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-lg font-black">
                  🎟️
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800/60 px-2 py-0.5 rounded-full">
                  {paymentBreakdown.couponCount} {paymentBreakdown.couponCount === 1 ? 'Ativa' : 'Ativas'}
                </span>
              </div>
              <h4 className="text-sm font-black text-white">Cupom Cortesia (100% OFF)</h4>
              <p className="text-xs text-stone-400 mt-0.5">Ativação especial por cupom de desconto</p>

              <div className="mt-4 pt-4 border-t border-stone-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">
                    {paymentBreakdown.couponCount === 1 ? 'Profissional Ativada:' : 'Profissionais Ativadas:'}
                  </span>
                  <strong className="text-purple-300 text-xs font-black truncate max-w-[150px] text-right" title={couponPros.map((p) => p.fullName || p.email.split('@')[0]).join(', ') || 'Thaynara Letícia'}>
                    {couponPros.map((p) => p.fullName || p.email.split('@')[0]).join(', ') || 'Thaynara Letícia'}
                  </strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Valor Cobrado:</span>
                  <strong className="text-emerald-400 font-extrabold">R$ 0,00 (Cortesia)</strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Taxa Mercado Pago:</span>
                  <strong className="text-stone-400">R$ 0,00</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-800/80 bg-purple-950/40 -mx-5 -mb-5 p-3.5 rounded-b-3xl flex items-center justify-between text-xs">
              <span className="text-purple-200">Acesso na Plataforma:</span>
              <strong className="text-purple-300 font-black">Vitrine & Agenda Ativas</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3.5 SEÇÃO ESPECIAL: FEEDBACKS DO PILOTO BETA (10 PRIMEIRAS PROFISSIONAIS) */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 p-6 rounded-3xl border border-stone-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <h3 className="text-base sm:text-lg font-black text-white">
                Feedbacks do Piloto Beta ({betaFeedbacks.length} {betaFeedbacks.length === 1 ? 'Resposta' : 'Respostas'})
              </h3>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
                Beta Testers
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Avaliações reais das 10 primeiras maquiadoras e profissionais sobre facilidade de uso e disposição para pagar R$ 39,90/mês
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-stone-950/80 border border-stone-800 px-3.5 py-1.5 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Média de Nota</span>
              <div className="flex items-center gap-1 justify-center">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-black text-white">{feedbackStats.avgRating}</span>
                <span className="text-[10px] text-stone-500">/ 5.0</span>
              </div>
            </div>

            <div className="bg-stone-950/80 border border-stone-800 px-3.5 py-1.5 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Pagariam R$ 39,90</span>
              <span className="text-sm font-black text-emerald-400">{feedbackStats.wouldPayPercent}%</span>
            </div>
          </div>
        </div>

        {betaFeedbacks.length === 0 ? (
          <div className="bg-stone-950/50 border border-dashed border-stone-800 rounded-2xl p-6 text-center text-xs text-stone-500 space-y-1">
            <Sparkles className="w-5 h-5 text-amber-400/60 mx-auto mb-1" />
            <p className="font-bold text-stone-300">Nenhum feedback enviado ainda pelas beta testers</p>
            <p className="text-[11px] text-stone-500">
              As 10 primeiras profissionais podem responder a pesquisa rápida direto pelo botão "Feedback do Beta" no painel delas!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {betaFeedbacks.map((fb) => (
              <div
                key={fb.id}
                className="bg-stone-950/70 border border-stone-800/90 rounded-2xl p-4 space-y-3 hover:border-stone-700 transition"
              >
                <div className="flex items-start justify-between gap-2 border-b border-stone-900 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-rose-600/30 text-rose-300 font-bold flex items-center justify-center text-xs border border-rose-500/30">
                      {fb.proName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white leading-tight">{fb.proName}</h4>
                      <p className="text-[10px] text-stone-400">{fb.proEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < fb.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-stone-700'
                          }`}
                        />
                      ))}
                    </div>
                    {fb.proWhatsapp && (
                      <a
                        href={`https://wa.me/55${fb.proWhatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Conversar com a profissional no WhatsApp"
                        className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-[10px] flex items-center gap-1 border border-emerald-500/30 transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">
                      O que mais gostou:
                    </span>
                    <p className="text-stone-200 mt-0.5 italic text-[11px] bg-stone-900/60 p-2 rounded-xl border border-stone-850">
                      "{fb.likedMost || 'Nenhum comentário adicional'}"
                    </p>
                  </div>

                  {fb.missingOrHard && (
                    <div>
                      <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">
                        O que sentiu falta / dificuldade:
                      </span>
                      <p className="text-stone-300 mt-0.5 text-[11px] bg-stone-900/60 p-2 rounded-xl border border-stone-850">
                        "{fb.missingOrHard}"
                      </p>
                    </div>
                  )}

                  {fb.additionalComments && (
                    <div>
                      <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider block">
                        Recado / Sugestão:
                      </span>
                      <p className="text-stone-300 mt-0.5 text-[11px] bg-stone-900/60 p-2 rounded-xl border border-stone-850">
                        "{fb.additionalComments}"
                      </p>
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-stone-400">Disposição para pagar R$ 39,90:</span>
                    <span
                      className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                        fb.willingnessToPay === 'YES'
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                          : fb.willingnessToPay === 'MAYBE'
                          ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {fb.willingnessToPay === 'YES'
                        ? 'Sim, com certeza!'
                        : fb.willingnessToPay === 'MAYBE'
                        ? 'Talvez / Depende'
                        : 'Não no momento'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. TABELA DE AUDITORIA: FATURAMENTO & TAXA DE SUCESSO DAS PROFISSIONAIS */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900 p-5 rounded-3xl border border-stone-800">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>👩‍🎨</span> Faturamento & Taxa de Sucesso Individual das Profissionais
            </h3>
            <p className="text-xs text-stone-400">
              Veja exatamente quanto cada parceira faturou, serviços realizados de fato e conversão de clientes fechadas
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={proSearchQuery}
                onChange={(e) => setProSearchQuery(e.target.value)}
                placeholder="Buscar por nome, nicho..."
                className="bg-stone-950 border border-stone-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <select
              value={proSortBy}
              onChange={(e) => setProSortBy(e.target.value as any)}
              className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-bold text-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="FATURAMENTO">Maior Faturamento</option>
              <option value="SUCESSO">Maior Taxa de Sucesso</option>
              <option value="SERVICOS">Mais Serviços Realizados</option>
            </select>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950/80 border-b border-stone-800 text-[10px] uppercase font-black tracking-wider text-stone-400">
                <tr>
                  <th className="py-3.5 px-4">Profissional / Vitrine</th>
                  <th className="py-3.5 px-4 text-right">Faturamento Bruto</th>
                  <th className="py-3.5 px-4 text-center">Serviços Realizados de Fato</th>
                  <th className="py-3.5 px-4 text-center">Taxa de Sucesso</th>
                  <th className="py-3.5 px-4">Plano do Belladoor</th>
                  <th className="py-3.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80">
                {filteredPros.slice(0, 10).map((pro) => (
                  <tr key={pro.key} className="hover:bg-stone-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={pro.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80'}
                          alt={pro.fullName}
                          className="w-10 h-10 rounded-xl object-cover border border-rose-500/40"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-extrabold text-white text-xs">{pro.fullName}</p>
                            {pro.title && (
                              <span className="text-[9px] bg-rose-900/60 text-rose-300 px-1.5 py-0.2 rounded font-bold">
                                {pro.title}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-stone-400">
                            {pro.baseNeighborhood || 'São Paulo'} • ⭐ {pro.rating.toFixed(1)} ({pro.reviewsCount})
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <p className="font-black text-sm text-emerald-400">
                        R$ {pro.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        Ticket médio: {pro.completedBookings > 0 ? `R$ ${(pro.faturamento / pro.completedBookings).toFixed(0)}` : 'R$ 0,00'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-black text-xs text-white">
                          {pro.completedBookings} concluídos
                        </span>
                        <span className="text-[10px] text-stone-400">
                          de {pro.totalBookings} agendados ({pro.cancelledBookings} cancelados)
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {pro.totalBookings > 0 ? (
                        <>
                          <div className="inline-flex items-center gap-1.5 bg-emerald-950 border border-emerald-800 px-2.5 py-1 rounded-xl">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <strong className="text-emerald-300 font-black">
                              {pro.successRate.toFixed(1)}%
                            </strong>
                          </div>
                          <p className="text-[9px] text-stone-500 mt-0.5">Taxa de conversão</p>
                        </>
                      ) : (
                        <span className="text-[11px] text-stone-500 font-bold">Sem agendamentos</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {pro.paymentType === 'CUPOM' ? (
                        <span className="bg-purple-950 text-purple-300 border border-purple-800/80 px-2 py-0.5 rounded-lg text-[10px] font-black inline-flex items-center gap-1">
                          🎟️ Cupom Ativo (100% Cortesia)
                        </span>
                      ) : pro.paymentType === 'PIX_MENSAL' ? (
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded-lg text-[10px] font-black">
                          💠 PIX Mensal (R$ 44,90)
                        </span>
                      ) : pro.paymentType === 'CARTAO_RECORRENTE' ? (
                        <span className="bg-sky-950 text-sky-300 border border-sky-800/80 px-2 py-0.5 rounded-lg text-[10px] font-black">
                          💳 Cartão Recorrente (R$ 39,90)
                        </span>
                      ) : pro.paymentType === 'ANUAL' ? (
                        <span className="bg-amber-950 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded-lg text-[10px] font-black">
                          ⭐ Plano Anual (R$ 299)
                        </span>
                      ) : (
                        <span className="bg-stone-800 text-stone-300 border border-stone-700 px-2 py-0.5 rounded-lg text-[10px] font-black">
                          ⏳ Teste ({pro.trialDaysLeft ?? 7} dias restantes)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setInspectingPro(pro)}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-rose-300 rounded-xl text-[11px] font-bold transition cursor-pointer"
                      >
                        Ver Extrato ➔
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DE EXTRATO DETALHADO DA PROFISSIONAL */}
      {inspectingPro && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 w-full max-w-xl rounded-3xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={inspectingPro.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80'}
                  alt={inspectingPro.fullName}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-rose-500"
                />
                <div>
                  <h3 className="text-base font-black text-white">{inspectingPro.fullName}</h3>
                  <p className="text-xs text-rose-400 font-bold">{inspectingPro.title || 'Profissional Belladoor'}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingPro(null)}
                className="p-2 text-stone-400 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800">
                <span className="text-[10px] text-stone-400 font-bold uppercase">Faturamento Bruto</span>
                <p className="text-base font-black text-emerald-400 mt-0.5">
                  R$ {inspectingPro.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800">
                <span className="text-[10px] text-stone-400 font-bold uppercase">Realizados de Fato</span>
                <p className="text-base font-black text-white mt-0.5">
                  {inspectingPro.completedBookings} de {inspectingPro.totalBookings}
                </p>
              </div>
              <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800">
                <span className="text-[10px] text-stone-400 font-bold uppercase">Taxa de Sucesso</span>
                <p className="text-base font-black text-sky-400 mt-0.5">
                  {inspectingPro.successRate.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-400">Cidade / Bairro:</span>
                <span className="text-stone-200">{inspectingPro.baseNeighborhood || 'Centro'} - {inspectingPro.baseCity || 'São Paulo'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Cancelamentos Registrados:</span>
                <span className="text-red-400 font-bold">{inspectingPro.cancelledBookings} cancelados</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Modalidade de Assinatura:</span>
                <span className="text-purple-300 font-bold">
                  {inspectingPro.paymentType === 'CUPOM'
                    ? '🎟️ Ativa por Cupom VIP (100% Cortesia)'
                    : inspectingPro.paymentType === 'PIX_MENSAL'
                    ? '💠 PIX Mensal (R$ 44,90)'
                    : inspectingPro.paymentType === 'CARTAO_RECORRENTE'
                    ? '💳 Crédito Recorrente (R$ 39,90)'
                    : inspectingPro.paymentType === 'ANUAL'
                    ? '⭐ Plano Anual (R$ 299)'
                    : '⏳ Período de Teste Grátis (7 dias)'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  if (onQuickGrantDays) onQuickGrantDays(inspectingPro, 30);
                  setInspectingPro(null);
                }}
                className="flex-1 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-black transition cursor-pointer"
              >
                🎁 Conceder +30 Dias VIP
              </button>
              <button
                onClick={() => {
                  if (onOpenWhatsApp) onOpenWhatsApp(inspectingPro);
                  else window.open(`https://wa.me/${inspectingPro.whatsapp || ''}`, '_blank');
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>💬</span> Chamar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

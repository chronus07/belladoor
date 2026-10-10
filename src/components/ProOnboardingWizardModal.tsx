import React, { useState } from 'react';
import {
  Sparkles,
  Camera,
  Upload,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Instagram,
  MessageCircle,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  X,
  Image,
  Navigation,
} from 'lucide-react';
import { MockService, MockNeighborhood } from '../data/mockData';

interface ProOnboardingWizardModalProps {
  isOpen: boolean;
  step: 1 | 2 | 3 | 4;
  activationBadge?: string | null;
  onSelectStep: (step: 1 | 2 | 3 | 4) => void;
  onSkip: () => void;
  onFinish: () => void;

  // Passo 1: Vitrine & Foto de Perfil
  proDisplayName: string;
  setProDisplayName: (val: string) => void;
  proDisplayTitle: string;
  setProDisplayTitle: (val: string) => void;
  proInstagram: string;
  setProInstagram: (val: string) => void;
  proWhatsapp: string;
  setProWhatsapp: (val: string) => void;
  proDisplayBio: string;
  setProDisplayBio: (val: string) => void;
  proAvatarUrl: string;
  proCoverUrl: string;
  setProCoverUrl: (val: string) => void;
  onAvatarFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCoverFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Passo 2: Portfólios
  proPortfolioList: { url: string; title: string }[];
  setProPortfolioList: (list: { url: string; title: string }[]) => void;
  compressImageFile: (file: File, maxWidth?: number, quality?: number) => Promise<string>;

  // Passo 3: Serviços e Valores
  proServicesList: MockService[];
  setProServicesList: (list: MockService[]) => void;

  // Passo 4: Base, Localidades e Taxas de Deslocamento
  proBaseCep: string;
  onBaseCepLookup: (val: string) => void;
  baseCepLoading: boolean;
  baseCepError: string | null;
  proBaseCity: string;
  setProBaseCity: (val: string) => void;
  proBaseNeighborhood: string;
  setProBaseNeighborhood: (val: string) => void;
  proBaseAddress: string;
  setProBaseAddress: (val: string) => void;
  bufferMinutes: number;
  setBufferMinutes: (val: number) => void;
  proNeighborhoodsList: MockNeighborhood[];
  setProNeighborhoodsList: (list: MockNeighborhood[]) => void;
  dynamicCitySuggestions: string[];
}

export const ProOnboardingWizardModal: React.FC<ProOnboardingWizardModalProps> = ({
  isOpen,
  step,
  activationBadge,
  onSelectStep,
  onSkip,
  onFinish,
  proDisplayName,
  setProDisplayName,
  proDisplayTitle,
  setProDisplayTitle,
  proInstagram,
  setProInstagram,
  proWhatsapp,
  setProWhatsapp,
  proDisplayBio,
  setProDisplayBio,
  proAvatarUrl,
  proCoverUrl,
  setProCoverUrl,
  onAvatarFileUpload,
  onCoverFileUpload,
  proPortfolioList,
  setProPortfolioList,
  compressImageFile,
  proServicesList,
  setProServicesList,
  proBaseCep,
  onBaseCepLookup,
  baseCepLoading,
  baseCepError,
  proBaseCity,
  setProBaseCity,
  proBaseNeighborhood,
  setProBaseNeighborhood,
  proBaseAddress,
  setProBaseAddress,
  bufferMinutes,
  setBufferMinutes,
  proNeighborhoodsList,
  setProNeighborhoodsList,
  dynamicCitySuggestions,
}) => {
  // Estados internos de feedback rápido dentro da janela do assistente
  const [wizardNotice, setWizardNotice] = useState<string | null>(null);

  // Estados internos do Passo 2 (Adicionar/Editar Portfólio dentro da janela)
  const [newPortfolioUrl, setNewPortfolioUrl] = useState<string>('');
  const [newPortfolioTitle, setNewPortfolioTitle] = useState<string>('');
  const [editingPortfolioIdx, setEditingPortfolioIdx] = useState<number | null>(null);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  // Estados internos do Passo 3 (Adicionar/Editar Serviço dentro da janela)
  const [editingSrvId, setEditingSrvId] = useState<string | null>(null);
  const [srvName, setSrvName] = useState<string>('');
  const [srvPrice, setSrvPrice] = useState<string>('120');
  const [srvDuration, setSrvDuration] = useState<number>(60);
  const [srvDesc, setSrvDesc] = useState<string>(
    'Atendimento completo a domicílio com materiais profissionais esterilizados.'
  );
  const [srvPopular, setSrvPopular] = useState<boolean>(false);
  const [srvError, setSrvError] = useState<string | null>(null);

  // Estados internos do Passo 4 (Adicionar/Editar Região e Taxa dentro da janela)
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [areaName, setAreaName] = useState<string>('');
  const [areaCity, setAreaCity] = useState<string>('');
  const [areaFee, setAreaFee] = useState<string>('15');
  const [areaIsFree, setAreaIsFree] = useState<boolean>(false);
  const [areaError, setAreaError] = useState<string | null>(null);

  if (!isOpen) return null;

  const showNotice = (msg: string) => {
    setWizardNotice(msg);
    setTimeout(() => {
      setWizardNotice((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Handlers internos do Passo 2 (Portfólio)
  const handleWizardPortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImageFile(file, 900, 0.82);
    if (dataUrl) {
      setNewPortfolioUrl(dataUrl);
      setPortfolioError(null);
      if (!newPortfolioTitle.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setNewPortfolioTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleSavePortfolioItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolioUrl.trim()) {
      setPortfolioError('Selecione uma foto do seu celular ou computador primeiro.');
      return;
    }
    if (!newPortfolioTitle.trim()) {
      setPortfolioError('Digite uma legenda ou nome do procedimento realizado.');
      return;
    }

    if (editingPortfolioIdx !== null) {
      const updated = proPortfolioList.map((item, idx) =>
        idx === editingPortfolioIdx
          ? { url: newPortfolioUrl.trim(), title: newPortfolioTitle.trim() }
          : item
      );
      setProPortfolioList(updated);
      showNotice(`✅ Foto "${newPortfolioTitle.trim()}" atualizada no portfólio!`);
    } else {
      setProPortfolioList([
        { url: newPortfolioUrl.trim(), title: newPortfolioTitle.trim() },
        ...proPortfolioList,
      ]);
      showNotice(`📸 Foto "${newPortfolioTitle.trim()}" adicionada ao portfólio!`);
    }

    setNewPortfolioUrl('');
    setNewPortfolioTitle('');
    setEditingPortfolioIdx(null);
    setPortfolioError(null);
  };

  // Handlers internos do Passo 3 (Serviços)
  const handleSaveServiceItem = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = Number(String(srvPrice).replace(',', '.'));
    if (!srvName.trim()) {
      setSrvError('Informe o nome do serviço.');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setSrvError('Informe um valor válido em R$.');
      return;
    }
    if (!srvDuration || srvDuration < 10) {
      setSrvError('A duração mínima é de 10 minutos.');
      return;
    }

    if (editingSrvId) {
      setProServicesList(
        proServicesList.map((s) =>
          s.id === editingSrvId
            ? {
                ...s,
                name: srvName.trim(),
                price: parsedPrice,
                durationMinutes: Number(srvDuration),
                description: srvDesc.trim() || s.description,
                popular: srvPopular,
              }
            : s
        )
      );
      showNotice(`✅ Serviço "${srvName.trim()}" atualizado!`);
    } else {
      const newSrv: MockService = {
        id: `srv-${Date.now()}`,
        name: srvName.trim(),
        price: parsedPrice,
        durationMinutes: Number(srvDuration),
        description: srvDesc.trim() || 'Atendimento personalizado a domicílio.',
        popular: srvPopular,
      };
      setProServicesList([newSrv, ...proServicesList]);
      showNotice(`💅 Serviço "${newSrv.name}" cadastrado com sucesso!`);
    }

    setEditingSrvId(null);
    setSrvName('');
    setSrvPrice('120');
    setSrvDuration(60);
    setSrvPopular(false);
    setSrvError(null);
  };

  // Handlers internos do Passo 4 (Regiões e Taxas)
  const handleSaveAreaItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName.trim()) {
      setAreaError('Informe o nome do bairro ou localidade que você atende.');
      return;
    }
    const parsedFee = areaIsFree ? 0 : Math.max(0, Number(String(areaFee).replace(',', '.')) || 0);
    const resolvedCity = areaCity.trim() || proBaseCity.trim();

    if (resolvedCity && !proBaseCity.trim()) {
      setProBaseCity(resolvedCity);
    }

    if (editingAreaId) {
      setProNeighborhoodsList(
        proNeighborhoodsList.map((n) =>
          n.id === editingAreaId
            ? {
                ...n,
                name: areaName.trim(),
                travelFee: parsedFee,
                city: resolvedCity || n.city,
              }
            : n
        )
      );
      showNotice(`✅ Localidade "${areaName.trim()}" atualizada!`);
    } else {
      const newArea: MockNeighborhood = {
        id: `b-${Date.now()}`,
        name: areaName.trim(),
        travelFee: parsedFee,
        city: resolvedCity || undefined,
      };
      setProNeighborhoodsList([...proNeighborhoodsList, newArea]);
      showNotice(
        `🚗 Localidade "${newArea.name}" adicionada (${
          parsedFee === 0 ? 'Deslocamento Grátis' : `Taxa R$ ${parsedFee.toFixed(2).replace('.', ',')}`
        })!`
      );
    }

    setEditingAreaId(null);
    setAreaName('');
    setAreaFee('15');
    setAreaIsFree(false);
    setAreaError(null);
  };

  return (
    <div className="fixed inset-0 z-[75] bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* ==================================================================== */}
        {/* CABEÇALHO FIXO DA JANELA DO ASSISTENTE                               */}
        {/* ==================================================================== */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-rose-950 text-white p-4 sm:p-5 shrink-0 border-b border-stone-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-rose-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                  <Sparkles className="w-3 h-3" />
                  Assistente de Configuração • Passo {step} de 4
                </span>
                {activationBadge && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    {activationBadge}
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-extrabold text-white mt-1.5 leading-snug">
                {step === 1 && '1. Configure sua Vitrine e Foto de Perfil'}
                {step === 2 && '2. Adicione as Fotos do seu Portfólio'}
                {step === 3 && '3. Cadastre seus Serviços e Valores'}
                {step === 4 && '4. Defina sua Base e Taxas de Deslocamento'}
              </h2>
              <p className="text-[11px] text-stone-300 mt-0.5">
                {step === 1 &&
                  'Preencha seus dados de apresentação, @Instagram, WhatsApp e escolha sua foto de perfil e capa.'}
                {step === 2 &&
                  'Envie fotos reais dos seus trabalhos realizados para atrair novos clientes.'}
                {step === 3 &&
                  'Cadastre os serviços que você realiza, valores (R$) e tempo de duração.'}
                {step === 4 &&
                  'Informe seu endereço base e cadastre os bairros que você atende com suas taxas de deslocamento.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onSkip}
              title="Pular e configurar depois"
              className="text-[11px] font-bold text-stone-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1"
            >
              <span>Pular e fazer depois</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Barra de Progresso Interativa (Passos 1 a 4) */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-4">
            {[
              { s: 1 as const, label: '1. Vitrine & Foto' },
              { s: 2 as const, label: '2. Portfólios' },
              { s: 3 as const, label: '3. Serviços' },
              { s: 4 as const, label: '4. Base & Taxas' },
            ].map((item) => {
              const isCurrent = step === item.s;
              const isDone = step > item.s;
              return (
                <button
                  key={item.s}
                  type="button"
                  onClick={() => onSelectStep(item.s)}
                  className={`py-2 px-2 rounded-xl text-left border transition cursor-pointer flex items-center justify-between gap-1 ${
                    isCurrent
                      ? 'bg-rose-600 text-white border-rose-500 shadow-sm font-extrabold'
                      : isDone
                      ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 hover:bg-emerald-500/30 font-bold'
                      : 'bg-white/5 text-stone-400 border-white/10 hover:bg-white/10 font-semibold'
                  }`}
                >
                  <span className="text-[10px] sm:text-[11px] truncate">{item.label}</span>
                  {isDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* CORPO ROLÁVEL DA JANELA DO ASSISTENTE                                */}
        {/* ==================================================================== */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-stone-50">
          {wizardNotice && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{wizardNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setWizardNotice(null)}
                className="text-emerald-700 hover:text-emerald-900 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ================================================================== */}
          {/* PASSO 1: VITRINE & FOTO DE PERFIL                                  */}
          {/* ================================================================== */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Card de Foto de Perfil e Capa */}
              <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-stone-800 flex items-center gap-1.5">
                    <Image className="w-4 h-4 text-rose-600" />
                    Foto de Perfil & Imagem de Capa da Vitrine
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Salvo automaticamente
                  </span>
                </div>

                <div className="relative h-32 sm:h-36 bg-rose-950">
                  <img
                    src={proCoverUrl}
                    alt="Capa da Vitrine"
                    className="w-full h-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/30" />

                  <div className="absolute top-3 right-3">
                    <label className="bg-white/95 hover:bg-white text-stone-900 font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5 text-rose-600" />
                      Trocar Capa
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          onCoverFileUpload(e);
                          showNotice('🖼️ Imagem de capa atualizada!');
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-3 relative bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative shrink-0 -mt-11">
                        <img
                          src={proAvatarUrl}
                          alt={proDisplayName || 'Profissional'}
                          className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-stone-100"
                        />
                        <label
                          title="Enviar foto de perfil"
                          className="absolute -bottom-1 -right-1 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-xl border-2 border-white shadow-md cursor-pointer transition flex items-center justify-center"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              onAvatarFileUpload(e);
                              showNotice('📷 Foto de perfil atualizada!');
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm text-stone-900 leading-snug break-words">
                          {proDisplayName || 'Seu Nome Profissional'}
                        </h4>
                        <p className="text-xs text-rose-600 font-semibold mt-0.5">
                          {proDisplayTitle || 'Sua Especialidade em Destaque'}
                        </p>
                      </div>
                    </div>

                    <label className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs shrink-0">
                      <Camera className="w-3.5 h-3.5" />
                      Atualizar Foto de Perfil
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          onAvatarFileUpload(e);
                          showNotice('📷 Foto de perfil atualizada!');
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Temas rápidos de capa */}
                  <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-stone-500">
                      Sugestões rápidas de capa:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        {
                          label: '💅 Estúdio Rose',
                          url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
                        },
                        {
                          label: '✨ Spa Clean',
                          url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1000&q=80',
                        },
                        {
                          label: '💄 Make & Glow',
                          url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1000&q=80',
                        },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setProCoverUrl(preset.url);
                            showNotice(`🖼️ Capa "${preset.label}" aplicada!`);
                          }}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                            proCoverUrl === preset.url
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card de Informações da Vitrine */}
              <div className="bg-white rounded-3xl border border-stone-200 p-4 space-y-3.5 shadow-xs">
                <h4 className="font-extrabold text-xs text-stone-900 flex items-center gap-1.5 border-b border-stone-100 pb-2">
                  <Pencil className="w-3.5 h-3.5 text-rose-600" />
                  Dados de Apresentação na Vitrine
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Seu Nome Profissional
                    </label>
                    <input
                      type="text"
                      value={proDisplayName}
                      onChange={(e) => setProDisplayName(e.target.value)}
                      placeholder="Ex: Camila Martins"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Especialidade em Destaque
                    </label>
                    <input
                      type="text"
                      value={proDisplayTitle}
                      onChange={(e) => setProDisplayTitle(e.target.value)}
                      placeholder="Ex: Nail Designer & Spa dos Pés"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
                      <Instagram className="w-3.5 h-3.5 text-pink-600" />
                      Arroba do Instagram (@)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-extrabold text-pink-600 select-none">
                        @
                      </span>
                      <input
                        type="text"
                        value={proInstagram.replace(/^@+/, '')}
                        onChange={(e) => setProInstagram(e.target.value.replace(/^@+/, ''))}
                        placeholder="seu.instagram"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-7 pr-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Seu WhatsApp de Atendimento
                    </label>
                    <div className="relative flex items-center">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 absolute left-3" />
                      <input
                        type="tel"
                        value={proWhatsapp}
                        onChange={(e) => setProWhatsapp(e.target.value)}
                        placeholder="(11) 99999-8888"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Bio / Descrição do seu Atendimento
                  </label>
                  <textarea
                    rows={3}
                    value={proDisplayBio}
                    onChange={(e) => setProDisplayBio(e.target.value)}
                    placeholder="Apresente seu trabalho, anos de experiência, cuidados de biossegurança e marcas que utiliza..."
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* PASSO 2: PORTFÓLIOS (FOTOS DOS TRABALHOS REALIZADOS)               */}
          {/* ================================================================== */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Formulário para Adicionar / Editar Foto no Portfólio */}
              <form
                onSubmit={handleSavePortfolioItem}
                className="bg-white rounded-3xl border border-stone-200 p-4 space-y-3.5 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <h4 className="font-extrabold text-xs text-stone-900 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-rose-600" />
                    {editingPortfolioIdx !== null
                      ? 'Editando Foto do Portfólio'
                      : 'Adicionar Foto de Trabalho ao Portfólio'}
                  </h4>
                  {editingPortfolioIdx !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPortfolioIdx(null);
                        setNewPortfolioUrl('');
                        setNewPortfolioTitle('');
                        setPortfolioError(null);
                      }}
                      className="text-[11px] font-bold text-stone-500 hover:text-stone-800 cursor-pointer"
                    >
                      Cancelar edição
                    </button>
                  )}
                </div>

                {portfolioError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs font-bold">
                    {portfolioError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div>
                    {newPortfolioUrl ? (
                      <div className="relative rounded-2xl overflow-hidden border border-stone-200 aspect-square bg-stone-100">
                        <img
                          src={newPortfolioUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <label className="absolute bottom-2 right-2 bg-stone-900/85 hover:bg-stone-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer">
                          Trocar Foto
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleWizardPortfolioUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-rose-300 bg-rose-50/50 hover:bg-rose-50 rounded-2xl aspect-square flex flex-col items-center justify-center p-4 text-center cursor-pointer transition">
                        <Upload className="w-6 h-6 text-rose-600 mb-1.5" />
                        <span className="text-xs font-extrabold text-rose-700">
                          Escolher Foto
                        </span>
                        <span className="text-[10px] text-stone-500 mt-0.5">
                          Celular ou Computador
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleWizardPortfolioUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div className="sm:col-span-2 space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Legenda / Nome do Procedimento na Foto
                      </label>
                      <input
                        type="text"
                        value={newPortfolioTitle}
                        onChange={(e) => setNewPortfolioTitle(e.target.value)}
                        placeholder="Ex: Alongamento em Fibra de Vidro Natural"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Alongamento em Fibra',
                        'Blindagem + Esmaltação em Gel',
                        'Spa dos Pés Completo',
                        'Maquiagem Social Glow',
                        'Design de Sobrancelhas',
                      ].map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setNewPortfolioTitle(sug)}
                          className="text-[10px] font-semibold bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-600 px-2 py-1 rounded-lg border border-stone-200 transition cursor-pointer"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      {editingPortfolioIdx !== null
                        ? 'Salvar Alterações da Foto'
                        : 'Publicar Foto no Portfólio'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Galeria de Fotos Já Adicionadas */}
              <div className="bg-white rounded-3xl border border-stone-200 p-4 space-y-3 shadow-xs">
                <h4 className="font-extrabold text-xs text-stone-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-rose-600" />
                    Fotos Publicadas no seu Portfólio ({proPortfolioList.length})
                  </span>
                </h4>

                {proPortfolioList.length === 0 ? (
                  <p className="text-xs text-stone-500 text-center py-6 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                    Nenhuma foto adicionada ainda. Envie fotos acima ou avance para configurar depois!
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {proPortfolioList.map((item, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-2xl overflow-hidden border border-stone-200 aspect-square bg-stone-100"
                      >
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent p-2.5 flex flex-col justify-between">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPortfolioIdx(idx);
                                setNewPortfolioUrl(item.url);
                                setNewPortfolioTitle(item.title);
                              }}
                              className="p-1.5 bg-white/90 hover:bg-white text-stone-800 rounded-lg shadow-xs cursor-pointer"
                            >
                              <Pencil className="w-3 h-3 text-rose-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setProPortfolioList(proPortfolioList.filter((_, i) => i !== idx));
                                showNotice(`🗑️ Foto "${item.title}" removida.`);
                              }}
                              className="p-1.5 bg-white/90 hover:bg-red-50 text-red-600 rounded-lg shadow-xs cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-[11px] font-bold text-white leading-tight line-clamp-2">
                            {item.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* PASSO 3: SERVIÇOS E VALORES                                        */}
          {/* ================================================================== */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Formulário para Cadastrar / Editar Serviço */}
              <form
                onSubmit={handleSaveServiceItem}
                className="bg-white rounded-3xl border border-stone-200 p-4 space-y-3.5 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <h4 className="font-extrabold text-xs text-stone-900 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-rose-600" />
                    {editingSrvId ? 'Editando Serviço' : 'Cadastrar Novo Serviço e Valor'}
                  </h4>
                  {editingSrvId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSrvId(null);
                        setSrvName('');
                        setSrvPrice('120');
                        setSrvDuration(60);
                        setSrvPopular(false);
                        setSrvError(null);
                      }}
                      className="text-[11px] font-bold text-stone-500 hover:text-stone-800 cursor-pointer"
                    >
                      Cancelar edição
                    </button>
                  )}
                </div>

                {srvError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs font-bold">
                    {srvError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Nome do Serviço / Procedimento
                    </label>
                    <input
                      type="text"
                      value={srvName}
                      onChange={(e) => setSrvName(e.target.value)}
                      placeholder="Ex: Pé e Mão Tradicional + Spa dos Pés"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Valor (R$)
                      </label>
                      <div className="relative flex items-center">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5" />
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          value={srvPrice}
                          onChange={(e) => setSrvPrice(e.target.value)}
                          placeholder="120"
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-7 pr-2 py-2 text-xs font-extrabold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Duração (min)
                      </label>
                      <div className="relative flex items-center">
                        <Clock className="w-3.5 h-3.5 text-rose-600 absolute left-2.5" />
                        <input
                          type="number"
                          step="5"
                          min="10"
                          value={srvDuration}
                          onChange={(e) => setSrvDuration(Number(e.target.value))}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-7 pr-2 py-2 text-xs font-extrabold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Descrição / O que está incluso no atendimento
                  </label>
                  <input
                    type="text"
                    value={srvDesc}
                    onChange={(e) => setSrvDesc(e.target.value)}
                    placeholder="Ex: Cutilagem funda, esmaltação importada e hidratação com parafina..."
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={srvPopular}
                      onChange={(e) => setSrvPopular(e.target.checked)}
                      className="rounded border-stone-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span>Destacar como "🔥 Mais Pedido" na Vitrine</span>
                  </label>

                  <button
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {editingSrvId ? 'Salvar Alterações do Serviço' : 'Adicionar Serviço'}
                  </button>
                </div>
              </form>

              {/* Lista de Serviços Cadastrados */}
              <div className="bg-white rounded-3xl border border-stone-200 p-4 space-y-3 shadow-xs">
                <h4 className="font-extrabold text-xs text-stone-900 flex items-center justify-between">
                  <span>Serviços Cadastrados ({proServicesList.length})</span>
                </h4>

                {proServicesList.length === 0 ? (
                  <p className="text-xs text-stone-500 text-center py-6 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                    Nenhum serviço cadastrado ainda. Utilize o formulário acima para adicionar seus procedimentos!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {proServicesList.map((srv) => (
                      <div
                        key={srv.id}
                        className="p-3 rounded-2xl border border-stone-200 bg-stone-50/70 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-extrabold text-stone-900">
                              {srv.name}
                            </span>
                            {srv.popular && (
                              <span className="text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                🔥 Mais Pedido
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                            {srv.description}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-[11px] font-bold">
                            <span className="text-emerald-700">
                              R$ {srv.price.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-stone-500">⏱️ {srv.durationMinutes} min</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSrvId(srv.id);
                              setSrvName(srv.name);
                              setSrvPrice(String(srv.price));
                              setSrvDuration(srv.durationMinutes);
                              setSrvDesc(srv.description);
                              setSrvPopular(Boolean(srv.popular));
                            }}
                            className="p-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl cursor-pointer"
                            title="Editar serviço"
                          >
                            <Pencil className="w-3.5 h-3.5 text-rose-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setProServicesList(proServicesList.filter((s) => s.id !== srv.id));
                              showNotice(`🗑️ Serviço "${srv.name}" removido.`);
                            }}
                            className="p-2 bg-white hover:bg-red-50 text-red-600 border border-stone-200 rounded-xl cursor-pointer"
                            title="Excluir serviço"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* PASSO 4: BASE, LOCALIDADES QUE ATENDE E TAXAS DE DESLOCAMENTO      */}
          {/* ================================================================== */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Bloco 1: Base de Saída da Profissional */}
              <div className="bg-white rounded-3xl border border-stone-200 p-4 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <h4 className="font-extrabold text-xs text-stone-900 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-rose-600" />
                    Sua Base de Saída (Onde Você Mora / Sai para Atender)
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Busca Automática por CEP
                  </span>
                </div>

                {baseCepError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs font-bold">
                    {baseCepError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Seu CEP Base
                    </label>
                    <input
                      type="text"
                      value={proBaseCep}
                      onChange={(e) => onBaseCepLookup(e.target.value)}
                      placeholder="00000-000"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-extrabold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                    />
                    {baseCepLoading && (
                      <p className="text-[10px] text-rose-600 font-bold mt-1">
                        Buscando endereço do CEP...
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Cidade - UF Base
                    </label>
                    <input
                      type="text"
                      value={proBaseCity}
                      onChange={(e) => setProBaseCity(e.target.value)}
                      placeholder="Ex: São Paulo-SP"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Seu Bairro Base
                    </label>
                    <input
                      type="text"
                      value={proBaseNeighborhood}
                      onChange={(e) => setProBaseNeighborhood(e.target.value)}
                      placeholder="Ex: Moema"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Rua / Referência da Base
                    </label>
                    <input
                      type="text"
                      value={proBaseAddress}
                      onChange={(e) => setProBaseAddress(e.target.value)}
                      placeholder="Ex: Av. Ibirapuera (Apenas referência interna)"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Intervalo de Deslocamento entre Clientes
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[15, 30, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setBufferMinutes(mins)}
                          className={`py-2 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                            bufferMinutes === mins
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {mins} min
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloco 2: Cadastrar Localidades / Bairros e Taxas de Deslocamento */}
              <form
                onSubmit={handleSaveAreaItem}
                className="bg-white rounded-3xl border border-stone-200 p-4 space-y-3.5 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <h4 className="font-extrabold text-xs text-stone-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    {editingAreaId
                      ? 'Editando Localidade e Taxa'
                      : 'Adicionar Bairro / Localidade Atendida e Taxa de Deslocamento'}
                  </h4>
                  {editingAreaId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAreaId(null);
                        setAreaName('');
                        setAreaFee('15');
                        setAreaIsFree(false);
                        setAreaError(null);
                      }}
                      className="text-[11px] font-bold text-stone-500 hover:text-stone-800 cursor-pointer"
                    >
                      Cancelar edição
                    </button>
                  )}
                </div>

                {areaError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs font-bold">
                    {areaError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Bairro ou Região Atendida
                    </label>
                    <input
                      type="text"
                      value={areaName}
                      onChange={(e) => setAreaName(e.target.value)}
                      placeholder="Ex: Centro, Jardins, Vila Mariana..."
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Cidade - UF
                    </label>
                    <input
                      type="text"
                      value={areaCity || proBaseCity}
                      onChange={(e) => setAreaCity(e.target.value)}
                      placeholder="Ex: São Paulo-SP"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Taxa de Deslocamento (R$)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        disabled={areaIsFree}
                        value={areaIsFree ? '0' : areaFee}
                        onChange={(e) => setAreaFee(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-extrabold text-stone-900 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                      />
                      <label className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-2 rounded-xl cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={areaIsFree}
                          onChange={(e) => setAreaIsFree(e.target.checked)}
                          className="rounded text-emerald-600"
                        />
                        Grátis
                      </label>
                    </div>
                  </div>
                </div>

                {/* Sugestões rápidas de bairros da cidade */}
                {dynamicCitySuggestions.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-stone-500">
                      Toque para preencher bairros de {areaCity || proBaseCity}:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                      {dynamicCitySuggestions.slice(0, 12).map((bName) => (
                        <button
                          key={bName}
                          type="button"
                          onClick={() => setAreaName(bName)}
                          className="text-[10px] font-semibold bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 px-2.5 py-1 rounded-lg border border-stone-200 transition cursor-pointer"
                        >
                          + {bName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {editingAreaId ? 'Salvar Localidade' : 'Adicionar Localidade e Taxa'}
                  </button>
                </div>
              </form>

              {/* Lista de Localidades Atendidas */}
              <div className="bg-white rounded-3xl border border-stone-200 p-4 space-y-3 shadow-xs">
                <h4 className="font-extrabold text-xs text-stone-900">
                  Localidades e Taxas Cadastradas ({proNeighborhoodsList.length})
                </h4>

                {proNeighborhoodsList.length === 0 ? (
                  <p className="text-xs text-stone-500 text-center py-5 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                    Nenhuma localidade cadastrada ainda. Adicione os bairros que você atende acima!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {proNeighborhoodsList.map((area) => (
                      <div
                        key={area.id}
                        className="p-3 rounded-2xl border border-stone-200 bg-stone-50/70 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-stone-900 truncate">
                            {area.name}
                          </p>
                          <p className="text-[10px] text-stone-500">
                            {area.city || proBaseCity || 'Região atendida'} •{' '}
                            <strong
                              className={
                                area.travelFee === 0 ? 'text-emerald-700' : 'text-rose-600'
                              }
                            >
                              {area.travelFee === 0
                                ? 'Taxa Grátis'
                                : `Taxa R$ ${area.travelFee.toFixed(2).replace('.', ',')}`}
                            </strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAreaId(area.id);
                              setAreaName(area.name);
                              setAreaCity(area.city || proBaseCity || '');
                              setAreaFee(String(area.travelFee));
                              setAreaIsFree(area.travelFee === 0);
                            }}
                            className="p-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg cursor-pointer"
                          >
                            <Pencil className="w-3 h-3 text-rose-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setProNeighborhoodsList(
                                proNeighborhoodsList.filter((n) => n.id !== area.id)
                              );
                              showNotice(`🗑️ Localidade "${area.name}" removida.`);
                            }}
                            className="p-1.5 bg-white hover:bg-red-50 text-red-600 border border-stone-200 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* RODAPÉ FIXO DA JANELA DO ASSISTENTE                                  */}
        {/* ==================================================================== */}
        <div className="bg-white border-t border-stone-200 px-4 sm:px-6 py-3.5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-bold text-stone-500 hover:text-stone-900 underline underline-offset-2 transition cursor-pointer text-left"
          >
            Pular e fazer essas configurações depois
          </button>

          <div className="flex items-center justify-end gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => onSelectStep((step - 1) as 1 | 2 | 3 | 4)}
                className="text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 px-3.5 py-2.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Passo {step - 1}</span>
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => onSelectStep((step + 1) as 1 | 2 | 3 | 4)}
                className="text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>
                  Avançar para{' '}
                  {step === 1
                    ? 'Portfólios 📸'
                    : step === 2
                    ? 'Serviços e Valores 💅'
                    : 'Base e Taxas 🚗'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onFinish}
                className="text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Concluir Configuração da Conta 🎉</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

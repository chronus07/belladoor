import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Check,
  User,
  Phone,
  Scissors,
  Sparkles,
  Building2,
  Home,
  Car,
} from 'lucide-react';
import { ClientAppointment } from '../types/belladoor';
import { MockService } from '../data/mockData';

interface ManualAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: ClientAppointment) => void;
  proServices: MockService[];
  businessNiche?: 'BEAUTY' | 'BARBERSHOP' | 'NEUTRAL';
  serviceMode?: 'DOMICILIO' | 'STUDIO' | 'HIBRIDO';
  studioName?: string;
  studioAddress?: string;
  baseNeighborhood?: string;
  proId?: string;
  proEmail?: string;
  proName?: string;
  proSlug?: string;
  proAvatarUrl?: string;
  proWhatsapp?: string;
}

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ManualAppointmentModal: React.FC<ManualAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  proServices,
  businessNiche = 'BEAUTY',
  serviceMode = 'DOMICILIO',
  studioName = '',
  studioAddress = '',
  baseNeighborhood = '',
  proId,
  proEmail,
  proName = '',
  proSlug,
  proAvatarUrl,
  proWhatsapp,
}) => {
  const isBarber = businessNiche === 'BARBERSHOP';

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [customServiceName, setCustomServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState<number>(0);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState('14:00');
  
  // Local do atendimento
  const [locationType, setLocationType] = useState<'STUDIO' | 'DOMICILIO'>(
    serviceMode === 'STUDIO' ? 'STUDIO' : 'DOMICILIO'
  );
  const [clientAddress, setClientAddress] = useState('');
  const [clientNeighborhood, setClientNeighborhood] = useState('');
  const [travelFee, setTravelFee] = useState<number>(0);
  const [status, setStatus] = useState<'Confirmado' | 'Concluído'>('Confirmado');
  const [error, setError] = useState<string | null>(null);

  // Inicializa quando abre o modal
  useEffect(() => {
    if (isOpen) {
      setClientName('');
      setClientPhone('');
      setError(null);
      setDate(getTodayDateString());
      setTime('14:00');
      setStatus('Confirmado');

      const initialLocation = serviceMode === 'STUDIO' ? 'STUDIO' : 'DOMICILIO';
      setLocationType(initialLocation);

      if (proServices && proServices.length > 0) {
        const first = proServices[0];
        setSelectedServiceId(first.id);
        setCustomServiceName(first.name);
        setServicePrice(first.price);
        setDurationMinutes(first.durationMinutes || 60);
      } else {
        setSelectedServiceId('custom');
        setCustomServiceName('');
        setServicePrice(0);
        setDurationMinutes(60);
      }
      setClientAddress('');
      setClientNeighborhood('');
      setTravelFee(0);
    }
  }, [isOpen, proServices, serviceMode]);

  if (!isOpen) return null;

  const handleSelectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    if (serviceId === 'custom') {
      setCustomServiceName('');
      setServicePrice(0);
      setDurationMinutes(60);
    } else {
      const found = proServices.find((s) => s.id === serviceId);
      if (found) {
        setCustomServiceName(found.name);
        setServicePrice(found.price);
        setDurationMinutes(found.durationMinutes || 60);
      }
    }
  };

  const finalTravelFee = locationType === 'STUDIO' ? 0 : Number(travelFee || 0);
  const totalPrice = Number(servicePrice || 0) + finalTravelFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientName.trim()) {
      setError(isBarber ? 'Informe o nome do cliente.' : 'Informe o nome da cliente.');
      return;
    }

    const resolvedServiceName =
      selectedServiceId === 'custom'
        ? customServiceName.trim() || (isBarber ? 'Corte & Barba' : 'Atendimento Especial')
        : customServiceName || 'Atendimento';

    if (!resolvedServiceName.trim()) {
      setError('Informe o nome do serviço.');
      return;
    }

    if (!date) {
      setError('Selecione a data do agendamento.');
      return;
    }

    if (!time) {
      setError('Selecione o horário do atendimento.');
      return;
    }

    const resolvedAddress =
      locationType === 'STUDIO'
        ? (studioAddress.trim() || studioName.trim() || 'Studio / Espaço Físico')
        : (clientAddress.trim() || 'A domicílio');

    const resolvedNeighborhood =
      locationType === 'STUDIO'
        ? (baseNeighborhood.trim() || studioName.trim() || 'Studio')
        : (clientNeighborhood.trim() || 'Atendimento em domicílio');

    const newApp: ClientAppointment = {
      id: `app-man-${Date.now()}`,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      serviceName: resolvedServiceName,
      durationMinutes: Number(durationMinutes) || 60,
      date,
      time,
      address: resolvedAddress,
      neighborhood: resolvedNeighborhood,
      travelFee: finalTravelFee,
      totalPrice,
      status,
      locationType,
      locationAddress: resolvedAddress,
      proId,
      proEmail: proEmail?.toLowerCase(),
      proName,
      proSlug,
      proAvatarUrl,
      proWhatsapp,
      reviewed: false,
    };

    onSave(newApp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* CABEÇALHO */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${isBarber ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                Novo Agendamento Manual
              </h3>
              <p className="text-xs text-stone-300">
                Cadastre clientes agendados pelo WhatsApp ou ligação
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* DADOS DO CLIENTE */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {isBarber ? 'Dados do Cliente' : 'Dados da Cliente'}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nome do {isBarber ? 'Cliente' : 'Cliente'} *
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  WhatsApp / Telefone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MODALIDADE / LOCAL DO ATENDIMENTO */}
          <div className="space-y-2 pt-1 border-t border-stone-100">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-500">
              Onde será o atendimento?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocationType('STUDIO')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  locationType === 'STUDIO'
                    ? (isBarber ? 'bg-amber-500/10 border-amber-500 text-amber-900 shadow-xs' : 'bg-rose-500/10 border-rose-500 text-rose-900 shadow-xs')
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                {isBarber ? 'Na Barbearia' : 'No Studio'}
              </button>

              <button
                type="button"
                onClick={() => setLocationType('DOMICILIO')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  locationType === 'DOMICILIO'
                    ? (isBarber ? 'bg-amber-500/10 border-amber-500 text-amber-900 shadow-xs' : 'bg-rose-500/10 border-rose-500 text-rose-900 shadow-xs')
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Home className="w-4 h-4" />
                A Domicílio
              </button>
            </div>

            {locationType === 'DOMICILIO' && (
              <div className="space-y-2.5 pt-2 bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Endereço (Rua, Nº)
                    </label>
                    <input
                      type="text"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder="Ex: Rua das Flores, 120"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-white focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={clientNeighborhood}
                      onChange={(e) => setClientNeighborhood(e.target.value)}
                      placeholder="Ex: Centro"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-white focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Taxa de Deslocamento (R$)
                  </label>
                  <div className="relative">
                    <Car className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={travelFee || ''}
                      onChange={(e) => setTravelFee(parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 text-xs bg-white focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SERVIÇO & VALOR */}
          <div className="space-y-3 pt-1 border-t border-stone-100">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5" />
              Serviço & Preço
            </h4>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Selecione o Serviço
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => handleSelectService(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
              >
                {proServices.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name} — R$ {svc.price.toFixed(2).replace('.', ',')} ({svc.durationMinutes} min)
                  </option>
                ))}
                <option value="custom">➕ Outro serviço / Personalizado...</option>
              </select>
            </div>

            {selectedServiceId === 'custom' && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nome do Serviço Personalizado *
                </label>
                <input
                  type="text"
                  required
                  value={customServiceName}
                  onChange={(e) => setCustomServiceName(e.target.value)}
                  placeholder="Ex: Corte Degradê + Barba Terapia"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Valor do Serviço (R$)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={servicePrice || ''}
                    onChange={(e) => setServicePrice(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Duração Estimada
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1h 30m</option>
                    <option value={120}>2 horas</option>
                    <option value={180}>3 horas</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* DATA, HORA & STATUS */}
          <div className="space-y-3 pt-1 border-t border-stone-100">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Data, Horário & Status
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Data *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Horário *
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Confirmado' | 'Concluído')}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-stone-900 bg-stone-50/50 font-medium"
                >
                  <option value="Confirmado">Agendado (Pendente)</option>
                  <option value="Concluído">Já Concluído</option>
                </select>
              </div>
            </div>
          </div>

          {/* RESUMO DO VALOR TOTAL */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-emerald-900">Total a Receber</p>
              <p className="text-[11px] text-emerald-700">
                {locationType === 'DOMICILIO' && finalTravelFee > 0
                  ? `Serviço R$ ${Number(servicePrice || 0).toFixed(2).replace('.', ',')} + Deslocamento R$ ${finalTravelFee.toFixed(2).replace('.', ',')}`
                  : '100% livre de taxas (0% comissão)'}
              </p>
            </div>
            <p className="text-lg font-black text-emerald-800">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </p>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs text-white shadow-md flex items-center gap-1.5 transition cursor-pointer ${
                isBarber ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Check className="w-4 h-4" />
              Salvar na Agenda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

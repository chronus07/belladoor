import React, { useState } from 'react';
import {
  X,
  QrCode,
  Download,
  Copy,
  Check,
  Sparkles,
  Share2,
  MapPin,
  Instagram,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { MockService } from '../data/mockData';

interface ProPromoCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  proName: string;
  proTitle: string;
  proAvatarUrl: string;
  proInstagram: string;
  proBaseCity: string;
  proBaseNeighborhood: string;
  proServices: MockService[];
  vitrineUrl: string;
  proSlug: string;
  businessNiche?: 'BEAUTY' | 'BARBERSHOP' | 'NEUTRAL';
  serviceMode?: 'DOMICILIO' | 'STUDIO' | 'HIBRIDO';
  studioName?: string;
}

export const ProPromoCardModal: React.FC<ProPromoCardModalProps> = ({
  isOpen,
  onClose,
  proName,
  proTitle,
  proAvatarUrl,
  proInstagram,
  proBaseCity,
  proBaseNeighborhood,
  proServices,
  vitrineUrl,
  proSlug,
  businessNiche = 'BEAUTY',
  serviceMode = 'DOMICILIO',
  studioName = '',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const isBarber = businessNiche === 'BARBERSHOP';
  const displayProName = proName.trim() || (isBarber ? 'Barbeiro Profissional' : 'Profissional BellaDoor');
  const displayProTitle = proTitle.trim() || (isBarber ? 'Especialista em Cortes & Barba' : 'Especialista em Beleza a Domicílio');
  const locationLabel = [
    isBarber && studioName.trim() ? studioName.trim() : null,
    proBaseNeighborhood.trim(),
    proBaseCity.trim(),
  ]
    .filter(Boolean)
    .join(' • ');
  const shortLinkText = `bellador.web.app/?pro=${proSlug}`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=12&color=1c1917&bgcolor=ffffff&data=${encodeURIComponent(
    vitrineUrl
  )}`;

  const readyCaption = isBarber
    ? `Fala, rapaziada! 💈✂️ Agora ficou muito mais fácil e rápido agendar seu horário de corte e barba comigo. Confira meus serviços, valores e horários vagos direto pela minha agenda online no BellaDoor!\n\n📲 Escolha seu horário aqui:\n👉 ${vitrineUrl}\n\nTamo junto, te espero na cadeira! 👊🔥`
    : `✨ Meninas, novidade! Agora vocês podem conferir meu portfólio, consultar a taxa de deslocamento pelo CEP e agendar seu atendimento em casa direto pela minha agenda online no BellaDoor!\n\n📲 Acesse minha vitrine aqui:\n👉 ${vitrineUrl}`;

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(readyCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 3000);
    } catch {}
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(vitrineUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {}
  };

  const loadCrossOriginImage = (src: string): Promise<HTMLImageElement | null> =>
    new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const generateStoryCanvasBlob = async (): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Fundo luxuoso escuro: tons de grafite/âmbar para barbeiro ou rose/vinho para beleza
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
    if (isBarber) {
      bgGrad.addColorStop(0, '#0c0a09');
      bgGrad.addColorStop(0.5, '#1c1917');
      bgGrad.addColorStop(1, '#0c0a09');
    } else {
      bgGrad.addColorStop(0, '#1c1917');
      bgGrad.addColorStop(0.5, '#4c0519');
      bgGrad.addColorStop(1, '#1c1917');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Brilho suave no topo (âmbar/dourado para barbeiro, rose para beleza)
    const radialTop = ctx.createRadialGradient(540, 260, 40, 540, 260, 520);
    radialTop.addColorStop(0, isBarber ? 'rgba(217, 119, 6, 0.35)' : 'rgba(244, 63, 94, 0.32)');
    radialTop.addColorStop(1, isBarber ? 'rgba(217, 119, 6, 0)' : 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = radialTop;
    ctx.fillRect(0, 0, 1080, 900);

    // 2. Selo Topo BellaDoor Oficial
    drawRoundedRect(ctx, isBarber ? 260 : 290, 95, isBarber ? 560 : 500, 66, 33);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();
    ctx.strokeStyle = isBarber ? 'rgba(245, 158, 11, 0.55)' : 'rgba(251, 191, 36, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = isBarber ? '#fde047' : '#fde68a';
    ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      isBarber ? '💈 AGENDA ONLINE OFICIAL | BARBEARIA' : '✨ AGENDA ONLINE OFICIAL BELLADOOR',
      540,
      137
    );

    // 3. Card Central Branco/Creme
    drawRoundedRect(ctx, 80, 210, 920, 1510, 56);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Faixa superior decorativa no Card
    ctx.save();
    drawRoundedRect(ctx, 80, 210, 920, 210, 56);
    ctx.clip();
    const headerGrad = ctx.createLinearGradient(80, 210, 1000, 420);
    if (isBarber) {
      headerGrad.addColorStop(0, '#1c1917');
      headerGrad.addColorStop(0.5, '#b45309');
      headerGrad.addColorStop(1, '#d97706');
    } else {
      headerGrad.addColorStop(0, '#e11d48');
      headerGrad.addColorStop(0.5, '#be123c');
      headerGrad.addColorStop(1, '#d97706');
    }
    ctx.fillStyle = headerGrad;
    ctx.fillRect(80, 210, 920, 210);
    ctx.restore();

    // 4. Carrega Avatar do Profissional e QR Code em paralelo
    const [avatarImg, qrImg] = await Promise.all([
      loadCrossOriginImage(proAvatarUrl),
      loadCrossOriginImage(qrCodeImageUrl),
    ]);

    // Círculo de Avatar
    const avatarCenterY = 415;
    ctx.save();
    ctx.beginPath();
    ctx.arc(540, avatarCenterY, 118, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.clip();

    if (avatarImg) {
      ctx.drawImage(avatarImg, 540 - 118, avatarCenterY - 118, 236, 236);
    } else {
      ctx.fillStyle = isBarber ? '#292524' : '#ffe4e6';
      ctx.fillRect(540 - 118, avatarCenterY - 118, 236, 236);
      ctx.fillStyle = isBarber ? '#fbbf24' : '#e11d48';
      ctx.font = 'bold 90px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(displayProName.charAt(0).toUpperCase(), 540, avatarCenterY + 32);
    }
    ctx.restore();

    // 5. Nome, Especialidade e Localização
    ctx.fillStyle = '#1c1917';
    ctx.font = '800 48px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(displayProName.slice(0, 32), 540, 600);

    ctx.fillStyle = isBarber ? '#b45309' : '#e11d48';
    ctx.font = '700 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(displayProTitle.slice(0, 44), 540, 650);

    if (locationLabel) {
      ctx.fillStyle = '#78716c';
      ctx.font = '600 25px "Plus Jakarta Sans", sans-serif';
      const locPrefix = isBarber
        ? '💈 Barbearia & Atendimento VIP'
        : '📍 Atendimento a Domicílio';
      ctx.fillText(`${locPrefix} • ${locationLabel.slice(0, 36)}`, 540, 698);
    }

    // 6. Lista de até 3 Serviços em destaque (se houver)
    const topServices = proServices.slice(0, 3);
    let nextY = 750;
    if (topServices.length > 0) {
      topServices.forEach((srv) => {
        drawRoundedRect(ctx, 140, nextY, 800, 74, 22);
        ctx.fillStyle = '#fafaf9';
        ctx.fill();
        ctx.strokeStyle = '#e7e5e4';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#292524';
        ctx.font = '700 26px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${isBarber ? '✂️' : '✨'} ${srv.name.slice(0, 30)}`, 175, nextY + 46);

        ctx.fillStyle = isBarber ? '#b45309' : '#e11d48';
        ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`R$ ${srv.price.toFixed(2).replace('.', ',')}`, 905, nextY + 46);

        nextY += 88;
      });
    } else {
      drawRoundedRect(ctx, 140, nextY, 800, 90, 24);
      ctx.fillStyle = isBarber ? '#fffbeb' : '#fff1f2';
      ctx.fill();
      ctx.fillStyle = isBarber ? '#b45309' : '#9f1239';
      ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        isBarber
          ? '💈 Confira os serviços de corte, barba e horários vagos!'
          : '✨ Confira meu portfólio, serviços e horários vagos!',
        540,
        nextY + 55
      );
      nextY += 115;
    }

    // 7. Moldura do QR Code Escaneável
    const qrBoxSize = 370;
    const qrBoxX = 540 - qrBoxSize / 2;
    const qrBoxY = Math.max(nextY + 20, 1045);

    drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 36);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = isBarber ? '#fde68a' : '#fecdd3';
    ctx.stroke();

    if (qrImg) {
      ctx.drawImage(qrImg, qrBoxX + 20, qrBoxY + 20, qrBoxSize - 40, qrBoxSize - 40);
    }

    // 8. Chamada de Ação + Link Exclusivo
    const ctaY = qrBoxY + qrBoxSize + 58;
    ctx.fillStyle = '#1c1917';
    ctx.font = '800 32px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Aponte a câmera para o QR Code ou acesse:', 540, ctaY);

    drawRoundedRect(ctx, 150, ctaY + 25, 780, 74, 37);
    ctx.fillStyle = isBarber ? '#b45309' : '#e11d48';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`🔗 ${shortLinkText.slice(0, 42)}`, 540, ctaY + 72);

    // 9. Rodapé Oficial BellaDoor
    ctx.fillStyle = '#fde68a';
    ctx.font = '800 30px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      isBarber
        ? 'BellaDoor Barber — Cortes, Barba & Estilo 💈'
        : 'BellaDoor — A beleza que bate à sua porta ✨',
      540,
      1805
    );

    ctx.fillStyle = '#a8a29e';
    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      isBarber
        ? 'Plataforma oficial de agendamento online para barbearias • bellador.web.app'
        : 'Plataforma oficial para profissionais da beleza a domicílio • bellador.web.app',
      540,
      1850
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
    });
  };

  const handleDownloadStoryImage = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateStoryCanvasBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `story-belladoor-${proSlug || 'vitrine'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNativeShareStory = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateStoryCanvasBlob();
      if (!blob) return;
      const file = new File([blob], `story-belladoor-${proSlug || 'vitrine'}.png`, {
        type: 'image/png',
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${displayProName} — Agenda Online BellaDoor`,
          text: readyCaption,
          files: [file],
        });
        return;
      }
      // Fallback para download direto caso o navegador não suporte Web Share de arquivos
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `story-belladoor-${proSlug || 'vitrine'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      // Usuário cancelou o menu de compartilhamento
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Cabeçalho */}
        <div className={`px-5 py-4 flex items-center justify-between shrink-0 text-white ${
          isBarber
            ? 'bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950'
            : 'bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isBarber
                ? 'bg-amber-500/20 border border-amber-400/30 text-amber-300'
                : 'bg-rose-500/20 border border-rose-400/30 text-rose-300'
            }`}>
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 block">
                Kit de Divulgação p/ Instagram &amp; WhatsApp
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Arte para Stories &amp; QR Code da Sua Vitrine
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo com Preview do Card Vertical + Ações */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Coluna Esquerda: Preview Visual do Card de Story (9:16) */}
          <div className="md:col-span-6 flex flex-col items-center">
            <div className={`w-full max-w-[270px] rounded-3xl p-3.5 shadow-xl border text-center ${
              isBarber
                ? 'bg-gradient-to-b from-stone-950 via-stone-900 to-amber-950 border-stone-800'
                : 'bg-gradient-to-b from-stone-900 via-rose-950 to-stone-900 border-stone-800'
            }`}>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 border border-amber-400/40 text-amber-300 text-[9px] font-extrabold uppercase tracking-wider mb-2.5">
                <span>{isBarber ? '💈' : '✨'}</span> {isBarber ? 'Agenda Barbearia BellaDoor' : 'Agenda Online BellaDoor'}
              </div>

              <div className="bg-white rounded-2xl overflow-hidden shadow-md pb-3.5">
                <div className={`h-12 ${
                  isBarber
                    ? 'bg-gradient-to-r from-stone-900 via-amber-700 to-amber-600'
                    : 'bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600'
                }`} />
                <div className="-mt-8 flex justify-center">
                  <img
                    src={proAvatarUrl}
                    alt={displayProName}
                    referrerPolicy="no-referrer"
                    className={`w-16 h-16 rounded-full object-cover border-4 border-white shadow-md ${
                      isBarber ? 'bg-stone-800' : 'bg-rose-50'
                    }`}
                  />
                </div>

                <div className="px-3 pt-1.5 space-y-0.5">
                  <h4 className="text-sm font-extrabold text-stone-900 truncate">
                    {displayProName}
                  </h4>
                  <p className={`text-[10px] font-bold truncate ${
                    isBarber ? 'text-amber-700' : 'text-rose-600'
                  }`}>
                    {displayProTitle}
                  </p>
                  {locationLabel && (
                    <p className="text-[9px] text-stone-500 flex items-center justify-center gap-0.5 truncate">
                      <MapPin className={`w-2.5 h-2.5 shrink-0 ${isBarber ? 'text-amber-600' : 'text-rose-500'}`} />
                      {isBarber ? `Barbearia / VIP • ${locationLabel}` : locationLabel}
                    </p>
                  )}
                </div>

                {/* Mini lista de serviços no preview */}
                {proServices.length > 0 && (
                  <div className="px-3 mt-2 space-y-1">
                    {proServices.slice(0, 2).map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between text-[9px] bg-stone-50 border border-stone-200/80 rounded-lg px-2 py-1"
                      >
                        <span className="font-bold text-stone-800 truncate pr-1">
                          {isBarber ? '✂️' : '✨'} {s.name}
                        </span>
                        <span className={`font-extrabold shrink-0 ${
                          isBarber ? 'text-amber-700' : 'text-rose-600'
                        }`}>
                          R$ {s.price.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* QR Code Escaneável */}
                <div className="mt-2.5 flex justify-center">
                  <div className={`p-2 bg-white border-2 rounded-2xl shadow-xs ${
                    isBarber ? 'border-amber-300' : 'border-rose-200'
                  }`}>
                    <img
                      src={qrCodeImageUrl}
                      alt="QR Code da Vitrine"
                      className="w-28 h-28 object-contain"
                    />
                  </div>
                </div>

                <p className="text-[9px] font-bold text-stone-600 mt-2 px-2">
                  Aponte a câmera para o QR Code ou acesse:
                </p>
                <div className={`mx-3 mt-1 text-white text-[9px] font-extrabold py-1 px-2.5 rounded-full truncate ${
                  isBarber ? 'bg-amber-600' : 'bg-rose-600'
                }`}>
                  🔗 {shortLinkText}
                </div>
              </div>

              <p className="text-[9px] font-extrabold text-amber-300 mt-2.5">
                {isBarber
                  ? 'BellaDoor Barber — Cortes, Barba & Estilo 💈'
                  : 'BellaDoor — A beleza que bate à sua porta ✨'}
              </p>
            </div>
          </div>

          {/* Coluna Direita: Botões de Download, Compartilhamento e Legenda Pronta */}
          <div className="md:col-span-6 space-y-4">
            <div className={`border rounded-2xl p-3.5 space-y-1.5 ${
              isBarber
                ? 'bg-amber-50/80 border-amber-200'
                : 'bg-rose-50/80 border-rose-200'
            }`}>
              <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider ${
                isBarber ? 'text-amber-900' : 'text-rose-800'
              }`}>
                <ShieldCheck className={`w-3.5 h-3.5 ${isBarber ? 'text-amber-600' : 'text-rose-600'}`} /> Divulgação Inteligente
              </span>
              <p className="text-xs text-stone-700 leading-relaxed">
                Baixe sua arte pronta em alta definição (formato vertical de <strong>Stories do Instagram</strong> e <strong>Status do WhatsApp</strong>) com seu QR Code exclusivo!
              </p>
            </div>

            {/* Botões Principais */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleDownloadStoryImage}
                className={`w-full py-3 px-4 rounded-2xl text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-60 ${
                  isBarber
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <Download className="w-4 h-4" />
                {isGenerating
                  ? 'Gerando Arte em Alta Definição...'
                  : 'Baixar Imagem p/ Stories & Status (PNG)'}
              </button>

              <button
                type="button"
                disabled={isGenerating}
                onClick={handleNativeShareStory}
                className="w-full py-2.5 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
              >
                <Share2 className="w-4 h-4 text-amber-400" />
                Compartilhar Arte Direto no Celular
              </button>
            </div>

            {/* Legenda Pronta para Copiar */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-stone-800">
                  📋 Texto Pronto p/ WhatsApp ou Bio:
                </span>
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className={`text-[11px] font-extrabold flex items-center gap-1 cursor-pointer ${
                    isBarber
                      ? 'text-amber-700 hover:text-amber-800'
                      : 'text-rose-600 hover:text-rose-700'
                  }`}
                >
                  {copiedCaption ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Texto Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar Texto
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-stone-600 bg-white border border-stone-200 rounded-xl p-2.5 whitespace-pre-line leading-relaxed select-all">
                {readyCaption}
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 py-2 px-3 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Link Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className={`w-3.5 h-3.5 ${isBarber ? 'text-amber-600' : 'text-rose-600'}`} />
                      Só o Link
                    </>
                  )}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(readyCaption)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Enviar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { MapPin, Search, ShieldCheck, Star } from 'lucide-react';
import { MockProfessional } from '../data/mockData';

interface MarketplaceViewProps {
  filteredPros: MockProfessional[];
  searchQuery: string;
  categoryFilter: string;
  onChangeSearchQuery: (val: string) => void;
  onChangeCategoryFilter: (cat: string) => void;
  onClearFilters: () => void;
  onSelectProfessional: (pro: MockProfessional) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  filteredPros,
  searchQuery,
  categoryFilter,
  onChangeSearchQuery,
  onChangeCategoryFilter,
  onClearFilters,
  onSelectProfessional,
}) => {
  return (
    <div className="space-y-4">
      {/* Banner de Boas-Vindas */}
      <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-stone-900 text-white p-5 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-900/60 px-2.5 py-0.5 rounded-full border border-rose-700/50">
            Atendimento a Domicílio
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight pt-1">
            A beleza que vai até você.
          </h1>
          <p className="text-xs text-rose-100/80 leading-relaxed max-w-sm">
            Encontre profissionais qualificadas e agende seu atendimento no conforto da sua casa.
          </p>
        </div>
        <div className="absolute -right-4 -bottom-6 opacity-20 text-8xl select-none">🚪</div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Buscar por profissional, serviço ou bairro..."
          value={searchQuery}
          onChange={(e) => onChangeSearchQuery(e.target.value)}
          className="w-full bg-white border border-stone-200 rounded-2xl pl-10 pr-4 py-3 text-xs text-stone-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
      </div>

      {/* Filtro por Categorias */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: 'TODAS', label: '🌟 Todas' },
          { id: 'Maquiagem', label: '💄 Maquiagem' },
          { id: 'Cabelo', label: '💇‍♀️ Cabelo' },
          { id: 'Unhas', label: '💅 Unhas' },
          { id: 'Sobrancelha', label: '👁️ Cílios & Sobrancelhas' },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChangeCategoryFilter(cat.id)}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition cursor-pointer ${
              categoryFilter === cat.id
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:border-rose-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Lista de Profissionais */}
      <div className="space-y-3.5 pt-1">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Profissionais Disponíveis ({filteredPros.length})
          </h2>
        </div>

        {filteredPros.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 text-stone-500 space-y-2">
            {searchQuery.trim() === '' && categoryFilter === 'TODAS' ? (
              <>
                <span className="text-3xl block">✨</span>
                <p className="text-sm font-bold text-stone-800">
                  Nenhuma profissional publicada ainda
                </p>
                <p className="text-xs max-w-md mx-auto leading-relaxed">
                  Assim que uma profissional criar sua conta e configurar sua vitrine no painel, ela aparecerá aqui pronta para receber agendamentos.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-stone-800">Nenhum resultado encontrado</p>
                <p className="text-xs">Tente buscar por outro termo ou categoria.</p>
                <button
                  onClick={onClearFilters}
                  className="text-xs text-rose-600 font-bold underline pt-2 block mx-auto cursor-pointer"
                >
                  Limpar Filtros
                </button>
              </>
            )}
          </div>
        ) : (
          filteredPros.map((p) => {
            const minPrice =
              p.services.length > 0
                ? Math.min(...p.services.map((s) => Number(s.price) || 0))
                : p.startingPrice || 0;
            const mainArea =
              p.neighborhoods.length > 0
                ? p.neighborhoods[0].name
                : p.baseNeighborhood || 'Atendimento a Domicílio';

            return (
              <div
                key={p.id}
                onClick={() => onSelectProfessional(p)}
                className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden hover:shadow-md hover:border-rose-300 transition cursor-pointer group"
              >
                {/* Capa */}
                <div className="relative h-24 bg-stone-900">
                  <img
                    src={p.coverUrl}
                    alt={p.name}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-sm text-stone-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
                    {minPrice > 0 ? `A partir de R$ ${minPrice.toFixed(0)}` : 'Atendimento a Domicílio'}
                  </span>
                </div>

                <div className="p-4 pt-0 relative">
                  <div className="flex justify-between items-end -mt-8 mb-2">
                    <img
                      src={p.avatarUrl}
                      alt={p.name}
                      className="w-16 h-16 rounded-2xl object-cover border-3 border-white shadow-md bg-white"
                    />
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-xs font-extrabold text-amber-700">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {p.rating}
                      <span className="text-[10px] text-stone-400 font-normal">
                        ({p.reviewCount})
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-sm text-stone-900 group-hover:text-rose-600 transition">
                        {p.name}
                      </h3>
                      <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <ShieldCheck className="w-2.5 h-2.5 text-rose-600" /> Verificada
                      </span>
                    </div>
                    <p className="text-xs text-rose-600 font-semibold mt-0.5">
                      {p.title || 'Especialista em Beleza a Domicílio'}
                    </p>

                    {/* Especialidades / Serviços */}
                    {p.services.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.services.slice(0, 3).map((srv) => (
                          <span
                            key={srv.id}
                            className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium"
                          >
                            {srv.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Rodapé do Card */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100 text-[11px] text-stone-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        {mainArea}
                      </span>
                      <span className="font-bold text-rose-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                        Ver Perfil & Agendar ➔
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

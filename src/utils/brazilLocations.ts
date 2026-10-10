// ==============================================================================
// BELLADOOR - BASE NACIONAL DE CIDADES E BAIRROS / REGIÕES DO BRASIL
// Sugestões inteligentes por cidade (Capitais, DF, Regiões Metropolitanas e ViaCEP)
// ==============================================================================

const normalizeText = (str: string): string =>
  str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const BRAZIL_CITY_NEIGHBORHOODS: Record<string, string[]> = {
  // DISTRITO FEDERAL (Brasília e Regiões Administrativas)
  'brasilia': [
    'Ceilândia',
    'Taguatinga',
    'Guará',
    'Águas Claras',
    'Asa Sul',
    'Asa Norte',
    'Sudoeste',
    'Samambaia',
    'Vicente Pires',
    'Gama',
    'Sobradinho',
    'Lago Sul',
    'Lago Norte',
    'Recanto das Emas',
    'Riacho Fundo',
    'Cruzeiro',
    'Noroeste',
    'Park Way',
    'Santa Maria',
    'Planaltina',
  ],
  // ENTORNO DO DF / GOIÁS
  'valparaiso de goias': [
    'Jardim Céu Azul',
    'Parque Esplanada III',
    'Valparaízo I',
    'Valparaízo II',
    'Cidade Jardins',
    'Etapa A',
    'Parque Rio Branco',
    'Morada Nobre',
    'Jardim Oriente',
    'Pacaembu',
  ],
  'aguas lindas de goias': [
    'Mansões Odisséia',
    'Jardim Brasília',
    'Parque da Barragem',
    'Setor 2',
    'Setor 8',
    'Jardim Pérola',
    'Camping Club',
    'Cidade Jardim',
    'Jardim América',
    'Setor Coimbra',
  ],
  'luziania': [
    'Centro',
    'Parque Estrela Dalva',
    'Jardim Ingá',
    'Setor Mandu',
    'Setor Aeroporto',
    'Parque Alvorada',
    'Vila Guará',
    'Setor Leste',
  ],
  'novo gama': [
    'Pedregal',
    'Parque Estrela Dalva VI',
    'Lago Azul',
    'Lunabel',
    'Boa Vista',
    'Grande Vale',
    'Centro',
  ],
  'goiania': [
    'Setor Bueno',
    'Setor Marista',
    'Jardim Goiás',
    'Setor Oeste',
    'Parque Amazônia',
    'Setor Pedro Ludovico',
    'Alphaville Flamboyant',
    'Jardim América',
    'Setor Nova Suíça',
    'Campinas',
    'Setor Bela Vista',
    'Eldorado',
  ],
  'aparecida de goiania': [
    'Vila Brasília',
    'Parque Amazônia',
    'Jardim Luz',
    'Garavelo',
    'Cidade Livre',
    'Setor Buriti Sereno',
    'Papillon Park',
    'Centro',
  ],
  'anapolis': [
    'Jundiaí',
    'Centro',
    'Cidade Universitária',
    'Vila Jaiara',
    'Maracanã',
    'Bairro de Lourdes',
    'Jardim América',
    'Parque Iracema',
  ],
  // SÃO PAULO
  'sao paulo': [
    'Moema',
    'Itaim Bibi',
    'Jardins',
    'Pinheiros',
    'Vila Madalena',
    'Vila Olímpia',
    'Vila Mariana',
    'Perdizes',
    'Tatuapé',
    'Santana',
    'Morumbi',
    'Brooklin',
  ],
  'campinas': [
    'Cambuí',
    'Taquaral',
    'Barão Geraldo',
    'Nova Campinas',
    'Parque Prado',
    'Mansões Santo Antônio',
    'Guanabara',
    'Botafogo',
    'Swiss Park',
    'Centro',
  ],
  'guarulhos': [
    'Vila Augusta',
    'Maia',
    'Jardim Maia',
    'Centro',
    'Gopoúva',
    'Macedo',
    'Bonsucesso',
    'Picanço',
    'Vila Galvão',
  ],
  'santo andre': [
    'Jardim',
    'Vila Assunção',
    'Campestre',
    'Vila Bastos',
    'Centro',
    'Parque das Nações',
    'Vila Alpina',
    'Vila Pires',
  ],
  'sao bernardo do campo': [
    'Centro',
    'Rudge Ramos',
    'Baeta Neves',
    'Nova Petrópolis',
    'Jardim do Mar',
    'Paulicéia',
    'Assunção',
    'Demarchi',
  ],
  // RIO DE JANEIRO
  'rio de janeiro': [
    'Barra da Tijuca',
    'Copacabana',
    'Ipanema',
    'Leblon',
    'Tijuca',
    'Botafogo',
    'Flamengo',
    'Recreio dos Bandeirantes',
    'Jacarepaguá',
    'Méier',
    'Campo Grande',
    'Laranjeiras',
  ],
  'niteroi': [
    'Icaraí',
    'Ingá',
    'Santa Rosa',
    'São Francisco',
    'Charitas',
    'Camboinhas',
    'Piratininga',
    'Itaipu',
    'Centro',
    'Fonseca',
  ],
  // MINAS GERAIS
  'belo horizonte': [
    'Savassi',
    'Lourdes',
    'Pampulha',
    'Buritis',
    'Belvedere',
    'Funcionários',
    'Santo Agostinho',
    'Castelo',
    'Sion',
    'Padre Eustáquio',
    'Cidade Nova',
    'Gutierrez',
  ],
  'uberlandia': [
    'Santa Mônica',
    'Centro',
    'Morada da Colina',
    'Granja Marileusa',
    'Brasil',
    'Tibery',
    'Umuarama',
    'Saraiva',
    'Patrimônio',
  ],
  // PARANÁ
  'curitiba': [
    'Batel',
    'Água Verde',
    'Bigorrilho',
    'Centro Cívico',
    'Cabral',
    'Portão',
    'Boa Vista',
    'Santa Felicidade',
    'Ecoville',
    'Juvevê',
    'Mercês',
    'Rebouças',
  ],
  'londrina': [
    'Gleba Palhano',
    'Centro',
    'Bela Suíça',
    'Jardim Higienópolis',
    'Aurora',
    'Aeroporto',
    'Jardim Maringá',
  ],
  'maringa': [
    'Zona 01',
    'Zona 07',
    'Novo Centro',
    'Zona 05',
    'Jardim Alvorada',
    'Zona 03',
    'Parque Avenida',
  ],
  // RIO GRANDE DO SUL
  'porto alegre': [
    'Moinhos de Vento',
    'Bela Vista',
    'Petrópolis',
    'Menino Deus',
    'Cidade Baixa',
    'Três Figueiras',
    'Mont\'Serrat',
    'Bom Fim',
    'Higienópolis',
    'Tristeza',
  ],
  // SANTA CATARINA
  'florianopolis': [
    'Centro',
    'Jurerê',
    'Campeche',
    'Trindade',
    'Itacorubi',
    'Lagoa da Conceição',
    'Coqueiros',
    'Ingleses',
    'Estreito',
    'Agronômica',
  ],
  'balneario camboriu': [
    'Centro',
    'Barra Sul',
    'Barra Norte',
    'Pioneiros',
    'Nações',
    'Praia dos Amores',
    'Estados',
  ],
  'joinville': [
    'América',
    'Atiradores',
    'Centro',
    'Anita Garibaldi',
    'Saguaçu',
    'Glória',
    'Costa e Silva',
    'Boa Vista',
  ],
  // BAHIA
  'salvador': [
    'Pituba',
    'Barra',
    'Ondina',
    'Caminho das Árvores',
    'Horto Florestal',
    'Itaigara',
    'Graça',
    'Imbuí',
    'Stella Maris',
    'Alphaville',
    'Rio Vermelho',
    'Brotas',
  ],
  // CEARÁ
  'fortaleza': [
    'Aldeota',
    'Meireles',
    'Cocó',
    'Papicu',
    'Fátima',
    'Dionísio Torres',
    'Guararapes',
    'Cambeba',
    'Messejana',
    'Parquelândia',
    'Varjota',
  ],
  // PERNAMBUCO
  'recife': [
    'Boa Viagem',
    'Graças',
    'Casa Forte',
    'Espinheiro',
    'Parnamirim',
    'Pina',
    'Madalena',
    'Aflitos',
    'Tamarineira',
    'Setúbal',
    'Boa Vista',
  ],
  // AMAZONAS
  'manaus': [
    'Adrianópolis',
    'Ponta Negra',
    'Vieiralves',
    'Parque 10 de Novembro',
    'Aleixo',
    'Dom Pedro',
    'Flores',
    'Cidade Nova',
    'Nossa Senhora das Graças',
    'Chapada',
  ],
  // PARÁ
  'belem': [
    'Nazaré',
    'Umarizal',
    'Batista Campos',
    'Marco',
    'Pedreira',
    'Reduto',
    'Cidade Velha',
    'Parque Verde',
    'Marambaia',
    ' Batista Campos',
  ],
  // ESPÍRITO SANTO
  'vitoria': [
    'Praia do Canto',
    'Jardim da Penha',
    'Jardim Camburi',
    'Mata da Praia',
    'Enseada do Suá',
    'Barro Vermelho',
    'Bento Ferreira',
    'Santa Lúcia',
  ],
  'vila velha': [
    'Praia da Costa',
    'Itapuã',
    'Itaparica',
    'Coqueiral de Itaparica',
    'Glória',
    'Centro',
    'Cristóvão Colombo',
  ],
  // MATO GROSSO & MATO GROSSO DO SUL
  'cuiaba': [
    'Popular',
    'Goiabeiras',
    'Duque de Caxias',
    'Jardim Itália',
    'Bosque da Saúde',
    'Quilombo',
    'Santa Rosa',
    'CPA',
    'Centro Norte',
  ],
  'campo grande': [
    'Jardim dos Estados',
    'Centro',
    'Santa Fé',
    'Chácara Cachoeira',
    'Carandá Bosque',
    'Tiradentes',
    'São Francisco',
    'Vila Planalto',
  ],
  // DEMAIS CAPITAIS DO NORDESTE E NORTE
  'natal': [
    'Ponta Negra',
    'Tirol',
    'Petrópolis',
    'Lagoa Nova',
    'Capim Macio',
    'Candelária',
    'Nova Descoberta',
    'Alecrim',
  ],
  'joao pessoa': [
    'Manaíra',
    'Tambaú',
    'Cabo Branco',
    'Bessa',
    'Altiplano',
    'Bancários',
    'Miramar',
    'Jardim Oceania',
  ],
  'maceio': [
    'Ponta Verde',
    'Pajuçara',
    'Jatiúca',
    'Farol',
    'Mangabeiras',
    'Cruz das Almas',
    'Gruta de Lourdes',
    'Serraria',
  ],
  'aracaju': [
    '13 de Julho',
    'Jardins',
    'Atalaia',
    'Grageru',
    'Farolândia',
    'Salgado Filho',
    'Luzia',
    'Coroa do Meio',
  ],
  'teresina': [
    'Fátima',
    'Jóquei',
    'Ininga',
    'Horto',
    'São Cristóvão',
    'Ilhotas',
    'Centro',
    'Mocambinho',
  ],
  'sao luis': [
    'Renascença',
    'Cohama',
    'Calhau',
    'Ponta d\'Areia',
    'Turu',
    'São Francisco',
    'Olho d\'Água',
    'Cohatrac',
  ],
  'palmas': [
    'Plano Diretor Sul',
    'Plano Diretor Norte',
    'Graciosa',
    'Taquaralto',
    'Jardim Aureny III',
    'Centro',
  ],
};

export const POPULAR_BRAZIL_CITIES = [
  'Brasília-DF',
  'Goiânia-GO',
  'São Paulo-SP',
  'Rio de Janeiro-RJ',
  'Belo Horizonte-MG',
  'Curitiba-PR',
  'Salvador-BA',
  'Fortaleza-CE',
  'Recife-PE',
  'Porto Alegre-RS',
  'Manaus-AM',
  'Belém-PA',
  'Florianópolis-SC',
  'Vitória-ES',
  'Campinas-SP',
  'Cuiabá-MT',
  'Campo Grande-MS',
  'Natal-RN',
  'João Pessoa-PB',
  'Maceió-AL',
];

const DEFAULT_BRAZIL_NEIGHBORHOODS = [
  'Centro',
  'Jardim América',
  'Bela Vista',
  'Vila Nova',
  'Jardim Europa',
  'Alto da Boa Vista',
  'São José',
  'Santo Antônio',
  'Santa Maria',
  'Setor Central',
];

/**
 * Retorna a lista de sugestões rápidas de bairros/regiões de acordo com a cidade informada.
 */
export function getSuggestedNeighborhoodsForCity(
  cityInput: string,
  dynamicViaCepNeighborhoods: string[] = [],
  detectedNeighborhoodFromCep?: string
): string[] {
  const raw = normalizeText(cityInput || '');
  // Separa nome da cidade da sigla UF (ex: "Brasília - DF" ou "Brasília-DF" ou "Brasília/DF")
  const parts = raw.split(/[-/,]/).map((p) => p.trim()).filter(Boolean);
  const cityNamePart = parts[0] || '';
  const ufPart = parts[1] || '';

  let baseList: string[] = [];

  // Caso especial: qualquer menção a Brasília, DF ou regiões administrativas do DF
  if (
    cityNamePart.includes('brasilia') ||
    ufPart === 'df' ||
    raw === 'df' ||
    raw.includes('distrito federal') ||
    ['taguatinga', 'ceilandia', 'guara', 'aguas claras', 'samambaia', 'gama', 'sobradinho'].includes(cityNamePart)
  ) {
    baseList = BRAZIL_CITY_NEIGHBORHOODS['brasilia'];
  } else if (cityNamePart && BRAZIL_CITY_NEIGHBORHOODS[cityNamePart]) {
    baseList = BRAZIL_CITY_NEIGHBORHOODS[cityNamePart];
  } else {
    // Tenta match parcial na chave
    const matchedKey = Object.keys(BRAZIL_CITY_NEIGHBORHOODS).find(
      (k) => cityNamePart.includes(k) || k.includes(cityNamePart)
    );
    if (matchedKey && cityNamePart.length >= 3) {
      baseList = BRAZIL_CITY_NEIGHBORHOODS[matchedKey];
    } else if (dynamicViaCepNeighborhoods.length > 0) {
      baseList = dynamicViaCepNeighborhoods;
    } else {
      baseList = DEFAULT_BRAZIL_NEIGHBORHOODS;
    }
  }

  const combined = [
    ...(detectedNeighborhoodFromCep && detectedNeighborhoodFromCep.trim()
      ? [detectedNeighborhoodFromCep.trim()]
      : []),
    ...baseList,
  ];

  // Remove duplicados preservando a ordem
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const item of combined) {
    const key = normalizeText(item);
    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(item.trim());
    }
  }

  return unique.slice(0, 16);
}

/**
 * Caso a pessoa digite uma cidade do interior/Brasil que não esteja no mapa pré-configurado,
 * consulta o ViaCEP para descobrir bairros reais daquela cidade e UF.
 */
export async function fetchNeighborhoodsByCityFromViaCep(cityAndUf: string): Promise<string[]> {
  const parts = cityAndUf.split(/[-/]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return [];
  const city = parts[0];
  const uf = parts[1].toUpperCase();
  if (uf.length !== 2 || city.length < 3) return [];

  // Se já existe na base curada, não precisa gastar requisição
  const normCity = normalizeText(city);
  if (normCity.includes('brasilia') || uf === 'DF' || BRAZIL_CITY_NEIGHBORHOODS[normCity]) {
    return [];
  }

  try {
    const res = await fetch(
      `https://viacep.com.br/ws/${encodeURIComponent(uf)}/${encodeURIComponent(city)}/Avenida/json/`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    const bairros = Array.from(
      new Set(
        data
          .map((item: any) => (typeof item.bairro === 'string' ? item.bairro.trim() : ''))
          .filter(Boolean)
      )
    );
    return bairros.slice(0, 12);
  } catch {
    return [];
  }
}

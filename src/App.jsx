import React, { useEffect, useState, useRef } from 'react';

const GENERATIONS = ['Bakuten', 'MFB', 'Burst', 'X'];
const FILTER_TYPES = ['Attaque', 'Défense', 'Endurance', 'Équilibre'];
const FILTER_ROTATIONS = ['Droite', 'Gauche', 'Double'];
const FILTER_POIDS = ['0 à 20', '20 à 40', '40 à 60', '60+'];

const typeIcons = {
  'Attaque': 'https://static.wikia.nocookie.net/beyblade/images/c/cd/Attack_logo_Beyblade_X.png',
  'Défense': 'https://static.wikia.nocookie.net/beyblade/images/5/5d/Defense_logo_Beyblade_X.png',
  'Endurance': 'https://static.wikia.nocookie.net/beyblade/images/3/39/Stamina_logo_Beyblade_X.png',
  'Équilibre': 'https://static.wikia.nocookie.net/beyblade/images/e/ee/Balance_logo_Beyblade_X.png',
};

const rotationIcons = {
  'Droite': 'https://static.wikia.nocookie.net/beyblade/images/5/58/Spin-right.png',
  'Gauche': 'https://static.wikia.nocookie.net/beyblade/images/c/cd/Spin-left.png',
  'Double': 'https://static.wikia.nocookie.net/beyblade/images/e/ed/Dual-spin.png',
};

const getTypeColor = (type) => {
  switch (type) {
    case 'Attaque': return '#3d6bff';
    case 'Défense': return '#31a845';
    case 'Endurance': return '#e3b413';
    case 'Équilibre': return '#ea3618';
    default: return 'bg-gray-500';
  }
};

const getRotationColor = (rotation) => {
  switch (rotation) {
    case 'Droite': return '#ff8421';
    case 'Gauche': return '#ae1f1f';
    case 'Double': return '#5838a1';
    default: return 'bg-gray-500';
  }
};

const getPoidsColor = (poids) => {
  return '#454c56';
};

export default function App() {
  const dropdownRef = useRef(null);
  const [dropdownHeight, setDropdownHeight] = useState(0);
  const [beys, setBeys] = useState([]);
  const [selected, setSelected] = useState(null);
  const [currentGen, setCurrentGen] = useState('Toutes');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState([]);
  const [filterRota, setFilterRota] = useState([]);
  const [filterEtat, setFilterEtat] = useState([]);
  const [filterPoids, setFilterPoids] = useState([]);
  const [filterOpen, setFilterOpen] = useState(null);
  const [owned, setOwned] = useState(() => JSON.parse(localStorage.getItem('ownedBeys')) || {});

  useEffect(() => {
    if (filterOpen && dropdownRef.current) {
      const height = dropdownRef.current.offsetHeight;
      setDropdownHeight(height + 10);
    } else {
      setDropdownHeight(0);
    }
  }, [filterOpen]);

  useEffect(() => {
    async function fetchData() {
      const results = await Promise.all(GENERATIONS.map(gen =>
        fetch(`/data/${gen.toLowerCase()}.json`).then(res => res.json().then(data => data.map(bey => ({ ...bey, generation: gen }))))
      ));
      const merged = results.flat();
      setBeys(merged);
    }
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem('ownedBeys', JSON.stringify(owned));
  }, [owned]);
  
  const toggleOwned = (name, brand) => {
    const prev = owned[name] || { Hasbro: false, Takara: false };
    setOwned({ ...owned, [name]: { ...prev, [brand]: !prev[brand] } });
  };

  const isOwned = (name) => owned[name]?.Hasbro || owned[name]?.Takara;

  const countByGen = (gen) => {
    const total = beys.filter(b => b.generation === gen).length;
    const ownedCount = beys.filter(b => b.generation === gen && isOwned(b.name)).length;
    return `${ownedCount}/${total}`;
  };

  const matchPoids = (poids, range) => {
    const p = parseInt(poids || '0');
    if (range === '0 à 20') return p <= 20;
    if (range === '20 à 40') return p > 20 && p <= 40;
    if (range === '40 à 60') return p > 40 && p <= 60;
    if (range === '60+') return p > 60;
    return false;
  };

  const filtered = beys.filter(b => {
    const inGen = currentGen === 'Toutes' || b.generation === currentGen;
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType.length === 0 || filterType.includes(b.type);
    const matchesRota = filterRota.length === 0 || filterRota.includes(b.rotation);
    const matchesPoids = filterPoids.length === 0 || filterPoids.some(range => matchPoids(b.poids, range));
    const isPossessed = isOwned(b.name);
    const matchesEtat =
      filterEtat.length === 0 ||
      (filterEtat.includes('Possédée') && isPossessed) ||
      (filterEtat.includes('Non possédée') && !isPossessed);
    return inGen && matchesSearch && matchesType && matchesRota && matchesPoids && matchesEtat;
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!filtered.length) return;
      const index = filtered.findIndex(b => b.name === selected?.name);
      if (e.key === 'ArrowDown') {
        const next = filtered[(index + 1) % filtered.length];
        setSelected(next);
      } else if (e.key === 'ArrowUp') {
        const prev = filtered[(index - 1 + filtered.length) % filtered.length];
        setSelected(prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selected]);

  const toggleMulti = (filter, setter, value) => {
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const allFilters = ['Type', 'Rotation', 'Poids', 'Etat'];

  return (
    <div className="flex h-screen">
      <div className="w-1/4 bg-gray-700 p-4 border-r border-white text-sm">
        <h1 className="text-lg font-bold mb-2">Ma collection Beyblade</h1>
        <div className="space-y-1 mb-4">
          <button onClick={() => setCurrentGen('Toutes')} className={`w-full text-left rounded px-2 py-1 ${currentGen === 'Toutes' ? 'bg-blue-500' : 'bg-blue-800'}`}>
            Toutes ({GENERATIONS.map(g => countByGen(g).split('/')[0]).reduce((a,b) => +a + +b, 0)}/{beys.length})
          </button>
          {GENERATIONS.map(g => (
            <button key={g} onClick={() => setCurrentGen(g)} className={`w-full text-left rounded px-2 py-1 ${currentGen === g ? 'bg-blue-500' : 'bg-blue-800'}`}>
              {g} ({countByGen(g)})
            </button>
          ))}
        </div>

        <div className="mb-2 font-semibold">Filtre</div>
        <div className="flex flex-wrap gap-2 relative">
          {allFilters.map(cat => (
            <div key={cat} className="relative">
              <button
                onClick={() => setFilterOpen(filterOpen === cat ? null : cat)}
                className="bg-gray-500 px-3 py-1 rounded"
              >
                {cat}
              </button>
              {filterOpen === cat && (
                <div className="absolute left-0 top-full mt-1 w-48 z-10">
                  <div ref={dropdownRef} className="bg-gray-600 rounded-lg p-3 space-y-2 shadow-lg">
                    {(cat === 'Type' ? FILTER_TYPES :
                      cat === 'Rotation' ? FILTER_ROTATIONS :
                      cat === 'Etat' ? ['Possédée', 'Non possédée'] :
                      FILTER_POIDS
                    ).map(opt => (
                      <label key={opt} className="block">
                        <input type="checkbox" className="mr-1"
                          checked={
                            (cat === 'Type' && filterType.includes(opt)) ||
                            (cat === 'Rotation' && filterRota.includes(opt)) ||
                            (cat === 'Etat' && filterEtat.includes(opt)) ||
                            (cat === 'Poids' && filterPoids.includes(opt))
                          }
                          onChange={() =>
                            cat === 'Type' ? toggleMulti(filterType, setFilterType, opt) :
                            cat === 'Rotation' ? toggleMulti(filterRota, setFilterRota, opt) :
                            cat === 'Etat' ? toggleMulti(filterEtat, setFilterEtat, opt) :
                            toggleMulti(filterPoids, setFilterPoids, opt)
                          }
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ height: dropdownHeight }} />

        <div className="mt-2">
          <label className="block font-semibold mb-1">Rechercher</label>
          <input
            type="text"
            placeholder="Tape le nom"
            className="w-full px-2 py-1 rounded text-black"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-1">
      <div className="w-1/2 p-4 space-y-2 overflow-y-auto">
        {filtered.map(b => (
          <div
            key={b.name}
            className={`p-2 rounded flex justify-between items-center cursor-pointer transition-colors duration-200
              ${selected?.name === b.name ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
            onClick={() => setSelected(b)}
          >
            <div>{b.name}</div>
            <div className="text-xs">
              <label className="mr-2">
                <input type="checkbox" checked={owned[b.name]?.Hasbro || false} onChange={(e) => { e.stopPropagation(); toggleOwned(b.name, 'Hasbro'); }} /> Hasbro
              </label>
              <label>
                <input type="checkbox" checked={owned[b.name]?.Takara || false} onChange={(e) => { e.stopPropagation(); toggleOwned(b.name, 'Takara'); }} /> Takara Tomy
              </label>
            </div>
          </div>
        ))}
      </div>

        <div className="w-1/2 p-4 bg-gray-900 border-l border-white">
          {selected ? (
            <div>
              <div className="text-xl font-bold text-center bg-blue-900 py-2 rounded">{selected.name}</div>
              <img src={selected.image} alt={selected.name} className="mx-auto my-10 max-h-64" />
              <div className="flex justify-center gap-2 mb-8 items-center">
                <span style={{ backgroundColor: getTypeColor(selected.type) }} className="flex items-center gap-2 px-4 py-2 text-base font-medium rounded-full">
                <img src={typeIcons[selected.type]} alt="" className="w-5 h-5" />
                {selected.type}
                </span>
              <span style={{ backgroundColor: getRotationColor(selected.rotation) }} className="flex items-center gap-2 px-4 py-2 text-base font-medium rounded-full">
              <img src={rotationIcons[selected.rotation]} alt="" className="w-5 h-5" />
              {selected.rotation}
              </span>
              <span style={{ backgroundColor: getPoidsColor(selected.poids) }} className="flex items-center gap-2 px-4 py-2 text-base font-medium rounded-full text-white">
              <img src="https://i.ibb.co/SXXGbNtc/1176808.png" alt="Poids" className="w-5 h-5" />
              {selected.poids}g
              </span>
              </div>
              <p className="text-sm">{selected.description}</p>
                          {selected?.moreInfoUrl && (
              <div className="mt-6 text-center">
                <a
                  href={selected.moreInfoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 text-white font-semibold px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  En apprendre plus
                </a>
              </div>
              )}  
            </div>          
          ) : (
            <p className="text-center text-gray-400">Clique sur une toupie pour voir les détails</p>
          )}
        </div>
      </div>
    </div>
  );
}

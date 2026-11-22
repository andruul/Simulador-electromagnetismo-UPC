import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Zap,
  RotateCw,
  Compass,
  BookOpen,
  ArrowRight,
  Sparkles,
  Command,
  CornerDownLeft,
  Globe,
  Layers,
  Flame
} from 'lucide-react';
import { TOPICS_DATABASE, type TopicItem } from '../data/topics';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (topic: TopicItem) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTopic
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Reset the search state whenever the modal opens or closes. This adjusts state
  // while rendering (React-recommended pattern) instead of inside an effect.
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    setSelectedIndex(0);
    if (!isOpen) {
      setQuery('');
      setSelectedCategory('all');
    }
  }

  // Focus input when modal opens (side effect on the DOM only; no state updates)
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Changing the filters always returns the highlighted row to the top of the list
  const changeQuery = (value: string) => {
    setQuery(value);
    setSelectedIndex(0);
  };
  const changeCategory = (category: string) => {
    setSelectedCategory(category);
    setSelectedIndex(0);
  };

  // Global Ctrl+K / Cmd+K and Esc listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter topics
  const filteredTopics = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOPICS_DATABASE.filter((topic) => {
      // Category filter
      if (selectedCategory !== 'all' && topic.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;

      // Fuzzy / keyword search matches in title, synopsis, formula, unitName, or tags
      const matchTitle = topic.title.toLowerCase().includes(q);
      const matchSynopsis = topic.synopsis.toLowerCase().includes(q);
      const matchFormula = topic.formula.toLowerCase().includes(q);
      const matchUnit = topic.unitName.toLowerCase().includes(q) || `unidad ${topic.unitNumber}`.includes(q);
      const matchTags = topic.tags.some((tag) => tag.toLowerCase().includes(q));

      return matchTitle || matchSynopsis || matchFormula || matchUnit || matchTags;
    });
  }, [query, selectedCategory]);

  // Handle arrow key navigation in list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredTopics.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredTopics.length);
      scrollIntoView((selectedIndex + 1) % filteredTopics.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredTopics.length) % filteredTopics.length);
      scrollIntoView((selectedIndex - 1 + filteredTopics.length) % filteredTopics.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = filteredTopics[selectedIndex];
      if (chosen) {
        onSelectTopic(chosen);
        onClose();
      }
    }
  };

  const scrollIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-topic-item]');
    const item = items[index] as HTMLElement | undefined;
    if (item) {
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };

  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'electrostatics':
        return <Zap className="w-3.5 h-3.5 text-rose-400" />;
      case 'gauss':
        return <Globe className="w-3.5 h-3.5 text-emerald-400" />;
      case 'capacitor':
        return <Layers className="w-3.5 h-3.5 text-sky-400" />;
      case 'lorentz3d':
        return <RotateCw className="w-3.5 h-3.5 text-indigo-400" />;
      case 'magnetostatics':
        return <Compass className="w-3.5 h-3.5 text-teal-400" />;
      case 'faraday':
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <BookOpen className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'electrostatics':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'gauss':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'capacitor':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'lorentz3d':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'magnetostatics':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'faraday':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 md:pt-20 p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white border border-[#D5CEC6] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#2D2A26]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-[#E0D8CF] bg-[#F5F0E8]">
          <Search className="w-5 h-5 text-[#5B9E8A] mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => changeQuery(e.target.value)}
            placeholder="Buscar por concepto: Coulomb, Gauss, Capacitor, Lorentz, Wien, Ciclotrón..."
            className="w-full bg-transparent border-0 outline-none text-[#2D2A26] placeholder-[#A89E94] text-sm md:text-base font-sans"
          />
          {query ? (
            <button
              onClick={() => changeQuery('')}
              className="p-1 text-[#6B6560] hover:text-[#2D2A26] rounded-md cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-white border border-[#D5CEC6] text-[10px] text-[#6B6560] font-mono">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-[#FAFAF7] border-b border-[#E0D8CF] overflow-x-auto text-xs select-none">
          <span className="text-[11px] text-[#A89E94] font-medium mr-1">Filtrar:</span>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'electrostatics', label: 'Electrostática' },
            { id: 'gauss', label: 'Ley de Gauss' },
            { id: 'capacitor', label: 'Capacitancia' },
            { id: 'lorentz3d', label: 'Lorentz 3D' },
            { id: 'magnetostatics', label: 'Magnetostática' },
            { id: 'faraday', label: 'Faraday & Lenz' },
            { id: 'theory', label: 'Teoría / Leyes' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => changeCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs font-medium whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-[#5B9E8A]/15 text-[#3D7A69] border border-[#5B9E8A]/40 shadow-sm'
                  : 'text-[#6B6560] hover:text-[#2D2A26] hover:bg-[#EDE8DF]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto p-3 space-y-2 divide-y divide-[#E0D8CF]/60"
        >
          {filteredTopics.length > 0 ? (
            filteredTopics.map((topic, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={topic.id}
                  data-topic-item
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    onSelectTopic(topic);
                    onClose();
                  }}
                  className={`pt-2 p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-[#EDE8DF] border-[#5B9E8A]/50 shadow-md'
                      : 'border-transparent hover:bg-[#F5F0E8]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {topic.unitName}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border flex items-center gap-1 ${getCategoryBadgeClass(
                          topic.category
                        )}`}
                      >
                        {getCategoryIcon(topic.category)}
                        {topic.badge}
                      </span>
                      <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                        {topic.title}
                      </h3>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTopic(topic);
                        onClose();
                      }}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>Cargar Simulación</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{topic.synopsis}</p>

                  {topic.simpleExplanation && (
                    <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200/90 flex items-start gap-1.5">
                      <span className="font-semibold text-emerald-400 shrink-0">💡 En simple:</span>
                      <span className="text-slate-300">{topic.simpleExplanation}</span>
                    </div>
                  )}

                  {topic.formula && (
                    <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 font-mono text-[11px] text-emerald-300/90 flex items-center justify-between overflow-x-auto">
                      <span>{topic.formula}</span>
                      <span className="text-[9px] text-slate-500 font-sans ml-2">Fórmula clave</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-medium">No se encontraron temas con &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-500">
                Prueba buscando términos como: <code className="text-emerald-400">coulomb</code>,{' '}
                <code className="text-emerald-400">lorentz</code>, <code className="text-emerald-400">wien</code>,{' '}
                <code className="text-emerald-400">biot</code> o <code className="text-emerald-400">ampere</code>.
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">
                ↑
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">
                ↓
              </span>{' '}
              Navegar
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3 text-slate-400" /> Cargar práctica
            </span>
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">
                ESC
              </span>{' '}
              Cerrar
            </span>
          </div>

          <span className="text-slate-500 hidden sm:inline-block">
            {filteredTopics.length} tema{filteredTopics.length === 1 ? '' : 's'} disponible{filteredTopics.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>
  );
};

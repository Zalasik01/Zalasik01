import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  initialQuery?: string;
  initialType?: string;
  large?: boolean;
}

export default function SearchBar({ initialQuery = '', initialType = '', large = false }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const params = new URLSearchParams({ q: query.trim() });
    if (type) params.set('type', type);
    navigate(`/search?${params.toString()}`);
  };

  if (large) {
    return (
      <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
        <div className="bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 p-1.5 rounded-2xl shadow-lg shadow-brand-600/20">
          <div className="flex flex-col sm:flex-row gap-1.5 bg-white/10 rounded-xl">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a48e4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome, CNPJ ou nº de processo..."
                className="w-full pl-12 pr-4 py-4 text-base bg-white rounded-lg sm:rounded-l-lg sm:rounded-r-none focus:outline-none placeholder-gray-400"
              />
            </div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="sm:w-44 px-4 py-4 text-sm bg-white sm:rounded-none focus:outline-none text-gray-700 rounded-lg"
            >
              <option value="">Todos os tipos</option>
              <option value="person">Pessoa Fisica</option>
              <option value="company">Pessoa Juridica</option>
            </select>
            <button
              type="submit"
              className="px-8 py-4 bg-brand-700 text-white font-semibold rounded-lg sm:rounded-l-none sm:rounded-r-lg hover:bg-brand-800 active:bg-brand-900 transition-colors whitespace-nowrap"
            >
              Buscar
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full max-w-2xl">
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar nome, CNPJ ou processo..."
          className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-gray-400"
        />
      </div>
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-700"
      >
        <option value="">Todos</option>
        <option value="person">Pessoa Fisica</option>
        <option value="company">Pessoa Juridica</option>
      </select>
      <button
        type="submit"
        className="px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors whitespace-nowrap"
      >
        Buscar
      </button>
    </form>
  );
}

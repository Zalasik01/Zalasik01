interface Props {
  status: string;
  size?: 'sm' | 'md';
}

const config: Record<string, { label: string; classes: string }> = {
  active: { label: 'Ativo', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  inactive: { label: 'Inativo', classes: 'bg-gray-100 text-gray-600 border border-gray-200' },
  suspended: { label: 'Suspenso', classes: 'bg-red-50 text-red-700 border border-red-100' },
  'Em andamento': { label: 'Em andamento', classes: 'bg-blue-50 text-blue-700 border border-blue-100' },
  Suspenso: { label: 'Suspenso', classes: 'bg-amber-50 text-amber-700 border border-amber-100' },
  Arquivado: { label: 'Arquivado', classes: 'bg-gray-100 text-gray-600 border border-gray-200' },
  Concluido: { label: 'Concluido', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  Acordo: { label: 'Acordo', classes: 'bg-purple-50 text-purple-700 border border-purple-100' },
};

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const cfg = config[status] || { label: status, classes: 'bg-gray-100 text-gray-600 border border-gray-200' };
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

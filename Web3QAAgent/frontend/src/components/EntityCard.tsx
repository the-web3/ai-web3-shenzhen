import React from 'react';
import { motion } from 'motion/react';
import { Tag, MapPin, Calendar, DollarSign, Hash, User, Building, Stethoscope, Pill } from 'lucide-react';

interface Entity {
  type: string;
  value: string;
  role: string;
  highlight: string;
}

interface EntityCardProps {
  entity: Entity;
  onHover: (highlight: string) => void;
  onLeave: () => void;
}

const getEntityIcon = (type: string) => {
  switch (type) {
    case 'Person': return User;
    case 'Organization': return Building;
    case 'Location': return MapPin;
    case 'Date': return Calendar;
    case 'Money': return DollarSign;
    case 'Number': return Hash;
    case 'Condition': return Stethoscope;
    case 'Medication': return Pill;
    default: return Tag;
  }
};

const getEntityColor = (type: string) => {
  switch (type) {
    case 'Person': return 'from-blue-500 to-blue-600';
    case 'Organization': return 'from-purple-500 to-purple-600';
    case 'Location': return 'from-green-500 to-green-600';
    case 'Date': return 'from-orange-500 to-orange-600';
    case 'Money': return 'from-emerald-500 to-emerald-600';
    case 'Number': return 'from-cyan-500 to-cyan-600';
    case 'Measurement': return 'from-teal-500 to-teal-600';
    case 'Duration': return 'from-amber-500 to-amber-600';
    case 'Product': return 'from-pink-500 to-pink-600';
    case 'Species': return 'from-lime-500 to-lime-600';
    case 'Percentage': return 'from-violet-500 to-violet-600';
    case 'Condition': return 'from-red-500 to-red-600';
    case 'Medication': return 'from-indigo-500 to-indigo-600';
    case 'Procedure': return 'from-fuchsia-500 to-fuchsia-600';
    default: return 'from-gray-500 to-gray-600';
  }
};

export function EntityCard({ entity, onHover, onLeave }: EntityCardProps) {
  const Icon = getEntityIcon(entity.type);
  const colorClass = getEntityColor(entity.type);

  return (
    <motion.div
      onMouseEnter={() => onHover(entity.highlight)}
      onMouseLeave={onLeave}
      className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-900 break-words">
            {entity.value}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {entity.role}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

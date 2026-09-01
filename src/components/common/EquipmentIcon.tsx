import React from 'react';
import { Shovel, Truck, Construction, Cog, Hammer } from 'lucide-react';

interface EquipmentIconProps {
  type: string;
  className?: string;
  size?: number;
}

export const EquipmentIcon: React.FC<EquipmentIconProps> = ({ type, className = 'w-5 h-5', size = 20 }) => {
  switch (type) {
    case 'Excavator':
      return <Construction className={className} size={size} />;
    case 'Bulldozer':
      return <Truck className={className} size={size} />;
    case 'Crane':
      return <Hammer className={className} size={size} />;
    case 'Grader':
      return <Shovel className={className} size={size} />;
    case 'Wheel Loader':
      return <Cog className={className} size={size} />;
    default:
      return <Construction className={className} size={size} />;
  }
};

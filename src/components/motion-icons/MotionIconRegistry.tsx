import React from 'react';
import PlugConnectedIcon from './PlugConnectedIcon';
import Cloud1Icon from './Cloud1Icon';
import { AnimatedIconProps } from './types';

export const MOTION_ICON_MAP: Record<string, React.ForwardRefExoticComponent<AnimatedIconProps & React.RefAttributes<any>>> = {
  'plug-connected': PlugConnectedIcon,
  'cloud': Cloud1Icon,
  'connection': PlugConnectedIcon,
  'network': PlugConnectedIcon,
  'system': PlugConnectedIcon,
  'environment': Cloud1Icon,
  'weather': Cloud1Icon,
  'dream': Cloud1Icon,
  'thought': Cloud1Icon,
};

export const findBestMotionIcon = (intent: string): string | null => {
  const lower = intent.toLowerCase();
  
  if (lower.includes('plug') || lower.includes('connect') || lower.includes('network') || lower.includes('system')) return 'plug-connected';
  if (lower.includes('cloud') || lower.includes('environment') || lower.includes('dream') || lower.includes('nature')) return 'cloud';
  
  return null;
};

interface MotionIconProps extends AnimatedIconProps {
  name: string;
}

export const MotionIcon: React.FC<MotionIconProps> = ({ name, ...props }) => {
  const IconComponent = MOTION_ICON_MAP[name];
  if (!IconComponent) return null;
  return <IconComponent {...props} />;
};

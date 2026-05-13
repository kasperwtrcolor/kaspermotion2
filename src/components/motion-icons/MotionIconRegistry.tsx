import React from 'react';
import PlugConnectedIcon from './PlugConnectedIcon';
import Cloud1Icon from './Cloud1Icon';
import RocketIcon from './RocketIcon';
import ChartLineIcon from './ChartLineIcon';
import GithubIcon from './GithubIcon';
import HeartIcon from './HeartIcon';
import StarIcon from './StarIcon';
import { AnimatedIconProps } from './types';

export const MOTION_ICON_MAP: Record<string, React.ForwardRefExoticComponent<AnimatedIconProps & React.RefAttributes<any>>> = {
  'plug-connected': PlugConnectedIcon,
  'cloud': Cloud1Icon,
  'rocket': RocketIcon,
  'chart-line': ChartLineIcon,
  'github': GithubIcon,
  'heart': HeartIcon,
  'star': StarIcon,
  // Aliases
  'connection': PlugConnectedIcon,
  'network': PlugConnectedIcon,
  'system': PlugConnectedIcon,
  'environment': Cloud1Icon,
  'weather': Cloud1Icon,
  'dream': Cloud1Icon,
  'thought': Cloud1Icon,
  'launch': RocketIcon,
  'start': RocketIcon,
  'growth': ChartLineIcon,
  'data': ChartLineIcon,
  'analytics': ChartLineIcon,
  'social': GithubIcon,
  'community': GithubIcon,
  'love': HeartIcon,
  'like': HeartIcon,
  'favorite': StarIcon,
  'win': StarIcon,
  'victory': StarIcon,
  'secure': PlugConnectedIcon, // Fallback for now
  'alert': PlugConnectedIcon,  // Fallback for now
};

export const findBestMotionIcon = (intent: string): string | null => {
  const lower = intent.toLowerCase();
  
  if (lower.includes('plug') || lower.includes('connect') || lower.includes('network') || lower.includes('system')) return 'plug-connected';
  if (lower.includes('cloud') || lower.includes('environment') || lower.includes('dream') || lower.includes('nature')) return 'cloud';
  if (lower.includes('launch') || lower.includes('start') || lower.includes('rocket') || lower.includes('boost')) return 'rocket';
  if (lower.includes('growth') || lower.includes('chart') || lower.includes('data') || lower.includes('analytics') || lower.includes('result')) return 'chart-line';
  if (lower.includes('social') || lower.includes('github') || lower.includes('community') || lower.includes('code')) return 'github';
  if (lower.includes('love') || lower.includes('heart') || lower.includes('like') || lower.includes('passion')) return 'heart';
  if (lower.includes('favorite') || lower.includes('star') || lower.includes('win') || lower.includes('victory') || lower.includes('success')) return 'star';
  
  // Broad matching fallbacks
  if (lower.includes('secure') || lower.includes('safe') || lower.includes('shield')) return 'plug-connected';
  if (lower.includes('idea') || lower.includes('creative') || lower.includes('bulb')) return 'rocket'; 
  
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

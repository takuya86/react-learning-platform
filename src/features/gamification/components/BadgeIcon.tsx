/**
 * バッジアイコンコンポーネント
 * アイコンIDからlucide-reactアイコンへのマッピング
 */

import {
  Sprout,
  BookOpen,
  Search,
  GraduationCap,
  Crown,
  Leaf,
  Flame,
  Gem,
  Star,
  Brain,
  Dumbbell,
  Award,
  type LucideIcon,
} from 'lucide-react';

// アイコンIDとlucide-reactアイコンのマッピング
const ICON_MAP: Record<string, LucideIcon> = {
  sprout: Sprout,
  'book-open': BookOpen,
  search: Search,
  'graduation-cap': GraduationCap,
  crown: Crown,
  leaf: Leaf,
  flame: Flame,
  gem: Gem,
  star: Star,
  brain: Brain,
  dumbbell: Dumbbell,
  award: Award,
};

interface BadgeIconProps {
  icon: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function BadgeIcon({ icon, size = 20, className, style }: BadgeIconProps) {
  const IconComponent = ICON_MAP[icon] || Award;
  return <IconComponent size={size} className={className} style={style} />;
}

// Icons werden per Name aus den JSON-Dateien/Modi geladen. Damit nicht die ganze Bibliothek
// im Bundle landet, steht hier eine kuratierte Liste. Unbekannte Namen → Funken-Symbol.
import {
  Activity, ArrowLeftRight, Award, BarChart3, BookOpen, Blocks, Briefcase, Building2, Calculator, Calendar,
  Check, ChevronLeft, ChevronRight, Clock, Cpu, Crown, FileSignature, FileText, Flame, FlaskConical, Gamepad2,
  Gavel, GraduationCap, Hammer, Handshake, Heart, Home, Landmark, Languages, Layers, Lightbulb, Lock, Map,
  Pencil, Play, Plus, Rocket, Route, Scale, School, ScrollText, Search, Settings, Shield, ShoppingCart, Sparkles,
  Star, Stethoscope, Target, TrendingUp, Trophy, User, Users, Volume2, VolumeX, Wrench, X, Zap, Euro, Globe,
  GalleryHorizontal, Info, RotateCcw, Timer, Unlock, ListOrdered, Medal, Smartphone, Download, Trash2, Eye,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  activity: Activity, 'arrow-left-right': ArrowLeftRight, award: Award, 'bar-chart': BarChart3, 'book-open': BookOpen,
  book: BookOpen, blocks: Blocks, briefcase: Briefcase, building: Building2, calculator: Calculator, calendar: Calendar,
  check: Check, 'chevron-left': ChevronLeft, 'chevron-right': ChevronRight, clock: Clock, cpu: Cpu, crown: Crown,
  'file-signature': FileSignature, 'file-text': FileText, flame: Flame, flask: FlaskConical, gamepad: Gamepad2,
  gavel: Gavel, 'graduation-cap': GraduationCap, hammer: Hammer, handshake: Handshake, heart: Heart, home: Home,
  landmark: Landmark, languages: Languages, layers: Layers, lightbulb: Lightbulb, lock: Lock, map: Map,
  pencil: Pencil, play: Play, plus: Plus, rocket: Rocket, route: Route, scale: Scale, school: School,
  scroll: ScrollText, search: Search, settings: Settings, shield: Shield, cart: ShoppingCart, sparkles: Sparkles,
  star: Star, stethoscope: Stethoscope, target: Target, 'trending-up': TrendingUp, trophy: Trophy, user: User,
  users: Users, volume: Volume2, 'volume-off': VolumeX, wrench: Wrench, x: X, zap: Zap, euro: Euro, globe: Globe,
  'gallery-horizontal': GalleryHorizontal, info: Info, reset: RotateCcw, timer: Timer, unlock: Unlock,
  'list-ordered': ListOrdered, medal: Medal, phone: Smartphone, download: Download, trash: Trash2, eye: Eye,
};

export function Icon({ name, size = 20, className, strokeWidth = 2 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  const C = ICONS[name] ?? Sparkles;
  return <C size={size} className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}

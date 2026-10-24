import {
  LayoutGrid,
  UserRound,
  Crown,
  House,
  Wrench,
  UsersRound,
  Sprout,
  Lightbulb,
  Languages,
  TreePine,
  Backpack,
} from "lucide-react";
import { I } from "../Icons";
const icons: Record<string, typeof LayoutGrid> = {
  LayoutGrid,
  UserRound,
  Crown,
  House,
  Wrench,
  UsersRound,
  Sprout,
  Lightbulb,
  Languages,
  TreePine,
  Backpack,
};
export function HomeIcon({ name, size = 20 }: { name: string; size?: number }) {
  const Icon = icons[name];
  return Icon ? (
    <Icon size={size} aria-hidden="true" />
  ) : (
    <I name={name} size={size} />
  );
}

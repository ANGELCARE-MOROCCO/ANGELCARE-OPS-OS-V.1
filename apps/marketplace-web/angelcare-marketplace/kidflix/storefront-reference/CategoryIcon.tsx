import { Eye, Share2, LayoutGrid, List, UserRound, Users } from "lucide-react";
import { I as Native } from "../Icons";
const extra: Record<string, typeof Eye> = {
  Eye,
  Share2,
  LayoutGrid,
  List,
  UserRound,
  Users,
};
export function I({
  name,
  size = 20,
  ...props
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = extra[name];
  return Icon ? (
    <Icon size={size} aria-hidden="true" {...props} />
  ) : (
    <Native name={name} size={size} {...props} />
  );
}

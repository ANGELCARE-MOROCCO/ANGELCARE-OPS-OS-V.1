export function Pill({ label, cls }) {
  return <span className={cls || 'pill'}>{label}</span>;
}

export function Topbar({ title, actions }: { title: string; actions?: React.ReactNode }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-6">
      <h1 className="font-serif text-xl text-fg-0">{title}</h1>
      <div className="flex items-center gap-2">{actions}</div>
    </header>
  );
}

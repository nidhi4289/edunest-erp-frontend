export default function PageHeader({title, subtitle, right}:{title:string;subtitle?:string;right?:React.ReactNode}) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

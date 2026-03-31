import Image from "next/image";

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  tone: "seat" | "reserve" | "cancel";
}

export function StatCard({ icon, label, value, tone }: StatCardProps) {
  return (
    <article className={`stat-card stat-card-${tone}`}>
      <div className="stat-card-icon flex justify-center">
        <Image src={icon} alt="" width={40} height={40} />
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
    </article>
  );
}
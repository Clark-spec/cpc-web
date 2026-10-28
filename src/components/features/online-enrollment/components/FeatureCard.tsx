import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
};

export function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
  return (
    <div className={cn("enroll-card p-6 group cursor-pointer", className)}>
      <div className="enroll-card-icon group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="enroll-card-title">{title}</h3>
      <p className="enroll-card-description">{description}</p>
    </div>
  );
}
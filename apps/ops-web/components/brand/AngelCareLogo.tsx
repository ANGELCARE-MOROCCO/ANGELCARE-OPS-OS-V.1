import Image from "next/image";

type AngelCareLogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
};

const sizeMap = {
  sm: { width: 42, height: 42 },
  md: { width: 64, height: 64 },
  lg: { width: 96, height: 96 },
};

export default function AngelCareLogo({
  size = "md",
  className = "",
  showText = false,
}: AngelCareLogoProps) {
  const dims = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <Image
        src="/logo.png"
        alt="AngelCare official logo"
        width={dims.width}
        height={dims.height}
        priority={size === "lg"}
        className="shrink-0 object-contain"
      />
      {showText ? (
        <div className="leading-tight">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-950">
            AngelCare
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Operations System
          </p>
        </div>
      ) : null}
    </div>
  );
}

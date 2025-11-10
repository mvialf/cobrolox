import { rutHelpers } from "@/lib/rut-validations";

interface CustomerNameInfoProps {
  rut: string;
  razonSocial: string;
  tradeName?: string;
  className?: string;
  rutClassName?: string;
  razonSocialClassName?: string;
}

export function CustomerNameInfo({
  rut,
  razonSocial,
  tradeName,
  className,
  rutClassName,
  razonSocialClassName,
}: CustomerNameInfoProps) {
  return (
    <div className={className}>
      <p className={rutClassName || "text-xs text-muted-foreground"}>
        {rutHelpers.format(rut)}
        {tradeName ? ` - ${tradeName}` : ""}
      </p>
      <p className={razonSocialClassName || "text-xs"}>{razonSocial}</p>
    </div>
  );
}

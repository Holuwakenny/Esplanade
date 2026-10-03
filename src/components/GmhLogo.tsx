import React from "react";
import { GMH_LOGO_SVG } from "../utils/gmhLogoAsset";

interface GmhLogoProps {
  className?: string;
  variant?: "full" | "compact";
}

export const GmhLogo: React.FC<GmhLogoProps> = ({ className = "h-14 w-auto", variant = "full" }) => {
  return (
    <div
      className={`inline-block overflow-hidden rounded-lg shadow-sm ${className}`}
      dangerouslySetInnerHTML={{ __html: GMH_LOGO_SVG }}
      title="GMH Luxury – 11 Years (Built by Vision, Sustained by Trust)"
    />
  );
};

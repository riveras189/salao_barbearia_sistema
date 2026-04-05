"use client";

import { useState } from "react";
import FotoUploadField from "@/components/FotoUploadField";

type SiteImageFieldProps = {
  label: string;
  folder: "banners" | "galeria";
  defaultValue?: string | null;
  previewName?: string;
};

export default function SiteImageField({
  label,
  folder,
  defaultValue,
  previewName,
}: SiteImageFieldProps) {
  const [value, setValue] = useState(defaultValue ?? "");

  return (
    <FotoUploadField
      label={label}
      folder={folder}
      value={value}
      onChange={setValue}
      previewName={previewName}
      inputName="imagemUrl"
    />
  );
}
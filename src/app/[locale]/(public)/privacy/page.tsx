import type { Metadata } from "next";
import PrivacyView from "./PrivacyView";

export const metadata: Metadata = {
  title: "Política de Privacidad y Protección de Datos · MARSYS UCN",
  description:
    "Tratamiento de datos personales de conformidad con la Ley N° 21.719 de Chile en la plataforma MARSYS de la Facultad de Ciencias del Mar, Universidad Católica del Norte.",
};

export default function PrivacyPage() {
  return <PrivacyView />;
}

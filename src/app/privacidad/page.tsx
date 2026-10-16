import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidad | Etiquétame",
  description:
    "Cómo Etiquétame utiliza y protege los datos que compartís al consultar por un pedido.",
};

export default function PrivacyPage() {
  return (
    <main className="privacy-page">
      <Link className="privacy-back" href="/">
        Volver a Etiquétame
      </Link>
      <p className="eyebrow">Tus datos, cuidados</p>
      <h1>Política de privacidad</h1>
      <p>
        Etiquétame solicita tu nombre, teléfono, los detalles de tu consulta y,
        si los adjuntás, archivos de referencia para responder y preparar el
        pedido que nos enviaste.
      </p>
      <h2>Uso y conservación</h2>
      <p>
        Usamos esos datos únicamente para comunicarnos con vos, cotizar y dar
        seguimiento a tu pedido. No los vendemos ni los usamos para enviarte
        publicidad. Los conservamos mientras sean necesarios para gestionar la
        consulta y cumplir con obligaciones legales.
      </p>
      <h2>Acceso y seguridad</h2>
      <p>
        El acceso a los pedidos está limitado al equipo autorizado de
        Etiquétame. La información se procesa mediante servicios de
        infraestructura digital que pueden alojar datos fuera de Argentina.
      </p>
      <h2>Tus derechos</h2>
      <p>
        Podés solicitar acceso, actualización o eliminación de tus datos
        personales de acuerdo con la Ley 25.326. Para hacerlo, escribinos por el
        mismo canal por el que coordinaste tu pedido. La Agencia de Acceso a la
        Información Pública, órgano de control de la Ley 25.326, recibe
        denuncias y reclamos relacionados con la protección de datos.
      </p>
      <p className="privacy-updated">Última actualización: octubre de 2026.</p>
    </main>
  );
}

import { ETIQUETAS_DE_IDIOMA, IDIOMA_BASE, idiomaDeLaEtiqueta, type Idioma } from '@maun/domain';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';

import {
  PantallaDeLaVista,
  useMandarLaEntrega,
  useVistaCompartida,
} from '@/entities/vista-cliente';
import { comoSeVeEnWhatsapp } from '@/features/compartir-con-el-cliente';

function idiomaDeLaPagina(): Idioma {
  return idiomaDeLaEtiqueta(document.documentElement.lang) ?? IDIOMA_BASE;
}

export function VistaPublicaPage() {
  const { token = '' } = useParams();
  const resultado = useVistaCompartida(token);
  const mandar = useMandarLaEntrega(token);
  const [deEspera] = useState(idiomaDeLaPagina);
  const lista = resultado.estado === 'lista' ? resultado.trabajo : null;
  const trabajo = lista?.trabajo ?? '';
  const taller = lista?.taller ?? '';
  const idioma = lista?.idioma ?? deEspera;

  useEffect(() => {
    document.title = comoSeVeEnWhatsapp(trabajo, taller);
  }, [trabajo, taller]);

  useEffect(() => {
    document.documentElement.lang = ETIQUETAS_DE_IDIOMA[idioma];
  }, [idioma]);

  return (
    <main className="min-h-dvh bg-mesa pb-10">
      <PantallaDeLaVista
        resultado={resultado}
        idiomaDeEspera={deEspera}
        elQueNoEsta="enlace"
        alMandar={mandar}
      />
    </main>
  );
}

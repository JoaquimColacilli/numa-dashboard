import {
  columnasDelPeriodo,
  estadisticasDelPeriodo,
  hayAlgoParaContar,
  IPC,
  loQueViene,
  resolverElPeriodo,
  resumenDelPeriodo,
  type IndiceDePrecios,
} from '@maun/domain';
import { useMemo } from 'react';

import { useReplicaDelTaller } from '@/entities/replica';
import { useMensajes } from '@/shared/idioma';
import { hoyLocal, mesDeLaFecha } from '@/shared/lib';
import { EstadoVacio, Pagina, PrincipalYApoyo } from '@/shared/ui';

import { baseDeLaReplica, datosDeAntes, nombresDeLosClientes } from '../model/datos';
import { usePeriodoDeLaUrl } from '../model/periodo';
import { irALaSeccion } from '../model/secciones';
import { probarCon } from '../model/textos';
import { ElPeriodo } from './ElPeriodo';
import { SeccionDeLasConsultas } from './LasConsultas';
import { SeccionDeLasEntregas } from './LasEntregas';
import { SeccionDeLasOpiniones } from './LasOpiniones';
import { SeccionDeLoQueGastaste } from './LoQueGastaste';
import { SeccionDeLoQueTeDejaron } from './LoQueTeDejaron';
import { SeccionDeLoQueViene } from './LoQueViene';
import { Resumen } from './Resumen';

export interface EstadisticasPageProps {
  indice?: IndiceDePrecios;
}

export function EstadisticasPage({ indice = IPC }: EstadisticasPageProps) {
  const mensajes = useMensajes();
  const textos = mensajes.paginaEstadisticas;
  const escalas = mensajes.opinion.escalas;
  const replica = useReplicaDelTaller();
  const hoy = hoyLocal();
  const mesEnCurso = mesDeLaFecha(hoy);
  const { periodo, elegirElLargo, correr } = usePeriodoDeLaUrl(mesEnCurso);

  const base = useMemo(() => baseDeLaReplica(replica), [replica]);
  const clientes = useMemo(() => nombresDeLosClientes(replica), [replica]);
  const viene = useMemo(() => loQueViene(base, hoy), [base, hoy]);
  const resuelto = useMemo(
    () => resolverElPeriodo(periodo, hoy, base.primerMes),
    [periodo, hoy, base.primerMes],
  );
  const estadisticas = useMemo(
    () =>
      estadisticasDelPeriodo(
        base,
        resuelto,
        columnasDelPeriodo(resuelto, mesEnCurso, base.primerMes),
        { hoy, indice, escalas },
      ),
    [base, resuelto, mesEnCurso, hoy, indice, escalas],
  );
  const resumen = useMemo(() => resumenDelPeriodo(estadisticas), [estadisticas]);
  const antes = useMemo(() => datosDeAntes(base, resuelto), [base, resuelto]);
  const probar = (hayAntes: boolean) => (hayAntes ? probarCon(resuelto.largo) : null);
  const claveDelPeriodo = `${String(periodo.meses)}-${periodo.hasta}`;

  return (
    <Pagina className="gap-3 md:gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-h1 leading-tight lg:text-h1-lg">{textos.titulo}</h1>
        <p className="max-w-[60ch] text-body leading-relaxed text-text-2">{textos.bajada}</p>
      </header>

      {hayAlgoParaContar(base, viene) ? (
        <>
          <ElPeriodo
            periodo={periodo}
            resuelto={resuelto}
            primerMes={base.primerMes}
            mesEnCurso={mesEnCurso}
            alElegir={elegirElLargo}
            alCorrer={correr}
          />
          <PrincipalYApoyo
            apoyoPrimero
            amplio
            separacion="gap-y-3 @min-[40rem]/apoyo:gap-y-4"
            apoyo={
              <Resumen
                resumen={resumen}
                resuelto={resuelto}
                hoy={hoy}
                indice={indice}
                alIr={irALaSeccion}
              />
            }
          >
            <div key={claveDelPeriodo} className="flex min-w-0 flex-col gap-3 md:gap-4">
              <SeccionDeLoQueTeDejaron
                dejaron={estadisticas.dejaron}
                resuelto={resuelto}
                hoy={hoy}
                indice={indice}
                probar={probar(antes.dejaron)}
              />
              <SeccionDeLoQueGastaste
                gastos={estadisticas.gastos}
                resuelto={resuelto}
                hoy={hoy}
                probar={probar(antes.gastos)}
              />
              <SeccionDeLasEntregas
                entregas={estadisticas.entregas}
                resuelto={resuelto}
                hoy={hoy}
                probar={probar(antes.entregas)}
              />
              <SeccionDeLasConsultas
                consultas={estadisticas.consultas}
                resuelto={resuelto}
                hoy={hoy}
                clientes={clientes}
                probar={probar(antes.consultas)}
              />
              <SeccionDeLasOpiniones
                opiniones={estadisticas.opiniones}
                resuelto={resuelto}
                hoy={hoy}
                probar={probar(antes.opiniones)}
              />
              <SeccionDeLoQueViene viene={viene} hoy={hoy} />
            </div>
          </PrincipalYApoyo>
        </>
      ) : (
        <EstadoVacio
          ilustracion="sin-estadisticas"
          titulo={textos.vacio.titulo}
          detalle={textos.vacio.detalle}
        />
      )}
    </Pagina>
  );
}

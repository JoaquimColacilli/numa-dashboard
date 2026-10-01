import { partesDelTexto, type Valores } from '../../model/presupuestoDelTaller';

export const DATO_EN_EL_TEXTO =
  'rounded-[4px] bg-ink/6 px-0.5 font-medium whitespace-nowrap text-ink';

export interface TextoConDatosProps {
  texto: string;
  valores: Valores;
}

export function TextoConDatos({ texto, valores }: TextoConDatosProps) {
  return (
    <>
      {partesDelTexto(texto).map((parte, indice) =>
        parte.tipo === 'texto' ? (
          parte.texto
        ) : (
          <span key={`${parte.hueco}-${String(indice)}`} className={DATO_EN_EL_TEXTO}>
            {valores[parte.hueco]}
          </span>
        ),
      )}
    </>
  );
}

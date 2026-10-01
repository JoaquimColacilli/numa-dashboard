import type { Plugin } from 'vite';

export const MOTOR_DEL_PDF = /[\\/]node_modules[\\/](pdfkit|fontkit|yoga-layout)[\\/]/;

interface PiezaDelBundle {
  type: 'chunk' | 'asset';
  fileName: string;
  name?: string;
  isEntry?: boolean;
  moduleIds?: readonly string[];
}

export function intrusosDelMotorDelPdf(bundle: Record<string, PiezaDelBundle>): string[] {
  const intrusos: string[] = [];
  for (const pieza of Object.values(bundle)) {
    if (pieza.type !== 'chunk' || (pieza.isEntry !== true && pieza.name !== 'vendor')) continue;
    const intruso = (pieza.moduleIds ?? []).find((id) => MOTOR_DEL_PDF.test(id));
    if (intruso !== undefined) {
      intrusos.push(
        `${pieza.fileName} trae ${intruso}: el motor del PDF va solo en el Worker del presupuesto, nunca en lo que baja al abrir la app.`,
      );
    }
  }
  return intrusos;
}

export function sinElMotorDelPdfAlArrancar(): Plugin {
  return {
    name: 'maun:sin-el-motor-del-pdf-al-arrancar',
    apply: 'build',
    generateBundle(_opciones, bundle) {
      const [primero] = intrusosDelMotorDelPdf(bundle);
      if (primero !== undefined) this.error(primero);
    },
  };
}

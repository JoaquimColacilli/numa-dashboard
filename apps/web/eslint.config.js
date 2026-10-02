import { web } from '@maun/config/eslint';

import zonas from './zonas-de-texto.json' with { type: 'json' };

export default web(import.meta.dirname, { zonasQueFaltan: zonas.faltan });

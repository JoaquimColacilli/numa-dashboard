import { describe, expect, it } from 'vitest';

import type { FilaDe } from '@/shared/api';

import {
  cambiosDeLasRedes,
  comoSeEscriben,
  hayRedesCargadas,
  MENSAJE_DE_LA_RED,
  redesDeLosAjustes,
} from './redes';

const SIN_REDES = {
  id: 'aj',
  household_id: 'h',
  instagram_link: '',
  facebook_link: '',
  tiktok_link: '',
} as FilaDe<'ajustes'>;

const CON_REDES: FilaDe<'ajustes'> = {
  ...SIN_REDES,
  instagram_link: 'https://www.instagram.com/taller.maun/',
  facebook_link: 'https://www.facebook.com/tallermaun',
  tiktok_link: 'https://www.tiktok.com/@taller.maun',
};

const VACIAS = { instagram: '', facebook: '', tiktok: '' };

describe('las redes de los ajustes', () => {
  it('una fila guardada antes de las columnas se lee con las redes vacías', () => {
    const vieja = { id: 'aj', household_id: 'h' } as FilaDe<'ajustes'>;
    expect(redesDeLosAjustes(vieja)).toEqual(VACIAS);
    expect(hayRedesCargadas(vieja)).toBe(false);
    expect(hayRedesCargadas(undefined)).toBe(false);
    expect(hayRedesCargadas(CON_REDES)).toBe(true);
  });

  it('en el formulario, Instagram y TikTok se ven como @usuario, y Facebook como su dirección', () => {
    expect(comoSeEscriben(redesDeLosAjustes(CON_REDES))).toEqual({
      instagram: '@taller.maun',
      facebook: 'https://www.facebook.com/tallermaun',
      tiktok: '@taller.maun',
    });
  });
});

describe('guardar las redes', () => {
  it('manda solo lo que cambió, cada link en su forma canónica', () => {
    const resultado = cambiosDeLasRedes(SIN_REDES, {
      instagram: 'https://instagram.com/Taller.Maun/?igsh=abc',
      facebook: '',
      tiktok: '@Taller.Maun',
    });
    expect(resultado.errores).toEqual({});
    expect(resultado.cambios).toEqual({
      instagram_link: 'https://www.instagram.com/taller.maun/',
      tiktok_link: 'https://www.tiktok.com/@taller.maun',
    });
    expect(resultado.previos).toEqual({ instagram_link: '', tiktok_link: '' });
    expect(comoSeEscriben(resultado.links)).toEqual({
      instagram: '@taller.maun',
      facebook: '',
      tiktok: '@taller.maun',
    });
  });

  it('vaciar una red la saca, y dejarla como estaba no manda nada', () => {
    const resultado = cambiosDeLasRedes(CON_REDES, {
      instagram: '@taller.maun',
      facebook: '  ',
      tiktok: 'https://www.tiktok.com/@taller.maun',
    });
    expect(resultado.cambios).toEqual({ facebook_link: '' });
    expect(resultado.previos).toEqual({ facebook_link: 'https://www.facebook.com/tallermaun' });
  });

  it('lo que no es un perfil no se manda y dice por qué, red por red', () => {
    const resultado = cambiosDeLasRedes(SIN_REDES, {
      instagram: 'https://www.instagram.com/p/C1a2b3/',
      facebook: 'https://www.tiktok.com/@taller.maun',
      tiktok: '@taller maun',
    });
    expect(resultado.errores).toEqual({
      instagram: MENSAJE_DE_LA_RED.instagram['no-es-un-perfil'],
      facebook: MENSAJE_DE_LA_RED.facebook['otra-red'],
      tiktok: MENSAJE_DE_LA_RED.tiktok.usuario,
    });
    expect(resultado.cambios).toEqual({});
  });

  it('con una fila de antes de las columnas, vacío no es un cambio', () => {
    const vieja = { id: 'aj', household_id: 'h' } as FilaDe<'ajustes'>;
    expect(cambiosDeLasRedes(vieja, VACIAS).cambios).toEqual({});
  });
});

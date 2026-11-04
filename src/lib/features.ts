export const FEATURES = { carteira: false, propostas: false };

export function featureEnabled(path: string) {
  if (path.startsWith('/carteira')) return FEATURES.carteira;
  if (path.startsWith('/propostas')) return FEATURES.propostas;
  return true;
}
export interface SimInput {
  valorCarta: number;
  prazo: number;
  taxaAdmin: number;
  fundoReserva: number;
  seguro: boolean;
  valorSeguro: number;
  comissao: number;
}

export interface SimResult {
  parcela: number;
  totalPagar: number;
  totalTaxas: number;
  custoSeguro: number;
  comissaoEstimada: number;
}

export function calcularSimulacao(i: SimInput): SimResult {
  const taxas = (i.valorCarta * i.taxaAdmin) / 100 + (i.valorCarta * i.fundoReserva) / 100;
  const custoSeguro = i.seguro ? i.valorSeguro * i.prazo : 0;
  const totalPagar = i.valorCarta + taxas + custoSeguro;
  const parcela = i.prazo > 0 ? totalPagar / i.prazo : 0;
  const comissaoEstimada = (i.valorCarta * i.comissao) / 100;
  return {
    parcela,
    totalPagar,
    totalTaxas: taxas,
    custoSeguro,
    comissaoEstimada,
  };
}

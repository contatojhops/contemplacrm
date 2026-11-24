import { describe, expect, test } from "bun:test";
import { matchesSearch, normalizeText, searchScore } from "./search.ts";

const m = (q, nome, ...digits) => matchesSearch(q, { text: [nome], digits });

describe("busca: acentos e caixa", () => {
  test("ignora acentos", () => { expect(m("joao", "João Silva")).toBe(true); expect(m("conceicao", "Maria da Conceição")).toBe(true); });
  test("ignora caixa", () => { expect(m("MÁRCIA", "márcia souza")).toBe(true); });
  test("normaliza pontuação", () => { expect(normalizeText("  Ana-Paula  D'Ávila ")).toBe("ana paula d avila"); });
});

describe("busca: telefone e CPF", () => {
  test("com e sem máscara", () => {
    expect(m("(11) 98765", "X", "11987654321")).toBe(true);
    expect(m("123.456.789", "X", "12345678900")).toBe(true);
  });
  test("dígitos não casam com nome", () => { expect(m("123", "Ana 123", "999")).toBe(false); });
});

describe("busca: erros de digitação", () => {
  test("aceita 1 erro em palavras médias", () => {
    expect(m("fernado", "Fernando Lima")).toBe(true);
    expect(m("henriqe", "Henrique Costa")).toBe(true);
    expect(m("sousa", "Márcia Souza")).toBe(true);
  });
  test("aceita prefixo com erro enquanto digita", () => { expect(m("fenra", "Fernanda")).toBe(true); });
});

describe("busca: rejeita resultados irrelevantes", () => {
  test("nomes curtos exigem prefixo exato", () => { expect(m("ana", "Ina Rocha")).toBe(false); expect(m("ana", "Ada")).toBe(false); });
  test("letra inicial diferente não casa", () => { expect(m("carlos", "Marcos")).toBe(false); });
  test("todas as palavras precisam casar", () => { expect(m("pedro silva", "Pedro Costa")).toBe(false); expect(m("pedro silva", "Pedro Henrique Silva")).toBe(true); });
  test("erro demais não casa", () => { expect(m("frnndo", "Fernando")).toBe(false); });
});

describe("busca: relevância e vazio", () => {
  test("exato antes de aproximado", () => {
    expect(searchScore("souza", { text: ["Souza"] })).toBeGreaterThan(searchScore("souza", { text: ["Sousa"] }));
  });
  test("consulta vazia casa tudo", () => { expect(m("   ", "Qualquer")).toBe(true); });
});

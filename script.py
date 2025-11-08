# -*- coding: utf-8 -*-
"""
Simulador populacional com castração e sazonalidade de capacidade de suporte.

Compatível com integração via Node:
  python script.py --quant 2 --dataini 2025-01-01 --dados '{"2025-02-10":{"f":5,"m":3}}'

Saída: JSON em stdout nas chaves {j, fi, mi, fc, mc, n} por data (YYYY-MM-DD).
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import math
from dataclasses import dataclass
from typing import Dict, Tuple, Mapping


# -----------------------------
# Parâmetros do modelo
# -----------------------------
@dataclass(frozen=True)
class Params:
    # Passo temporal (dias)
    delta_t_days: int = 1

    # População inicial
    juvenis: float = 188.0
    f_intactas: float = 477.0
    m_intactos: float = 335.0
    f_castradas: float = 0.0
    m_castrados: float = 0.0

    # Capacidade de suporte (sazonal)
    k_baixa: float = 1000.0
    k_alta: float = 3000.0
    inicio_alta: Tuple[int, int] = (12, 20)  # mês, dia (20/dez)
    fim_alta: Tuple[int, int] = (2, 20)  # mês, dia (20/fev)

    # Taxas (por dia)
    taxa_natal: float = 4.0 / 155.0
    taxa_migr_jf: float = 1.0 / 240.0 / 2.0  # J->F
    taxa_migr_jm: float = 1.0 / 240.0 / 2.0  # J->M
    taxa_mort_fi: float = 1.0 / (4 * 365 - 240)
    taxa_mort_mi: float = 1.0 / (3 * 365 - 240)
    taxa_mort_fc: float = (1.0 / (4 * 365 - 240)) / 2.0
    taxa_mort_mc: float = (1.0 / (3 * 365 - 240)) / 2.0


# -----------------------------
# Funções utilitárias
# -----------------------------
def in_season_high_k(
    data: dt.date, inicio_alta: Tuple[int, int], fim_alta: Tuple[int, int]
) -> bool:
    """Retorna True se a data estiver dentro do período de alta (podendo cruzar o Ano-Novo)."""
    mi, di = inicio_alta
    mf, df = fim_alta
    # Jan/Fev ficam à frente de Dez no calendário, então tratamos janela que cruza o ano.
    inicio = dt.date(data.year, mi, di)
    # Se ainda não chegamos em 20/dez do ano corrente, o início é no ano anterior.
    if data < inicio:
        inicio = dt.date(data.year - 1, mi, di)

    fim = dt.date(inicio.year, mf, df)
    if fim <= inicio:
        fim = dt.date(inicio.year + 1, mf, df)

    return inicio <= data < fim


def capacidade_suporte(data: dt.date, p: Params) -> float:
    """Capacidade de suporte sazonal (alta/baixa)."""
    return p.k_alta if in_season_high_k(data, p.inicio_alta, p.fim_alta) else p.k_baixa


def clamp_nonneg(x: float) -> float:
    return x if x >= 0.0 else 0.0


def parse_castracao(
    json_obj: Mapping[str, Mapping[str, float]],
) -> Dict[dt.date, Dict[str, float]]:
    """
    Espera objeto no formato:
      { "YYYY-MM-DD": {"f": <float>, "m": <float>}, ... }
    """
    out: Dict[dt.date, Dict[str, float]] = {}
    for k, v in (json_obj or {}).items():
        try:
            d = dt.datetime.strptime(k, "%Y-%m-%d").date()
        except ValueError as exc:
            raise ValueError(f"Data inválida em --dados: '{k}' (YYYY-MM-DD)") from exc
        f = float(v.get("f", 0.0) or 0.0)
        m = float(v.get("m", 0.0) or 0.0)
        out[d] = {"f": max(0.0, f), "m": max(0.0, m)}
    return out


# -----------------------------
# Núcleo do simulador
# -----------------------------
def simular(
    anos: int,
    data_ini: dt.date,
    castracao: Mapping[dt.date, Mapping[str, float]],
    p: Params,
) -> Dict[str, Dict[str, float]]:
    """
    Executa a simulação diária por 'anos' anos, a partir de 'data_ini'.

    Retorna dicionário com séries temporais por grupo:
      { "j": { "YYYY-MM-DD": float, ... }, "fi": { ... }, ... , "n": { ... } }
    """
    # Estado inicial
    j = p.juvenis
    fi = p.f_intactas
    mi = p.m_intactos
    fc = p.f_castradas
    mc = p.m_castrados

    delta_t = dt.timedelta(days=p.delta_t_days)
    data = data_ini
    data_fim = dt.date(data_ini.year + anos, data_ini.month, data_ini.day)

    series_j, series_fi, series_mi, series_fc, series_mc, series_n = (
        {},
        {},
        {},
        {},
        {},
        {},
    )

    while data < data_fim:
        # Capacidade de suporte no dia
        k = capacidade_suporte(data, p)

        # Castração do dia (limitada ao estoque disponível)
        delta_fc_req = float(castracao.get(data, {}).get("f", 0.0))
        delta_mc_req = float(castracao.get(data, {}).get("m", 0.0))
        delta_fc = min(delta_fc_req, fi)  # só é possível castrar até fi
        delta_mc = min(delta_mc_req, mi)  # idem

        # Mortes (por grupo)
        mort_fc = p.taxa_mort_fc * fc * p.delta_t_days
        mort_mc = p.taxa_mort_mc * mc * p.delta_t_days
        mort_fi = p.taxa_mort_fi * fi * p.delta_t_days
        mort_mi = p.taxa_mort_mi * mi * p.delta_t_days

        # Atualiza castradas
        fc = clamp_nonneg(fc + delta_fc - mort_fc)
        mc = clamp_nonneg(mc + delta_mc - mort_mc)

        # Atualiza intactas (saindo para castração e morrendo)
        fi = clamp_nonneg(
            fi + (p.taxa_migr_jf * j * p.delta_t_days) - mort_fi - delta_fc
        )
        mi = clamp_nonneg(
            mi + (p.taxa_migr_jm * j * p.delta_t_days) - mort_mi - delta_mc
        )

        # Nascimentos: função saturante de (mi/fi) para evitar explosão quando houver poucos machos
        if fi > 0.0:
            fator_macho = 1.0 - math.exp(-5.0 * (mi / fi))  # 0..1
        else:
            fator_macho = 0.0
        nascimentos = p.taxa_natal * fator_macho * fi

        # Mortalidade dos juvenis limitada pelo ambiente (efeito de capacidade K)
        n_total_sem_j = fi + mi + fc + mc
        n_total = j + n_total_sem_j
        # demanda de mortalidade no dia para respeitar K (mínimo 0)
        demanda_extra = max(
            0.0,
            (nascimentos * n_total / max(k, 1e-9))
            - (mort_fc + mort_mc + mort_fi + mort_mi),
        )
        mort_j = min(j, demanda_extra)  # não pode matar mais que J

        # Atualiza juvenis (nascem, morrem e migram para adultos)
        j = clamp_nonneg(
            j
            + nascimentos
            - mort_j
            - ((p.taxa_migr_jf + p.taxa_migr_jm) * j * p.delta_t_days)
        )

        # Recalcula N
        n_total = j + fi + mi + fc + mc

        # Armazena séries
        ds = data.isoformat()
        series_j[ds] = float(j)
        series_fi[ds] = float(fi)
        series_mi[ds] = float(mi)
        series_fc[ds] = float(fc)
        series_mc[ds] = float(mc)
        series_n[ds] = float(n_total)

        # próximo dia
        data += delta_t

    return {
        "j": series_j,
        "fi": series_fi,
        "mi": series_mi,
        "fc": series_fc,
        "mc": series_mc,
        "n": series_n,
    }


# -----------------------------
# CLI
# -----------------------------
def _valid_date(s: str) -> dt.date:
    try:
        return dt.datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError as exc:
        raise argparse.ArgumentTypeError(
            f"Data inválida: '{s}'. Use YYYY-MM-DD."
        ) from exc


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Simulador populacional (JSON via STDOUT)."
    )
    parser.add_argument(
        "--quant",
        type=int,
        required=True,
        help="Quantidade de anos para simular (inteiro >= 1).",
    )
    parser.add_argument(
        "--dataini",
        type=_valid_date,
        required=True,
        help="Data inicial no formato YYYY-MM-DD.",
    )
    parser.add_argument(
        "--dados",
        type=str,
        default="{}",
        help='JSON de castração por dia: {"YYYY-MM-DD":{"f":0,"m":0}}',
    )

    args = parser.parse_args()

    if args.quant < 1:
        print(json.dumps({"error": "Parâmetro --quant deve ser >= 1"}))
        raise SystemExit(1)

    try:
        dados_obj = json.loads(args.dados) if args.dados else {}
        castracao = parse_castracao(dados_obj)
    except Exception as e:
        print(json.dumps({"error": f"JSON inválido em --dados: {str(e)}"}))
        raise SystemExit(1)

    # Parâmetros default (podem ser expostos futuramente via flags)
    p = Params()

    try:
        resultado = simular(args.quant, args.dataini, castracao, p)
        print(json.dumps(resultado))  # compatível com o Node
    except Exception as e:
        print(json.dumps({"error": f"Erro no simulador: {str(e)}"}))
        raise SystemExit(1)


if __name__ == "__main__":
    main()

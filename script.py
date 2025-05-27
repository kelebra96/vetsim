# script.py
# -*- coding: utf-8 -*-
import datetime
import numpy
import sys
import json

def fdlrSimulador(iQuantRodada, DataIniSimul, ddiCastracao):

    def frCapacidadeDeSuporte(Data):
        iMesIniTurista = 12
        iDiaIniTurista = 20
        iMesFinTurista = 2
        iDiaFinTurista = 20
        rK1 = 1000
        rK2 = 3000
        DataIniTurista = datetime.date(Data.year, iMesIniTurista, iDiaIniTurista)
        if DataIniTurista > Data:
            DataIniTurista = datetime.date(Data.year - 1, iMesIniTurista, iDiaIniTurista)
        DataFinTurista = datetime.date(DataIniTurista.year, iMesFinTurista, iDiaFinTurista)
        if DataFinTurista < DataIniTurista:
            DataFinTurista = datetime.date(DataIniTurista.year + 1, iMesFinTurista, iDiaFinTurista)
        return rK2 if DataIniTurista <= Data < DataFinTurista else rK1

    iDeltaT = 1
    rJ, rFI, rMI, rFC, rMC = 188, 477, 335, 0, 0
    rN = rJ + rFI + rMI + rFC + rMC
    rTaxaNatal = 4 / 155
    rTaxaMigrJF = 1 / 240 / 2
    rTaxaMigrJM = 1 / 240 / 2
    rTaxaMortFI = 1 / (4 * 365 - 240)
    rTaxaMortMI = 1 / (3 * 365 - 240)
    rTaxaMortFC = rTaxaMortFI / 2
    rTaxaMortMC = rTaxaMortMI / 2

    drJ, drFI, drMI, drFC, drMC, drN = {}, {}, {}, {}, {}, {}
    Data = DataIniSimul
    DataFinSimul = datetime.date(DataIniSimul.year + iQuantRodada, DataIniSimul.month, DataIniSimul.day)

    while Data < DataFinSimul:
        rK = frCapacidadeDeSuporte(Data)
        rDeltaFC = ddiCastracao.get(Data, {}).get('f', 0)
        rDeltaMC = ddiCastracao.get(Data, {}).get('m', 0)
        rMorteFC = iDeltaT * rTaxaMortFC * rFC
        rMorteMC = iDeltaT * rTaxaMortMC * rMC
        rMorteFI = iDeltaT * rTaxaMortFI * rFI
        rMorteMI = iDeltaT * rTaxaMortMI * rMI
        rFC += rDeltaFC - rMorteFC
        rMC += rDeltaMC - rMorteMC
        rFI += iDeltaT * rTaxaMigrJF * rJ - rMorteFI - rDeltaFC
        rMI += iDeltaT * rTaxaMigrJM * rJ - rMorteMI - rDeltaMC
        rNascim = rTaxaNatal * (1 - numpy.exp(-5 * rMI / rFI)) * rFI if rFI > 0 else 0
        rMorteJ = max(0, rNascim * rN / rK - rMorteFC - rMorteMC - rMorteFI - rMorteMI)
        rJ += iDeltaT * (rNascim - rMorteJ - (rTaxaMigrJM + rTaxaMigrJF) * rJ)
        rN = rJ + rFI + rMI + rFC + rMC
        drJ[Data] = rJ
        drFI[Data] = rFI
        drMI[Data] = rMI
        drFC[Data] = rFC
        drMC[Data] = rMC
        drN[Data] = rN
        Data += datetime.timedelta(days=iDeltaT)

    return {
        'j': drJ,
        'fi': drFI,
        'mi': drMI,
        'fc': drFC,
        'mc': drMC,
        'n': drN,
    }

if __name__ == "__main__":
    try:
        iQuantRodada = int(sys.argv[sys.argv.index("--quant") + 1])
        dataIni = datetime.datetime.strptime(sys.argv[sys.argv.index("--dataini") + 1], "%Y-%m-%d").date()
        dados_json = json.loads(sys.argv[sys.argv.index("--dados") + 1])

        ddiCastracaoConvertido = {
            datetime.datetime.strptime(k, "%Y-%m-%d").date(): v
            for k, v in dados_json.items()
        }

        resultado = fdlrSimulador(iQuantRodada, dataIni, ddiCastracaoConvertido)

        if not resultado or not resultado.get('n'):
            print(json.dumps({"error": "Simulação não retornou dados"}))
            exit(1)

        for key in resultado:
            resultado[key] = {str(k): float(v) for k, v in resultado[key].items()}

        print(json.dumps(resultado))  # ✅ AQUI é onde o Node espera retorno
    except Exception as e:
        print(json.dumps({"error": f"Erro no script Python: {str(e)}"}))
        exit(1)

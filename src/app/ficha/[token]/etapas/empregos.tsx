'use client';

import { useState } from 'react';
import { Campo, Input, Textarea } from '@/components/ui';
import { mascararTelefone } from '@/lib/validacao';
import { paraInputDate } from '@/lib/formato';
import { FormularioEtapa, Grade, Secao } from './shell';
import type { PropsEtapa } from '../tipos';

const TITULOS = ['Último emprego', 'Penúltimo emprego', 'Antepenúltimo emprego'];

export function EtapaEmpregos({ token, candidato, avancar, voltar }: PropsEtapa) {
  const [naoPossui, setNaoPossui] = useState<boolean[]>(
    [0, 1, 2].map((i) => candidato.empregosAnteriores.find((e) => e.ordem === i)?.naoPossui ?? false),
  );

  return (
    <FormularioEtapa token={token} etapa={4} avancar={avancar} voltar={voltar}>
      <p className="text-xs text-slate-500">
        Preencha os três últimos empregos. Se não tiver algum deles, marque &ldquo;não
        possui&rdquo;.
      </p>

      {[0, 1, 2].map((i) => {
        const emprego = candidato.empregosAnteriores.find((e) => e.ordem === i);
        return (
          <Secao key={i} titulo={TITULOS[i]}>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name={`emprego${i}NaoPossui`}
                checked={naoPossui[i]}
                onChange={(e) =>
                  setNaoPossui((atual) => atual.map((v, j) => (j === i ? e.target.checked : v)))
                }
                className="h-4 w-4 accent-marca-600"
              />
              Não possui
            </label>

            {!naoPossui[i] && (
              <div className="space-y-3 rounded-md border border-slate-200 p-3">
                <Campo rotulo="Empresa" obrigatorio>
                  <Input name={`emprego${i}Empresa`} defaultValue={emprego?.empresa ?? ''} />
                </Campo>
                <Grade>
                  <Campo rotulo="Telefone">
                    <Input
                      name={`emprego${i}Telefone`}
                      inputMode="tel"
                      defaultValue={mascararTelefone(emprego?.telefone)}
                      onChange={(e) => (e.target.value = mascararTelefone(e.target.value))}
                    />
                  </Campo>
                  <Campo rotulo="Contato (pessoa)">
                    <Input name={`emprego${i}Contato`} defaultValue={emprego?.contato ?? ''} />
                  </Campo>
                </Grade>
                <Grade>
                  <Campo rotulo="Setor">
                    <Input name={`emprego${i}Setor`} defaultValue={emprego?.setor ?? ''} />
                  </Campo>
                  <Campo rotulo="Cargo">
                    <Input name={`emprego${i}Cargo`} defaultValue={emprego?.cargo ?? ''} />
                  </Campo>
                </Grade>
                <Grade colunas={3}>
                  <Campo rotulo="Data de admissão">
                    <Input
                      name={`emprego${i}DataAdmissao`}
                      type="date"
                      defaultValue={paraInputDate(emprego?.dataAdmissao)}
                    />
                  </Campo>
                  <Campo rotulo="Data de saída">
                    <Input
                      name={`emprego${i}DataSaida`}
                      type="date"
                      defaultValue={paraInputDate(emprego?.dataSaida)}
                    />
                  </Campo>
                  <Campo rotulo="Último salário (R$)">
                    <Input
                      name={`emprego${i}Salario`}
                      inputMode="decimal"
                      placeholder="1.800,00"
                      defaultValue={emprego?.ultimoSalario ? String(emprego.ultimoSalario) : ''}
                    />
                  </Campo>
                </Grade>
                <Campo rotulo="Motivo da saída">
                  <Textarea name={`emprego${i}MotivoSaida`} rows={2} defaultValue={emprego?.motivoSaida ?? ''} />
                </Campo>
              </div>
            )}
          </Secao>
        );
      })}
    </FormularioEtapa>
  );
}

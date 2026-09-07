'use client';

import { Campo, Input } from '@/components/ui';
import { mascararTelefone } from '@/lib/validacao';
import { FormularioEtapa, Grade, Secao } from './shell';
import type { PropsEtapa } from '../tipos';

const MAX_CURSOS = 6;
const MAX_REFERENCIAS = 3;

export function EtapaCursos({ token, candidato, avancar, voltar }: PropsEtapa) {
  return (
    <FormularioEtapa token={token} etapa={3} avancar={avancar} voltar={voltar}>
      <Secao titulo="Treinamentos e cursos (até 6)">
        {Array.from({ length: MAX_CURSOS }, (_, i) => {
          const curso = candidato.cursos[i];
          return (
            <div key={i} className="rounded-md border border-slate-200 p-3">
              <p className="mb-2 text-xs font-semibold text-slate-500">Curso {i + 1}</p>
              <Campo rotulo="Nome do curso">
                <Input name="cursoNome" defaultValue={curso?.nome ?? ''} />
              </Campo>
              <Grade>
                <Campo rotulo="Instituição">
                  <Input name="cursoInstituicao" defaultValue={curso?.instituicao ?? ''} />
                </Campo>
                <Campo rotulo="Ano">
                  <Input
                    name="cursoAno"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="2023"
                    defaultValue={curso?.ano ?? ''}
                  />
                </Campo>
              </Grade>
            </div>
          );
        })}
      </Secao>

      <Secao titulo="Referências (até 3)">
        {Array.from({ length: MAX_REFERENCIAS }, (_, i) => {
          const referencia = candidato.referencias[i];
          return (
            <div key={i} className="rounded-md border border-slate-200 p-3">
              <p className="mb-2 text-xs font-semibold text-slate-500">Referência {i + 1}</p>
              <Campo rotulo="Nome">
                <Input name="referenciaNome" defaultValue={referencia?.nome ?? ''} />
              </Campo>
              <Grade>
                <Campo rotulo="Telefone">
                  <Input
                    name="referenciaTelefone"
                    inputMode="tel"
                    defaultValue={mascararTelefone(referencia?.telefone)}
                    onChange={(e) => (e.target.value = mascararTelefone(e.target.value))}
                  />
                </Campo>
                <Campo rotulo="Parentesco/relação">
                  <Input
                    name="referenciaRelacao"
                    placeholder="Ex.: ex-supervisor"
                    defaultValue={referencia?.relacao ?? ''}
                  />
                </Campo>
              </Grade>
              <Campo rotulo="Cidade">
                <Input name="referenciaCidade" defaultValue={referencia?.cidade ?? ''} />
              </Campo>
            </div>
          );
        })}
      </Secao>
    </FormularioEtapa>
  );
}

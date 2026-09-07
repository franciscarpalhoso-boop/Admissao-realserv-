'use client';

import { Aviso, Campo, Input, Select } from '@/components/ui';
import { FormularioEtapa, Grade, Secao } from './shell';
import type { PropsEtapa, FuncaoResumo } from '../tipos';

const TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'XG'];

export function EtapaUniforme({
  token,
  candidato,
  avancar,
  voltar,
  funcao,
}: PropsEtapa & { funcao: FuncaoResumo | null }) {
  const aviso =
    funcao?.avisoEspecifico ??
    (funcao?.exigeSapatoPreto
      ? 'Candidatos à vaga de portaria devem providenciar sapato preto.'
      : null);

  return (
    <FormularioEtapa token={token} etapa={5} avancar={avancar} voltar={voltar}>
      <Secao titulo="Uniforme">
        {aviso && <Aviso tipo="alerta">{aviso}</Aviso>}
        <Grade colunas={3}>
          <Campo rotulo="Nº do sapato">
            <Input
              name="numeroSapato"
              inputMode="numeric"
              placeholder="41"
              defaultValue={candidato.numeroSapato ?? ''}
            />
          </Campo>
          <Campo rotulo="Camisa/blusa">
            <Select name="tamanhoCamisa" defaultValue={candidato.tamanhoCamisa ?? ''}>
              <option value="">—</option>
              {TAMANHOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo rotulo="Nº da calça">
            <Input
              name="numeroCalca"
              inputMode="numeric"
              placeholder="42"
              defaultValue={candidato.numeroCalca ?? ''}
            />
          </Campo>
        </Grade>
      </Secao>
    </FormularioEtapa>
  );
}

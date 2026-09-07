'use client';

import { useState } from 'react';
import { Campo, Input, Textarea } from '@/components/ui';
import { FormularioEtapa, Grade, Secao, SimNao } from './shell';
import type { PropsEtapa } from '../tipos';

const LIMITE_SOBRE_VOCE = 600;

export function EtapaQuestionario({ token, candidato, avancar, voltar }: PropsEtapa) {
  const [sobreVoce, setSobreVoce] = useState(candidato.sobreVoce ?? '');
  const [temParente, setTemParente] = useState(candidato.possuiParenteEmpresa === true);
  const [jaTrabalhou, setJaTrabalhou] = useState(candidato.jaTrabalhouEmpresa === true);
  const [querVt, setQuerVt] = useState(candidato.desejaValeTransporte !== false);

  return (
    <FormularioEtapa token={token} etapa={6} avancar={avancar} voltar={voltar}>
      <Secao titulo="Disponibilidade">
        <Campo rotulo="Concorda em trabalhar em escala de revezamento, inclusive domingos e feriados?">
          <SimNao name="aceitaEscalaRevezamento" padrao={candidato.aceitaEscalaRevezamento} />
        </Campo>
      </Secao>

      <Secao titulo="Vínculo com a empresa">
        <div onChange={(e) => setTemParente((e.target as HTMLInputElement).value === 'sim')}>
          <Campo rotulo="Tem parente trabalhando na empresa?">
            <SimNao name="possuiParenteEmpresa" padrao={candidato.possuiParenteEmpresa} />
          </Campo>
        </div>
        {temParente && (
          <Grade>
            <Campo rotulo="Nome do parente">
              <Input name="parenteNome" defaultValue={candidato.parenteNome ?? ''} />
            </Campo>
            <Campo rotulo="Setor/posto">
              <Input name="parenteSetor" defaultValue={candidato.parenteSetor ?? ''} />
            </Campo>
          </Grade>
        )}

        <div onChange={(e) => setJaTrabalhou((e.target as HTMLInputElement).value === 'sim')}>
          <Campo rotulo="Já trabalhou nesta empresa?">
            <SimNao name="jaTrabalhouEmpresa" padrao={candidato.jaTrabalhouEmpresa} />
          </Campo>
        </div>
        {jaTrabalhou && (
          <Campo rotulo="Em que ano?" className="sm:max-w-[160px]">
            <Input
              name="jaTrabalhouAno"
              inputMode="numeric"
              maxLength={4}
              placeholder="2021"
              defaultValue={candidato.jaTrabalhouAno ?? ''}
            />
          </Campo>
        )}
      </Secao>

      <Secao titulo="Saúde">
        <Campo rotulo="É fumante?">
          <SimNao name="fumante" padrao={candidato.fumante} />
        </Campo>
      </Secao>

      <Secao titulo="Vale-transporte e pagamento">
        <div onChange={(e) => setQuerVt((e.target as HTMLInputElement).value === 'sim')}>
          <Campo rotulo="Deseja vale-transporte?">
            <SimNao name="desejaValeTransporte" padrao={candidato.desejaValeTransporte} />
          </Campo>
        </div>
        {querVt && (
          <Grade>
            <Campo rotulo="Linhas de ônibus que utiliza">
              <Input
                name="linhasOnibus"
                placeholder="Ex.: 32, 41"
                defaultValue={candidato.linhasOnibus ?? ''}
              />
            </Campo>
            <Campo rotulo="Valor da passagem (R$)">
              <Input
                name="valorPassagem"
                inputMode="decimal"
                placeholder="5,20"
                defaultValue={candidato.valorPassagem ? String(candidato.valorPassagem) : ''}
              />
            </Campo>
          </Grade>
        )}
        <Campo rotulo="Chave PIX" ajuda="CPF, celular, e-mail ou chave aleatória.">
          <Input name="chavePix" defaultValue={candidato.chavePix ?? ''} />
        </Campo>
      </Secao>

      <Secao titulo="Sobre você">
        <Campo
          rotulo="Escreva, em 5 linhas, sobre você"
          ajuda={`${sobreVoce.length}/${LIMITE_SOBRE_VOCE} caracteres`}
        >
          <Textarea
            name="sobreVoce"
            rows={6}
            maxLength={LIMITE_SOBRE_VOCE}
            value={sobreVoce}
            onChange={(e) => setSobreVoce(e.target.value)}
            placeholder="Conte um pouco sobre sua trajetória, o que você faz bem e o que espera desta oportunidade."
          />
        </Campo>
      </Secao>
    </FormularioEtapa>
  );
}

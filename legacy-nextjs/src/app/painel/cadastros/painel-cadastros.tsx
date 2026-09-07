'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import type {
  Empresa,
  Escala,
  Funcao,
  ItemChecklistPadrao,
  Perfil,
  Posto,
  Supervisor,
} from '@prisma/client';
import {
  Aviso,
  Botao,
  Campo,
  Card,
  CardCabecalho,
  CardCorpo,
  CardTitulo,
  Input,
  Select,
  Selo,
  Textarea,
} from '@/components/ui';
import { UFS, rotuloExigencia, rotuloPerfil } from '@/lib/labels';
import { mascararCnpj, mascararTelefone } from '@/lib/validacao';
import { cn } from '@/lib/utils';
import {
  executarRetencaoAction,
  salvarConfiguracaoAction,
  salvarEmpresaAction,
  salvarEscalaAction,
  salvarFuncaoAction,
  salvarItemChecklistAction,
  salvarPostoAction,
  salvarSupervisorAction,
  salvarUsuarioAction,
  type EstadoCadastro,
} from './actions';

type UsuarioSemSenha = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
};

type PostoComRelacoes = Posto & { empresa: Empresa | null; supervisor: Supervisor | null };

const SECOES = [
  { chave: 'empresas', rotulo: 'Empresas' },
  { chave: 'postos', rotulo: 'Postos' },
  { chave: 'supervisores', rotulo: 'Supervisores' },
  { chave: 'funcoes', rotulo: 'Funções' },
  { chave: 'escalas', rotulo: 'Escalas' },
  { chave: 'checklist', rotulo: 'Checklist' },
  { chave: 'usuarios', rotulo: 'Usuários' },
  { chave: 'config', rotulo: 'Configurações' },
] as const;

function BotaoSalvar({ rotulo = 'Salvar' }: { rotulo?: string }) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" tamanho="sm" disabled={pending}>
      {pending ? 'Salvando...' : rotulo}
    </Botao>
  );
}

/** Formulário de cadastro genérico com estado e refresh após sucesso. */
function FormularioCadastro({
  acao,
  children,
  aoSalvar,
  rotulo,
}: {
  acao: (estado: EstadoCadastro, formData: FormData) => Promise<EstadoCadastro>;
  children: React.ReactNode;
  aoSalvar?: () => void;
  rotulo?: string;
}) {
  const router = useRouter();
  const [estado, despachar] = useActionState<EstadoCadastro, FormData>(acao, {});
  const anterior = useRef(estado);

  useEffect(() => {
    if (estado !== anterior.current) {
      anterior.current = estado;
      if (estado.sucesso) {
        router.refresh();
        aoSalvar?.();
      }
    }
  }, [estado, router, aoSalvar]);

  return (
    <form action={despachar} className="space-y-3">
      {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
      {estado.sucesso && <Aviso tipo="sucesso">{estado.sucesso}</Aviso>}
      {children}
      <BotaoSalvar rotulo={rotulo} />
    </form>
  );
}

function SeletorUf({ name, valor }: { name: string; valor: string | null }) {
  return (
    <Select name={name} defaultValue={valor ?? ''}>
      <option value="">—</option>
      {UFS.map((uf) => (
        <option key={uf} value={uf}>
          {uf}
        </option>
      ))}
    </Select>
  );
}

export function PainelCadastros({
  empresas,
  postos,
  supervisores,
  funcoes,
  escalas,
  checklist,
  usuarios,
  configuracoes,
}: {
  empresas: Empresa[];
  postos: PostoComRelacoes[];
  supervisores: Supervisor[];
  funcoes: Funcao[];
  escalas: Escala[];
  checklist: ItemChecklistPadrao[];
  usuarios: UsuarioSemSenha[];
  configuracoes: Record<string, string>;
}) {
  const [secao, setSecao] = useState<(typeof SECOES)[number]['chave']>('empresas');
  const [editando, setEditando] = useState<string | null>(null);
  const fecharEdicao = () => setEditando(null);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Cadastros mestres</h1>
        <p className="text-sm text-slate-500">
          Empresas do grupo, postos, funções, escalas, checklist de documentos e usuários.
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {SECOES.map((item) => (
          <button
            key={item.chave}
            type="button"
            onClick={() => {
              setSecao(item.chave);
              setEditando(null);
            }}
            className={cn(
              'whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              secao === item.chave
                ? 'border-marca-600 text-marca-700'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            )}
          >
            {item.rotulo}
          </button>
        ))}
      </div>

      {secao === 'empresas' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardCabecalho>
              <CardTitulo>Empresas do grupo ({empresas.length})</CardTitulo>
            </CardCabecalho>
            <CardCorpo className="space-y-1.5">
              {empresas.map((empresa) => (
                <button
                  key={empresa.id}
                  type="button"
                  onClick={() => setEditando(empresa.id)}
                  className={cn(
                    'block w-full rounded-md border px-3 py-2 text-left transition-colors',
                    editando === empresa.id
                      ? 'border-marca-400 bg-marca-50'
                      : 'border-slate-200 hover:bg-slate-50',
                  )}
                >
                  <p className="text-sm font-medium text-slate-900">{empresa.nome}</p>
                  <p className="text-xs text-slate-500">{mascararCnpj(empresa.cnpj)}</p>
                </button>
              ))}
            </CardCorpo>
          </Card>

          <Card>
            <CardCabecalho>
              <CardTitulo>{editando ? 'Editar empresa' : 'Nova empresa'}</CardTitulo>
            </CardCabecalho>
            <CardCorpo>
              {(() => {
                const empresa = empresas.find((e) => e.id === editando);
                return (
                  <FormularioCadastro
                    key={editando ?? 'nova'}
                    acao={salvarEmpresaAction}
                    aoSalvar={fecharEdicao}
                  >
                    <input type="hidden" name="id" value={empresa?.id ?? ''} />
                    <Campo rotulo="Nome" obrigatorio>
                      <Input name="nome" defaultValue={empresa?.nome ?? ''} required />
                    </Campo>
                    <Campo rotulo="CNPJ" obrigatorio>
                      <Input
                        name="cnpj"
                        inputMode="numeric"
                        required
                        defaultValue={mascararCnpj(empresa?.cnpj)}
                        onChange={(e) => (e.target.value = mascararCnpj(e.target.value))}
                      />
                    </Campo>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Campo rotulo="Logradouro">
                        <Input name="logradouro" defaultValue={empresa?.logradouro ?? ''} />
                      </Campo>
                      <Campo rotulo="Número">
                        <Input name="numero" defaultValue={empresa?.numero ?? ''} />
                      </Campo>
                      <Campo rotulo="Bairro">
                        <Input name="bairro" defaultValue={empresa?.bairro ?? ''} />
                      </Campo>
                      <Campo rotulo="Cidade">
                        <Input name="cidade" defaultValue={empresa?.cidade ?? ''} />
                      </Campo>
                      <Campo rotulo="UF">
                        <SeletorUf name="uf" valor={empresa?.uf ?? null} />
                      </Campo>
                      <Campo rotulo="CEP">
                        <Input name="cep" defaultValue={empresa?.cep ?? ''} />
                      </Campo>
                    </div>
                    <Campo rotulo="Responsável">
                      <Input name="responsavel" defaultValue={empresa?.responsavel ?? ''} />
                    </Campo>
                    {editando && (
                      <Botao type="button" variante="contorno" tamanho="sm" onClick={fecharEdicao}>
                        Cancelar edição
                      </Botao>
                    )}
                  </FormularioCadastro>
                );
              })()}
            </CardCorpo>
          </Card>
        </div>
      )}

      {secao === 'postos' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardCabecalho>
              <CardTitulo>Postos de trabalho ({postos.length})</CardTitulo>
            </CardCabecalho>
            <CardCorpo className="space-y-1.5">
              {postos.length === 0 && <p className="text-sm text-slate-500">Nenhum posto.</p>}
              {postos.map((posto) => (
                <button
                  key={posto.id}
                  type="button"
                  onClick={() => setEditando(posto.id)}
                  className={cn(
                    'block w-full rounded-md border px-3 py-2 text-left',
                    editando === posto.id
                      ? 'border-marca-400 bg-marca-50'
                      : 'border-slate-200 hover:bg-slate-50',
                  )}
                >
                  <p className="text-sm font-medium text-slate-900">{posto.nome}</p>
                  <p className="text-xs text-slate-500">
                    {[posto.cidade, posto.empresa?.nome, posto.supervisor?.nome]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                </button>
              ))}
            </CardCorpo>
          </Card>

          <Card>
            <CardCabecalho>
              <CardTitulo>{editando ? 'Editar posto' : 'Novo posto'}</CardTitulo>
            </CardCabecalho>
            <CardCorpo>
              {(() => {
                const posto = postos.find((p) => p.id === editando);
                return (
                  <FormularioCadastro
                    key={editando ?? 'novo'}
                    acao={salvarPostoAction}
                    aoSalvar={fecharEdicao}
                  >
                    <input type="hidden" name="id" value={posto?.id ?? ''} />
                    <Campo rotulo="Nome do condomínio" obrigatorio>
                      <Input name="nome" defaultValue={posto?.nome ?? ''} required />
                    </Campo>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Campo rotulo="Logradouro">
                        <Input name="logradouro" defaultValue={posto?.logradouro ?? ''} />
                      </Campo>
                      <Campo rotulo="Número">
                        <Input name="numero" defaultValue={posto?.numero ?? ''} />
                      </Campo>
                      <Campo rotulo="Bairro">
                        <Input name="bairro" defaultValue={posto?.bairro ?? ''} />
                      </Campo>
                      <Campo rotulo="Cidade">
                        <Input name="cidade" defaultValue={posto?.cidade ?? ''} />
                      </Campo>
                      <Campo rotulo="UF">
                        <SeletorUf name="uf" valor={posto?.uf ?? null} />
                      </Campo>
                      <Campo rotulo="CEP">
                        <Input name="cep" defaultValue={posto?.cep ?? ''} />
                      </Campo>
                    </div>
                    <Campo rotulo="Empresa contratante">
                      <Select name="empresaId" defaultValue={posto?.empresaId ?? ''}>
                        <option value="">—</option>
                        {empresas.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.nome}
                          </option>
                        ))}
                      </Select>
                    </Campo>
                    <Campo rotulo="Supervisor responsável">
                      <Select name="supervisorId" defaultValue={posto?.supervisorId ?? ''}>
                        <option value="">—</option>
                        {supervisores.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nome}
                          </option>
                        ))}
                      </Select>
                    </Campo>
                    {editando && (
                      <Botao type="button" variante="contorno" tamanho="sm" onClick={fecharEdicao}>
                        Cancelar edição
                      </Botao>
                    )}
                  </FormularioCadastro>
                );
              })()}
            </CardCorpo>
          </Card>
        </div>
      )}

      {secao === 'supervisores' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardCabecalho>
              <CardTitulo>Supervisores ({supervisores.length})</CardTitulo>
            </CardCabecalho>
            <CardCorpo className="space-y-1.5">
              {supervisores.map((supervisor) => (
                <button
                  key={supervisor.id}
                  type="button"
                  onClick={() => setEditando(supervisor.id)}
                  className={cn(
                    'block w-full rounded-md border px-3 py-2 text-left',
                    editando === supervisor.id
                      ? 'border-marca-400 bg-marca-50'
                      : 'border-slate-200 hover:bg-slate-50',
                  )}
                >
                  <p className="text-sm font-medium text-slate-900">{supervisor.nome}</p>
                  <p className="text-xs text-slate-500">
                    {mascararTelefone(supervisor.telefone) || supervisor.email || '—'}
                  </p>
                </button>
              ))}
            </CardCorpo>
          </Card>
          <Card>
            <CardCabecalho>
              <CardTitulo>{editando ? 'Editar supervisor' : 'Novo supervisor'}</CardTitulo>
            </CardCabecalho>
            <CardCorpo>
              {(() => {
                const supervisor = supervisores.find((s) => s.id === editando);
                return (
                  <FormularioCadastro
                    key={editando ?? 'novo'}
                    acao={salvarSupervisorAction}
                    aoSalvar={fecharEdicao}
                  >
                    <input type="hidden" name="id" value={supervisor?.id ?? ''} />
                    <Campo rotulo="Nome" obrigatorio>
                      <Input name="nome" defaultValue={supervisor?.nome ?? ''} required />
                    </Campo>
                    <Campo rotulo="Telefone">
                      <Input
                        name="telefone"
                        defaultValue={mascararTelefone(supervisor?.telefone)}
                        onChange={(e) => (e.target.value = mascararTelefone(e.target.value))}
                      />
                    </Campo>
                    <Campo rotulo="E-mail">
                      <Input name="email" type="email" defaultValue={supervisor?.email ?? ''} />
                    </Campo>
                    {editando && (
                      <Botao type="button" variante="contorno" tamanho="sm" onClick={fecharEdicao}>
                        Cancelar edição
                      </Botao>
                    )}
                  </FormularioCadastro>
                );
              })()}
            </CardCorpo>
          </Card>
        </div>
      )}

      {secao === 'funcoes' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardCabecalho>
              <CardTitulo>Funções ({funcoes.length})</CardTitulo>
            </CardCabecalho>
            <CardCorpo className="space-y-1.5">
              {funcoes.map((funcao) => (
                <button
                  key={funcao.id}
                  type="button"
                  onClick={() => setEditando(funcao.id)}
                  className={cn(
                    'block w-full rounded-md border px-3 py-2 text-left',
                    editando === funcao.id
                      ? 'border-marca-400 bg-marca-50'
                      : 'border-slate-200 hover:bg-slate-50',
                  )}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-medium text-slate-900">{funcao.nome}</p>
                    {funcao.exigeCnh && (
                      <Selo className="border-amber-200 bg-amber-50 text-amber-800">Exige CNH</Selo>
                    )}
                    {funcao.exigeSapatoPreto && (
                      <Selo className="border-slate-300 bg-slate-100 text-slate-700">
                        Sapato preto
                      </Selo>
                    )}
                  </div>
                  {funcao.requisitos.length > 0 && (
                    <p className="text-xs text-slate-500">{funcao.requisitos.join(' · ')}</p>
                  )}
                </button>
              ))}
            </CardCorpo>
          </Card>
          <Card>
            <CardCabecalho>
              <CardTitulo>{editando ? 'Editar função' : 'Nova função'}</CardTitulo>
            </CardCabecalho>
            <CardCorpo>
              {(() => {
                const funcao = funcoes.find((f) => f.id === editando);
                return (
                  <FormularioCadastro
                    key={editando ?? 'nova'}
                    acao={salvarFuncaoAction}
                    aoSalvar={fecharEdicao}
                  >
                    <input type="hidden" name="id" value={funcao?.id ?? ''} />
                    <Campo rotulo="Nome" obrigatorio>
                      <Input name="nome" defaultValue={funcao?.nome ?? ''} required />
                    </Campo>
                    <Campo rotulo="Descrição">
                      <Input name="descricao" defaultValue={funcao?.descricao ?? ''} />
                    </Campo>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          name="exigeCnh"
                          defaultChecked={funcao?.exigeCnh ?? false}
                          className="h-4 w-4 accent-marca-600"
                        />
                        Exige CNH válida (torna a CNH obrigatória no checklist)
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          name="exigeSapatoPreto"
                          defaultChecked={funcao?.exigeSapatoPreto ?? false}
                          className="h-4 w-4 accent-marca-600"
                        />
                        Exige sapato preto (mostra aviso na ficha)
                      </label>
                    </div>
                    <Campo rotulo="Aviso exibido ao candidato">
                      <Input
                        name="avisoEspecifico"
                        defaultValue={funcao?.avisoEspecifico ?? ''}
                        placeholder="Candidatos à vaga de portaria devem providenciar sapato preto."
                      />
                    </Campo>
                    <Campo rotulo="Requisitos" ajuda="Um por linha.">
                      <Textarea
                        name="requisitos"
                        rows={4}
                        defaultValue={funcao?.requisitos.join('\n') ?? ''}
                      />
                    </Campo>
                    {editando && (
                      <Botao type="button" variante="contorno" tamanho="sm" onClick={fecharEdicao}>
                        Cancelar edição
                      </Botao>
                    )}
                  </FormularioCadastro>
                );
              })()}
            </CardCorpo>
          </Card>
        </div>
      )}

      {secao === 'escalas' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardCabecalho>
              <CardTitulo>Escalas ({escalas.length})</CardTitulo>
            </CardCabecalho>
            <CardCorpo className="space-y-1.5">
              {escalas.map((escala) => (
                <button
                  key={escala.id}
                  type="button"
                  onClick={() => setEditando(escala.id)}
                  className={cn(
                    'block w-full rounded-md border px-3 py-2 text-left',
                    editando === escala.id
                      ? 'border-marca-400 bg-marca-50'
                      : 'border-slate-200 hover:bg-slate-50',
                  )}
                >
                  <p className="text-sm font-medium text-slate-900">{escala.nome}</p>
                  <p className="text-xs text-slate-500">
                    {escala.horarioInicio && escala.horarioFim
                      ? `${escala.horarioInicio} às ${escala.horarioFim}`
                      : escala.descricao ?? '—'}
                  </p>
                </button>
              ))}
            </CardCorpo>
          </Card>
          <Card>
            <CardCabecalho>
              <CardTitulo>{editando ? 'Editar escala' : 'Nova escala'}</CardTitulo>
            </CardCabecalho>
            <CardCorpo>
              {(() => {
                const escala = escalas.find((e) => e.id === editando);
                return (
                  <FormularioCadastro
                    key={editando ?? 'nova'}
                    acao={salvarEscalaAction}
                    aoSalvar={fecharEdicao}
                  >
                    <input type="hidden" name="id" value={escala?.id ?? ''} />
                    <Campo rotulo="Nome" obrigatorio>
                      <Input name="nome" defaultValue={escala?.nome ?? ''} required placeholder="12x36" />
                    </Campo>
                    <Campo rotulo="Descrição">
                      <Input name="descricao" defaultValue={escala?.descricao ?? ''} />
                    </Campo>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Campo rotulo="Horário de início">
                        <Input name="horarioInicio" type="time" defaultValue={escala?.horarioInicio ?? ''} />
                      </Campo>
                      <Campo rotulo="Horário de fim">
                        <Input name="horarioFim" type="time" defaultValue={escala?.horarioFim ?? ''} />
                      </Campo>
                    </div>
                    {editando && (
                      <Botao type="button" variante="contorno" tamanho="sm" onClick={fecharEdicao}>
                        Cancelar edição
                      </Botao>
                    )}
                  </FormularioCadastro>
                );
              })()}
            </CardCorpo>
          </Card>
        </div>
      )}

      {secao === 'checklist' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardCabecalho>
              <CardTitulo>Checklist admissional padrão ({checklist.length})</CardTitulo>
            </CardCabecalho>
            <CardCorpo className="space-y-1.5">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setEditando(item.id)}
                  className={cn(
                    'block w-full rounded-md border px-3 py-2 text-left',
                    editando === item.id
                      ? 'border-marca-400 bg-marca-50'
                      : 'border-slate-200 hover:bg-slate-50',
                    !item.ativo && 'opacity-50',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-slate-900">
                      {item.ordem}. {item.nome}
                    </p>
                    <Selo
                      className={
                        item.exigencia === 'OBRIGATORIO'
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : item.exigencia === 'CONDICIONAL'
                            ? 'border-amber-200 bg-amber-50 text-amber-800'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                      }
                    >
                      {rotuloExigencia[item.exigencia]}
                    </Selo>
                  </div>
                </button>
              ))}
            </CardCorpo>
          </Card>
          <Card>
            <CardCabecalho>
              <CardTitulo>{editando ? 'Editar item' : 'Novo item do checklist'}</CardTitulo>
            </CardCabecalho>
            <CardCorpo>
              {(() => {
                const item = checklist.find((c) => c.id === editando);
                return (
                  <FormularioCadastro
                    key={editando ?? 'novo'}
                    acao={salvarItemChecklistAction}
                    aoSalvar={fecharEdicao}
                  >
                    <input type="hidden" name="id" value={item?.id ?? ''} />
                    <Campo rotulo="Nome do documento" obrigatorio>
                      <Input name="nome" defaultValue={item?.nome ?? ''} required />
                    </Campo>
                    <Campo rotulo="Descrição/orientação ao candidato">
                      <Textarea name="descricao" rows={2} defaultValue={item?.descricao ?? ''} />
                    </Campo>
                    <Campo rotulo="Exigência">
                      <Select name="exigencia" defaultValue={item?.exigencia ?? 'OBRIGATORIO'}>
                        <option value="OBRIGATORIO">Obrigatório para todos</option>
                        <option value="OPCIONAL">Opcional</option>
                        <option value="CONDICIONAL">
                          Condicional (regra definida no seed/schema)
                        </option>
                      </Select>
                    </Campo>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        name="ativo"
                        defaultChecked={item?.ativo ?? true}
                        className="h-4 w-4 accent-marca-600"
                      />
                      Ativo (entra no checklist de novos candidatos)
                    </label>
                    {editando && (
                      <Botao type="button" variante="contorno" tamanho="sm" onClick={fecharEdicao}>
                        Cancelar edição
                      </Botao>
                    )}
                  </FormularioCadastro>
                );
              })()}
            </CardCorpo>
          </Card>
        </div>
      )}

      {secao === 'usuarios' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardCabecalho>
              <CardTitulo>Usuários ({usuarios.length})</CardTitulo>
            </CardCabecalho>
            <CardCorpo className="space-y-1.5">
              {usuarios.map((usuario) => (
                <button
                  key={usuario.id}
                  type="button"
                  onClick={() => setEditando(usuario.id)}
                  className={cn(
                    'block w-full rounded-md border px-3 py-2 text-left',
                    editando === usuario.id
                      ? 'border-marca-400 bg-marca-50'
                      : 'border-slate-200 hover:bg-slate-50',
                    !usuario.ativo && 'opacity-50',
                  )}
                >
                  <p className="text-sm font-medium text-slate-900">{usuario.nome}</p>
                  <p className="text-xs text-slate-500">
                    {usuario.email} · {rotuloPerfil[usuario.perfil]}
                    {!usuario.ativo && ' · inativo'}
                  </p>
                </button>
              ))}
            </CardCorpo>
          </Card>
          <Card>
            <CardCabecalho>
              <CardTitulo>{editando ? 'Editar usuário' : 'Novo usuário'}</CardTitulo>
            </CardCabecalho>
            <CardCorpo>
              {(() => {
                const usuario = usuarios.find((u) => u.id === editando);
                return (
                  <FormularioCadastro
                    key={editando ?? 'novo'}
                    acao={salvarUsuarioAction}
                    aoSalvar={fecharEdicao}
                  >
                    <input type="hidden" name="id" value={usuario?.id ?? ''} />
                    <Campo rotulo="Nome" obrigatorio>
                      <Input name="nome" defaultValue={usuario?.nome ?? ''} required />
                    </Campo>
                    <Campo rotulo="E-mail" obrigatorio>
                      <Input name="email" type="email" defaultValue={usuario?.email ?? ''} required />
                    </Campo>
                    <Campo rotulo="Perfil" obrigatorio>
                      <Select name="perfil" defaultValue={usuario?.perfil ?? 'DP'} required>
                        <option value="ADMIN">Administrador (Diretoria/RH)</option>
                        <option value="RECRUTADOR">Recrutador/Entrevistador</option>
                        <option value="DP">Departamento Pessoal</option>
                      </Select>
                    </Campo>
                    <Campo
                      rotulo={usuario ? 'Nova senha (deixe em branco para manter)' : 'Senha'}
                      obrigatorio={!usuario}
                      ajuda="Mínimo de 8 caracteres."
                    >
                      <Input
                        name="senha"
                        type="password"
                        autoComplete="new-password"
                        required={!usuario}
                      />
                    </Campo>
                    {usuario && (
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          name="ativo"
                          defaultChecked={usuario.ativo}
                          className="h-4 w-4 accent-marca-600"
                        />
                        Usuário ativo
                      </label>
                    )}
                    {editando && (
                      <Botao type="button" variante="contorno" tamanho="sm" onClick={fecharEdicao}>
                        Cancelar edição
                      </Botao>
                    )}
                  </FormularioCadastro>
                );
              })()}
            </CardCorpo>
          </Card>
        </div>
      )}

      {secao === 'config' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardCabecalho>
              <CardTitulo>Termos e configurações</CardTitulo>
            </CardCabecalho>
            <CardCorpo>
              <FormularioCadastro acao={salvarConfiguracaoAction}>
                <Campo rotulo="Termo de veracidade (etapa 7 da ficha)">
                  <Textarea
                    name="TERMO_VERACIDADE"
                    rows={5}
                    defaultValue={configuracoes.TERMO_VERACIDADE ?? ''}
                  />
                </Campo>
                <Campo rotulo="Termo de consentimento LGPD">
                  <Textarea name="TERMO_LGPD" rows={7} defaultValue={configuracoes.TERMO_LGPD ?? ''} />
                </Campo>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Campo
                    rotulo="Retenção de dados (meses)"
                    ajuda="Reprovados e desistentes são anonimizados após esse prazo."
                  >
                    <Input
                      name="RETENCAO_MESES"
                      inputMode="numeric"
                      defaultValue={configuracoes.RETENCAO_MESES ?? '6'}
                    />
                  </Campo>
                  <Campo rotulo="Local da assinatura">
                    <Input
                      name="LOCAL_ASSINATURA"
                      defaultValue={configuracoes.LOCAL_ASSINATURA ?? 'Santos/SP'}
                    />
                  </Campo>
                </div>
              </FormularioCadastro>
            </CardCorpo>
          </Card>

          <Card>
            <CardCabecalho>
              <CardTitulo>Política de retenção (LGPD)</CardTitulo>
            </CardCabecalho>
            <CardCorpo className="space-y-3">
              <p className="text-sm text-slate-600">
                A anonimização apaga os dados pessoais e os arquivos de candidatos reprovados ou
                desistentes há mais de {configuracoes.RETENCAO_MESES ?? '6'} meses. Candidatos no
                banco de talentos são preservados. Os registros de auditoria são mantidos.
              </p>
              <RetencaoManual />
            </CardCorpo>
          </Card>
        </div>
      )}
    </div>
  );
}

function RetencaoManual() {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoCadastro>({});
  const [executando, setExecutando] = useState(false);

  return (
    <div className="space-y-2">
      {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
      {estado.sucesso && <Aviso tipo="sucesso">{estado.sucesso}</Aviso>}
      <Botao
        variante="perigo"
        tamanho="sm"
        disabled={executando}
        onClick={async () => {
          if (!confirm('Anonimizar agora os candidatos fora do prazo de retenção?')) return;
          setExecutando(true);
          try {
            setEstado(await executarRetencaoAction());
            router.refresh();
          } finally {
            setExecutando(false);
          }
        }}
      >
        {executando ? 'Executando...' : 'Executar anonimização agora'}
      </Botao>
    </div>
  );
}

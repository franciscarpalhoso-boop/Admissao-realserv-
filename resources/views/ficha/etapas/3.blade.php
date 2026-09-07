@php use App\Suporte\Documentos; @endphp
<form method="POST" action="{{ route('ficha.etapa', ['token' => $token, 'etapa' => 3]) }}" class="space-y-4">
    @csrf
    <fieldset class="space-y-3">
        <legend class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Treinamentos e cursos (até 6)</legend>
        @for ($i = 0; $i < 6; $i++)
            @php $curso = $candidato->cursos[$i] ?? null; @endphp
            <div class="rounded-md border border-slate-200 p-3">
                <p class="mb-2 text-xs font-semibold text-slate-500">Curso {{ $i + 1 }}</p>
                <x-campo rotulo="Nome do curso" :nome="'curso_nome[' . $i . ']'" :valor="$curso?->nome" />
                <div class="mt-2 grid gap-2 sm:grid-cols-2">
                    <x-campo rotulo="Instituição" :nome="'curso_instituicao[' . $i . ']'" :valor="$curso?->instituicao" />
                    <x-campo rotulo="Ano" :nome="'curso_ano[' . $i . ']'" inputmode="numeric" placeholder="2023" :valor="$curso?->ano" />
                </div>
            </div>
        @endfor
    </fieldset>

    <fieldset class="space-y-3">
        <legend class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Referências (até 3)</legend>
        @for ($i = 0; $i < 3; $i++)
            @php $ref = $candidato->referencias[$i] ?? null; @endphp
            <div class="rounded-md border border-slate-200 p-3">
                <p class="mb-2 text-xs font-semibold text-slate-500">Referência {{ $i + 1 }}</p>
                <x-campo rotulo="Nome" :nome="'referencia_nome[' . $i . ']'" :valor="$ref?->nome" />
                <div class="mt-2 grid gap-2 sm:grid-cols-2">
                    <x-campo rotulo="Telefone" :nome="'referencia_telefone[' . $i . ']'" inputmode="tel"
                             :valor="Documentos::mascararTelefone($ref?->telefone)" />
                    <x-campo rotulo="Parentesco/relação" :nome="'referencia_relacao[' . $i . ']'"
                             placeholder="Ex.: ex-supervisor" :valor="$ref?->relacao" />
                </div>
                <div class="mt-2">
                    <x-campo rotulo="Cidade" :nome="'referencia_cidade[' . $i . ']'" :valor="$ref?->cidade" />
                </div>
            </div>
        @endfor
    </fieldset>

    <x-rodape-etapa :token="$token" :etapa="3" />
</form>

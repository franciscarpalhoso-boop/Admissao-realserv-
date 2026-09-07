@php
    $obrigatorios = $candidato->documentos->where('exigencia', 'OBRIGATORIO');
    $enviados = $obrigatorios->where('status', '!=', 'PENDENTE')->count();
@endphp

<div class="space-y-4">
    <div>
        <h2 class="text-sm font-semibold">Envio de documentos</h2>
        <p class="mt-1 text-xs text-slate-500">
            Tire a foto direto pelo celular ou anexe um PDF. Aceitamos JPG, PNG e PDF de até 15 MB.
            Os itens marcados com <span class="text-red-500">*</span> são obrigatórios.
        </p>
        <p class="mt-2 text-xs font-medium text-slate-700">
            {{ $enviados }} de {{ $obrigatorios->count() }} documentos obrigatórios enviados
        </p>
    </div>

    @if ($candidato->status_ficha !== 'ENVIADA')
        <div class="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Você ainda não enviou a ficha. Volte às etapas anteriores e finalize o preenchimento —
            os documentos podem ser enviados agora ou depois, pelo mesmo link.
        </div>
    @endif

    <div class="space-y-2">
        @foreach ($candidato->documentos as $documento)
            <div class="rounded-md border border-slate-200 p-3">
                <div class="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div class="min-w-0">
                        <p class="text-sm font-medium">
                            {{ $documento->nome }}@if ($documento->exigencia === 'OBRIGATORIO')<span class="ml-1 text-red-500">*</span>@endif
                        </p>
                        @if ($documento->observacao_dp)
                            <p class="mt-0.5 text-xs font-medium text-red-600">RH: {{ $documento->observacao_dp }}</p>
                        @endif
                    </div>
                    <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium {{ $documento->corStatus() }}">
                        {{ $documento->rotuloStatus() }}
                    </span>
                </div>

                @if ($documento->arquivos->isNotEmpty())
                    <ul class="mb-2 space-y-1">
                        @foreach ($documento->arquivos as $arquivo)
                            <li class="truncate text-xs text-slate-500">
                                📎 {{ $arquivo->nome_original }} · {{ number_format($arquivo->tamanho / 1024, 0, ',', '.') }} KB
                            </li>
                        @endforeach
                    </ul>
                @endif

                @if ($documento->status === 'CONFERIDO')
                    <p class="text-xs text-emerald-700">Conferido pelo RH. Nada mais a fazer aqui.</p>
                @else
                    <form method="POST" enctype="multipart/form-data"
                          action="{{ route('ficha.documento', ['token' => $token, 'documento' => $documento->id]) }}"
                          class="space-y-2">
                        @csrf
                        <input type="file" name="arquivo[]" multiple required
                               accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" capture="environment"
                               class="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-marca-50 file:px-3 file:py-2 file:text-xs file:font-medium file:text-marca-700">
                        <button class="h-8 rounded-md bg-marca-600 px-3 text-xs font-medium text-white hover:bg-marca-700">
                            Enviar
                        </button>
                    </form>
                @endif
            </div>
        @endforeach
    </div>

    <a href="{{ route('ficha.mostrar', ['token' => $token, 'etapa' => 7]) }}"
       class="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-300 bg-white text-sm font-medium hover:bg-slate-50">
        Voltar
    </a>
</div>

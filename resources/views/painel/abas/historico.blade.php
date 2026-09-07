@if ($candidato->movimentacoes->isEmpty())
    <p class="rounded-md border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
        Sem movimentações registradas.
    </p>
@else
    <ol class="space-y-3">
        @foreach ($candidato->movimentacoes as $mov)
            <li class="flex gap-3">
                <div class="flex flex-col items-center">
                    <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-marca-500"></span>
                    <span class="w-px flex-1 bg-slate-200"></span>
                </div>
                <div class="pb-2">
                    <p class="text-sm font-medium">
                        @if ($mov->de) {{ \App\Models\Candidato::ETAPAS[$mov->de] ?? $mov->de }} → @endif
                        {{ \App\Models\Candidato::ETAPAS[$mov->para] ?? $mov->para }}
                    </p>
                    <p class="mt-0.5 text-xs text-slate-500">
                        {{ $mov->created_at?->format('d/m/Y H:i') }} · {{ $mov->usuario?->nome ?? $mov->autor_label }}
                    </p>
                    @if ($mov->observacao)
                        <p class="mt-1 text-sm text-slate-700">{{ $mov->observacao }}</p>
                    @endif
                </div>
            </li>
        @endforeach
    </ol>
@endif

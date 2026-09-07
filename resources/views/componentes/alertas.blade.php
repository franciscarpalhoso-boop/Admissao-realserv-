@if (session('sucesso'))
    <div class="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
        {{ session('sucesso') }}
    </div>
@endif

@if ($errors->any())
    <div class="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
        @foreach ($errors->all() as $erro)
            <p>{{ $erro }}</p>
        @endforeach
    </div>
@endif

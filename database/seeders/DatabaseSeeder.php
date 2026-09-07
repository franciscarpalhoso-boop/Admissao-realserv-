<?php

namespace Database\Seeders;

use App\Models\Configuracao;
use App\Models\Empresa;
use App\Models\Escala;
use App\Models\Funcao;
use App\Models\ItemChecklistPadrao;
use App\Models\Posto;
use App\Models\Supervisor;
use App\Models\Usuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    /**
     * Os CNPJs abaixo são fictícios (com dígitos verificadores válidos) e
     * servem só para a demonstração. Substitua pelos reais em Cadastros >
     * Empresas antes de usar em produção.
     */
    private const EMPRESAS = [
        ['nome' => 'Real Serv First', 'cnpj' => '11222333000181'],
        ['nome' => 'Real Serv Second', 'cnpj' => '11444777000161'],
        ['nome' => 'Real Serv Fourth', 'cnpj' => '19131243000197'],
        ['nome' => 'Real Serv Fifth', 'cnpj' => '34028316000103'],
        ['nome' => 'Real Serv Sixth', 'cnpj' => '33000167000101'],
        ['nome' => 'Real Serv Seventh', 'cnpj' => '60746948000112'],
        ['nome' => 'Real Serv Eighth', 'cnpj' => '47960950000121'],
        ['nome' => 'Real Serv Ninth', 'cnpj' => '61186680000174'],
    ];

    private const FUNCOES = [
        ['nome' => 'Controlador de acesso', 'exige_cnh' => false, 'exige_sapato_preto' => true,
            'requisitos' => "Curso de controlador de acesso desejável\nSapato preto"],
        ['nome' => 'Porteiro', 'exige_cnh' => false, 'exige_sapato_preto' => true,
            'requisitos' => 'Sapato preto',
            'aviso_especifico' => 'Candidatos à vaga de portaria devem providenciar sapato preto.'],
        ['nome' => 'Zelador', 'exige_cnh' => false, 'exige_sapato_preto' => false,
            'requisitos' => 'Noções de manutenção predial'],
        ['nome' => 'Auxiliar de limpeza', 'exige_cnh' => false, 'exige_sapato_preto' => false, 'requisitos' => ''],
        ['nome' => 'Copeira', 'exige_cnh' => false, 'exige_sapato_preto' => false,
            'requisitos' => 'Noções de higiene e manipulação de alimentos'],
        ['nome' => 'Auxiliar de escritório', 'exige_cnh' => false, 'exige_sapato_preto' => false,
            'requisitos' => 'Informática básica'],
        ['nome' => 'Manobrista', 'exige_cnh' => true, 'exige_sapato_preto' => false,
            'requisitos' => "CNH válida\nExperiência em manobra/estacionamento"],
        ['nome' => 'Recepcionista', 'exige_cnh' => false, 'exige_sapato_preto' => false,
            'requisitos' => 'Boa comunicação'],
    ];

    private const ESCALAS = [
        ['nome' => '5x1', 'descricao' => 'Cinco dias de trabalho por um de folga', 'horario_inicio' => '08:00', 'horario_fim' => '17:00'],
        ['nome' => '6x1', 'descricao' => 'Seis dias de trabalho por um de folga', 'horario_inicio' => '07:00', 'horario_fim' => '15:20'],
        ['nome' => '12x36', 'descricao' => 'Doze horas de trabalho por trinta e seis de descanso', 'horario_inicio' => '07:00', 'horario_fim' => '19:00'],
    ];

    private const CHECKLIST = [
        ['nome' => 'Currículo', 'exigencia' => 'OBRIGATORIO', 'regra' => 'NENHUMA'],
        ['nome' => 'RG (frente e verso) ou RG digital', 'exigencia' => 'OBRIGATORIO', 'regra' => 'NENHUMA', 'aceita_multi' => true],
        ['nome' => 'CPF', 'exigencia' => 'OBRIGATORIO', 'regra' => 'NENHUMA'],
        ['nome' => 'CTPS digital (print do app) ou CTPS física', 'exigencia' => 'OBRIGATORIO', 'regra' => 'NENHUMA', 'aceita_multi' => true],
        ['nome' => 'Extrato/consulta do FGTS ou CTPS digital com vínculos', 'exigencia' => 'OBRIGATORIO', 'regra' => 'NENHUMA'],
        ['nome' => 'PIS/NIT', 'exigencia' => 'OBRIGATORIO', 'regra' => 'NENHUMA'],
        ['nome' => 'Título de eleitor', 'exigencia' => 'OBRIGATORIO', 'regra' => 'NENHUMA'],
        ['nome' => 'CNH', 'descricao' => 'Obrigatório para manobrista; opcional para as demais funções.',
            'exigencia' => 'CONDICIONAL', 'regra' => 'EXIGE_CNH'],
        ['nome' => 'Certificado de reservista/alistamento militar', 'descricao' => 'Exigido para candidatos do sexo masculino.',
            'exigencia' => 'CONDICIONAL', 'regra' => 'SEXO_MASCULINO'],
        ['nome' => 'Comprovante de residência atualizado',
            'descricao' => 'Conta de consumo, contrato de locação ou nota fiscal em nome do candidato.',
            'exigencia' => 'OBRIGATORIO', 'regra' => 'NENHUMA'],
        ['nome' => 'Certidão de casamento ou união estável', 'exigencia' => 'CONDICIONAL', 'regra' => 'CASADO_OU_UNIAO'],
        ['nome' => 'Certidão de nascimento dos filhos', 'exigencia' => 'CONDICIONAL', 'regra' => 'POSSUI_FILHOS', 'aceita_multi' => true],
        ['nome' => 'RG/CPF dos filhos', 'exigencia' => 'CONDICIONAL', 'regra' => 'POSSUI_FILHOS', 'aceita_multi' => true],
        ['nome' => 'Carteira de vacinação dos filhos até 6 anos', 'descricao' => 'Necessária para o salário-família.',
            'exigencia' => 'CONDICIONAL', 'regra' => 'FILHOS_ATE_6', 'aceita_multi' => true],
        ['nome' => 'Comprovante de frequência escolar dos filhos de 7 a 14 anos', 'descricao' => 'Necessário para o salário-família.',
            'exigencia' => 'CONDICIONAL', 'regra' => 'FILHOS_7_A_14', 'aceita_multi' => true],
        ['nome' => 'Certificado de escolaridade', 'exigencia' => 'OBRIGATORIO', 'regra' => 'NENHUMA'],
        ['nome' => 'Certificados de cursos', 'descricao' => 'Ex.: brigada de incêndio, controlador de acesso.',
            'exigencia' => 'OPCIONAL', 'regra' => 'NENHUMA', 'aceita_multi' => true],
        ['nome' => 'Foto 3x4', 'exigencia' => 'OBRIGATORIO', 'regra' => 'NENHUMA'],
        ['nome' => 'Exame admissional (ASO)', 'exigencia' => 'OBRIGATORIO', 'regra' => 'NENHUMA'],
        ['nome' => 'Comprovante de conta bancária ou chave PIX', 'exigencia' => 'OBRIGATORIO', 'regra' => 'NENHUMA'],
    ];

    private const TERMO_VERACIDADE = 'Declaro que todas as informações prestadas nesta Ficha de Solicitação de '
        .'Emprego são verdadeiras e completas, assumindo inteira responsabilidade por elas. Estou ciente de que '
        .'a omissão ou a inexatidão de qualquer informação pode acarretar o indeferimento da minha candidatura '
        .'ou, se já admitido, a rescisão do contrato de trabalho por justa causa.';

    private const TERMO_LGPD = 'Autorizo o Grupo Real Serv a coletar, armazenar e tratar os meus dados pessoais '
        .'e os dados pessoais dos meus dependentes informados nesta ficha, exclusivamente para as finalidades de '
        .'recrutamento, seleção, admissão e cumprimento de obrigações legais e trabalhistas, nos termos da Lei '
        .'nº 13.709/2018 (LGPD). Estou ciente de que posso solicitar a qualquer momento a confirmação do '
        .'tratamento, o acesso, a correção ou a exclusão dos meus dados, pelos canais de atendimento do Grupo '
        .'Real Serv, e de que os dados de candidatos não aprovados são anonimizados após o prazo de retenção '
        .'definido na política interna.';

    public function run(): void
    {
        $this->command->info('Populando cadastros mestres...');

        foreach (self::EMPRESAS as $empresa) {
            Empresa::updateOrCreate(
                ['cnpj' => $empresa['cnpj']],
                $empresa + ['cidade' => 'Santos', 'uf' => 'SP']
            );
        }

        foreach (self::FUNCOES as $funcao) {
            Funcao::updateOrCreate(['nome' => $funcao['nome']], $funcao);
        }

        foreach (self::ESCALAS as $escala) {
            Escala::updateOrCreate(['nome' => $escala['nome']], $escala);
        }

        if (ItemChecklistPadrao::count() === 0) {
            foreach (self::CHECKLIST as $indice => $item) {
                ItemChecklistPadrao::create($item + ['ordem' => $indice + 1]);
            }
            $this->command->info('Checklist padrão criado com '.count(self::CHECKLIST).' itens.');
        } else {
            $this->command->info('Checklist padrão já existe — mantido como está.');
        }

        $configuracoes = [
            ['TERMO_VERACIDADE', self::TERMO_VERACIDADE, 'Termo de veracidade exibido na etapa 7 da ficha'],
            ['TERMO_LGPD', self::TERMO_LGPD, 'Termo de consentimento LGPD exibido na etapa 7 da ficha'],
            ['RETENCAO_MESES', '6', 'Meses até anonimizar candidatos reprovados/desistentes'],
            ['LOCAL_ASSINATURA', 'Santos/SP', 'Local preenchido automaticamente na assinatura'],
        ];
        foreach ($configuracoes as [$chave, $valor, $descricao]) {
            Configuracao::firstOrCreate(['chave' => $chave], ['valor' => $valor, 'descricao' => $descricao]);
        }

        if (Supervisor::count() === 0) {
            $supervisor = Supervisor::create(['nome' => 'Supervisor Exemplo', 'telefone' => '(13) 99999-0000']);
            Posto::create([
                'nome' => 'Condomínio Edifício Exemplo',
                'logradouro' => 'Av. Ana Costa', 'numero' => '100', 'bairro' => 'Gonzaga',
                'cidade' => 'Santos', 'uf' => 'SP',
                'empresa_id' => Empresa::orderBy('nome')->value('id'),
                'supervisor_id' => $supervisor->id,
            ]);
        }

        $this->command->info('Criando usuários iniciais...');
        $usuarios = [
            ['Administrador do Sistema', 'admin@realserv.com.br', 'ADMIN', $this->senha('SENHA_ADMIN', 'Admin@2024')],
            ['Usuário Recrutamento', 'recrutador@realserv.com.br', 'RECRUTADOR', $this->senha('SENHA_RECRUTADOR', 'Recruta@2024')],
            ['Usuário DP', 'dp@realserv.com.br', 'DP', $this->senha('SENHA_DP', 'Pessoal@2024')],
        ];

        foreach ($usuarios as [$nome, $email, $perfil, $senha]) {
            $existente = Usuario::where('email', $email)->first();
            Usuario::updateOrCreate(
                ['email' => $email],
                $existente
                    ? ['nome' => $nome, 'perfil' => $perfil]
                    : ['nome' => $nome, 'perfil' => $perfil, 'senha' => Hash::make($senha)]
            );
            $this->command->info($existente
                ? "  {$email} (já existia, senha mantida)"
                : "  {$email} / {$senha}");
        }

        $this->command->info('');
        $this->command->info('Seed concluído. Troque as senhas no primeiro acesso.');
    }

    /**
     * Uma variável de ambiente vazia (como vem no .env.example) conta como não
     * informada — usar apenas `?:` aqui criaria usuários com senha em branco.
     */
    private function senha(string $variavel, string $padrao): string
    {
        $bruta = trim((string) env($variavel, ''));
        if ($bruta === '') {
            return $padrao;
        }
        if (mb_strlen($bruta) < 8) {
            throw new RuntimeException("{$variavel} deve ter pelo menos 8 caracteres (recebeu ".mb_strlen($bruta).').');
        }

        return $bruta;
    }
}

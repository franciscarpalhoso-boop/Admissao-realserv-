<?php

namespace Tests\Unit;

use App\Suporte\Documentos;
use PHPUnit\Framework\TestCase;

class DocumentosTest extends TestCase
{
    public function test_aceita_cpf_com_digitos_verificadores_corretos(): void
    {
        $this->assertTrue(Documentos::validarCpf('529.982.247-25'));
        $this->assertTrue(Documentos::validarCpf('52998224725'));
        $this->assertTrue(Documentos::validarCpf('11144477735'));
    }

    public function test_rejeita_cpf_com_digito_errado(): void
    {
        $this->assertFalse(Documentos::validarCpf('529.982.247-26'));
        $this->assertFalse(Documentos::validarCpf('11144477736'));
    }

    public function test_rejeita_cpf_com_sequencia_repetida(): void
    {
        foreach (range(0, 9) as $digito) {
            $this->assertFalse(Documentos::validarCpf(str_repeat((string) $digito, 11)));
        }
    }

    public function test_rejeita_cpf_de_tamanho_invalido_vazio_ou_nulo(): void
    {
        $this->assertFalse(Documentos::validarCpf('123'));
        $this->assertFalse(Documentos::validarCpf('529982247251'));
        $this->assertFalse(Documentos::validarCpf(''));
        $this->assertFalse(Documentos::validarCpf(null));
    }

    public function test_valida_cnpj(): void
    {
        $this->assertTrue(Documentos::validarCnpj('11.222.333/0001-81'));
        $this->assertTrue(Documentos::validarCnpj('11444777000161'));
        $this->assertFalse(Documentos::validarCnpj('11222333000182'));
        $this->assertFalse(Documentos::validarCnpj('11111111111111'));
    }

    public function test_valida_pis(): void
    {
        // 1201234567 + dígito verificador 2 (módulo 11, pesos 3,2,9,8,7,6,5,4,3,2)
        $this->assertTrue(Documentos::validarPis('120.12345.67-2'));
        $this->assertTrue(Documentos::validarPis('12012345672'));
        $this->assertFalse(Documentos::validarPis('12012345678'));
        $this->assertFalse(Documentos::validarPis('00000000000'));
    }

    public function test_mascaras(): void
    {
        $this->assertSame('529.982.247-25', Documentos::mascararCpf('52998224725'));
        $this->assertSame('11.222.333/0001-81', Documentos::mascararCnpj('11222333000181'));
        $this->assertSame('11045-000', Documentos::mascararCep('11045000'));
        $this->assertSame('(13) 3222-1100', Documentos::mascararTelefone('1332221100'));
        $this->assertSame('(13) 99888-7766', Documentos::mascararTelefone('13998887766'));
        $this->assertSame('120.12345.67-2', Documentos::mascararPis('12012345672'));
        $this->assertSame('', Documentos::mascararCpf(null));
    }

    public function test_normaliza_whatsapp(): void
    {
        $this->assertSame('5513998887766', Documentos::normalizarWhatsapp('(13) 99888-7766'));
        $this->assertSame('551332221100', Documentos::normalizarWhatsapp('1332221100'));
        $this->assertSame('5513998887766', Documentos::normalizarWhatsapp('5513998887766'));
        $this->assertNull(Documentos::normalizarWhatsapp('123'));
        $this->assertNull(Documentos::normalizarWhatsapp(null));
    }
}

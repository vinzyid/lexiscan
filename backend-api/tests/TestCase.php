<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        /*
         * Setiap panggilan HTTP yang tidak sengaja di-fake akan gagal, bukan
         * diteruskan ke internet. Tanpa ini satu test yang lupa memasang fake
         * bisa membakar kuota LLM sungguhan dan hasilnya jadi tidak deterministik.
         */
        Http::preventStrayRequests();

        // Backoff antar-ulangan di LlmHttp nyata; tanpa ini setiap test yang
        // menguji kegagalan penyedia menambah beberapa detik ke durasi suite.
        Sleep::fake();
    }
}

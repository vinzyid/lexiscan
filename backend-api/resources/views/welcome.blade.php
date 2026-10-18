<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>LexiScan - Membaca jadi lebih ramah untuk disleksia</title>
    <meta name="description" content="LexiScan memindai halaman buku, menata ulang tipografinya untuk pembaca disleksia, menyederhanakan teks dengan AI, dan membacakannya dengan suara.">
    <link rel="icon" href="{{ asset('favicon.ico') }}">

    {{--
        Halaman ini sengaja berdiri sendiri (CSS di dalam berkas, tanpa Vite):
        Dockerfile tidak menjalankan npm, jadi aset hasil build tidak pernah
        sampai ke server.
    --}}
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=fredoka:500,600,700|inter:400,500,600|atkinson-hyperlegible:400,700&display=swap" rel="stylesheet">

    <style>
        :root {
            --primary: #7c3aed;
            --primary-deep: #6d28d9;
            --ink: #2e0759;
            --warm: #f59e0b;
            --success: #10b981;
            --bg: #fdf8f2;
            --surface: #ffffff;
            --text: #241908;
            --muted: #6b5a40;
            --line: rgba(36, 25, 8, 0.08);
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #111122;
                --surface: #1c1e35;
                --text: #e8e8f8;
                --muted: #9a9ac0;
                --line: rgba(232, 232, 248, 0.1);
            }
        }

        * { box-sizing: border-box; }

        html { scroll-behavior: smooth; }

        body {
            margin: 0;
            background: var(--bg);
            color: var(--text);
            font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
        }

        h1, h2, h3, .brand, .btn { font-family: 'Fredoka', ui-sans-serif, system-ui, sans-serif; }

        a { color: inherit; }

        .wrap { width: min(1120px, 100% - 32px); margin-inline: auto; }

        /* ── Navigasi ─────────────────────────────────────────────── */
        .nav {
            position: sticky;
            top: 0;
            z-index: 10;
            background: color-mix(in oklab, var(--ink) 92%, transparent);
            backdrop-filter: blur(10px);
        }

        .nav .wrap { display: flex; align-items: center; justify-content: space-between; height: 64px; }

        .nav img { height: 34px; display: block; }

        .nav-links { display: flex; align-items: center; gap: 24px; }

        .nav-links a { color: rgba(255, 255, 255, 0.8); text-decoration: none; font-size: 0.95rem; }

        .nav-links a:hover { color: #fff; }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 22px;
            border-radius: 999px;
            font-weight: 600;
            font-size: 1rem;
            text-decoration: none;
            transition: transform 150ms ease, box-shadow 150ms ease, background 150ms ease;
        }

        .btn:hover { transform: translateY(-1px); }

        .btn-primary { background: var(--warm); color: #2e1a00; box-shadow: 0 10px 24px -10px rgba(245, 158, 11, 0.7); }

        .btn-ghost { color: #fff; border: 1.5px solid rgba(255, 255, 255, 0.35); }

        .btn-ghost:hover { background: rgba(255, 255, 255, 0.08); }

        .btn-sm { padding: 8px 16px; font-size: 0.9rem; }

        /* ── Hero ─────────────────────────────────────────────────── */
        .hero {
            position: relative;
            overflow: hidden;
            color: #fff;
            background:
                radial-gradient(50rem 30rem at 85% 10%, rgba(167, 139, 250, 0.45), transparent 60%),
                radial-gradient(40rem 25rem at 0% 100%, rgba(245, 158, 11, 0.18), transparent 60%),
                linear-gradient(160deg, var(--ink) 0%, #4c1d95 55%, var(--primary-deep) 100%);
        }

        .hero .wrap {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 48px;
            align-items: center;
            padding-block: 88px 104px;
        }

        .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.12);
            font-size: 0.85rem;
            font-weight: 500;
        }

        .eyebrow::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--success); }

        .hero h1 { font-size: clamp(2.3rem, 5vw, 3.6rem); line-height: 1.1; margin: 20px 0 16px; font-weight: 600; }

        .hero h1 span { color: #fcd34d; }

        .hero p.lead { font-size: 1.15rem; color: rgba(255, 255, 255, 0.82); max-width: 34rem; margin: 0 0 32px; }

        .actions { display: flex; flex-wrap: wrap; gap: 12px; }

        /* Mockup ponsel: contoh tipografi ramah disleksia. */
        .phone {
            justify-self: center;
            width: min(320px, 100%);
            padding: 14px;
            border-radius: 40px;
            background: #0d0420;
            box-shadow: 0 40px 80px -30px rgba(0, 0, 0, 0.6), inset 0 0 0 2px rgba(255, 255, 255, 0.08);
            transform: rotate(2deg);
        }

        .screen { border-radius: 28px; background: #fdf8f2; color: #241908; padding: 22px 20px 26px; }

        .screen-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }

        .chip { font-family: 'Fredoka', sans-serif; font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 999px; background: #ede9fe; color: var(--primary-deep); }

        .chip.warm { background: #fef3c7; color: #92400e; }

        .reading {
            font-family: 'Atkinson Hyperlegible', sans-serif;
            font-size: 1.05rem;
            line-height: 2.1;
            letter-spacing: 0.06em;
            margin: 0;
        }

        .reading b { font-weight: 700; }

        .reading .a { color: #241908; }

        .reading .b { color: #6d28d9; }

        .reading .hl { background: #fde68a; border-radius: 6px; padding: 0 4px; }

        .syllables { display: flex; gap: 6px; margin-top: 14px; }

        .syllables span {
            font-family: 'Atkinson Hyperlegible', sans-serif;
            font-weight: 700;
            padding: 6px 12px;
            border-radius: 12px;
            background: #ede9fe;
            color: var(--primary-deep);
        }

        .syllables span:nth-child(2) { background: var(--primary); color: #fff; }

        /* ── Bagian umum ─────────────────────────────────────────── */
        section { padding-block: 88px; }

        .section-head { max-width: 40rem; margin-bottom: 48px; }

        .section-head .tag { color: var(--primary); font-weight: 600; font-size: 0.9rem; letter-spacing: 0.06em; text-transform: uppercase; }

        .section-head h2 { font-size: clamp(1.8rem, 3.5vw, 2.5rem); line-height: 1.15; margin: 8px 0 12px; font-weight: 600; }

        .section-head p { color: var(--muted); margin: 0; font-size: 1.05rem; }

        @media (prefers-color-scheme: dark) {
            .section-head .tag { color: #a78bfa; }
        }

        /* ── Fitur ───────────────────────────────────────────────── */
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

        .card {
            background: var(--surface);
            border: 1px solid var(--line);
            border-radius: 24px;
            padding: 28px;
            transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .card:hover { transform: translateY(-3px); box-shadow: 0 20px 40px -24px rgba(76, 29, 149, 0.35); }

        .icon {
            width: 48px;
            height: 48px;
            border-radius: 14px;
            display: grid;
            place-items: center;
            background: linear-gradient(135deg, var(--primary), #a78bfa);
            color: #fff;
            margin-bottom: 18px;
        }

        .icon svg { width: 24px; height: 24px; }

        .icon.warm { background: linear-gradient(135deg, var(--warm), #fcd34d); color: #2e1a00; }

        .icon.leaf { background: linear-gradient(135deg, var(--success), #6ee7b7); color: #022c22; }

        .card h3 { margin: 0 0 8px; font-size: 1.2rem; font-weight: 600; }

        .card p { margin: 0; color: var(--muted); font-size: 0.97rem; }

        /* ── Cara kerja ──────────────────────────────────────────── */
        .steps-band { background: var(--surface); border-block: 1px solid var(--line); }

        .steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; counter-reset: step; }

        .step { position: relative; padding-top: 56px; }

        .step::before {
            counter-increment: step;
            content: counter(step);
            position: absolute;
            top: 0;
            left: 0;
            width: 40px;
            height: 40px;
            border-radius: 12px;
            display: grid;
            place-items: center;
            font-family: 'Fredoka', sans-serif;
            font-weight: 600;
            color: #fff;
            background: var(--ink);
        }

        .step h3 { margin: 0 0 6px; font-size: 1.1rem; font-weight: 600; }

        .step p { margin: 0; color: var(--muted); font-size: 0.95rem; }

        /* ── Green computing ─────────────────────────────────────── */
        .green {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            align-items: center;
            padding: 48px;
            border-radius: 32px;
            color: #ecfdf5;
            background:
                radial-gradient(30rem 20rem at 100% 0%, rgba(110, 231, 183, 0.25), transparent 60%),
                linear-gradient(150deg, #064e3b, #065f46);
        }

        .green h2 { font-size: clamp(1.7rem, 3vw, 2.2rem); line-height: 1.2; margin: 0 0 12px; font-weight: 600; }

        .green p { margin: 0; color: rgba(236, 253, 245, 0.85); }

        .green ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 14px; }

        .green li {
            display: flex;
            gap: 12px;
            padding: 16px 18px;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.08);
        }

        .green li strong { display: block; font-family: 'Fredoka', sans-serif; font-weight: 600; color: #fff; }

        .green li span { font-size: 0.93rem; color: rgba(236, 253, 245, 0.8); }

        .check { flex: none; width: 24px; height: 24px; color: #6ee7b7; }

        /* ── Ajakan & kaki ───────────────────────────────────────── */
        .cta {
            text-align: center;
            padding: 64px 32px;
            border-radius: 32px;
            color: #fff;
            background: linear-gradient(135deg, var(--ink), var(--primary));
        }

        .cta h2 { font-size: clamp(1.7rem, 3vw, 2.3rem); margin: 0 0 12px; font-weight: 600; }

        .cta p { margin: 0 auto 28px; max-width: 34rem; color: rgba(255, 255, 255, 0.82); }

        .cta .actions { justify-content: center; }

        footer { padding-block: 40px; color: var(--muted); font-size: 0.9rem; }

        footer .wrap { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; }

        @media (max-width: 900px) {
            .hero .wrap, .green { grid-template-columns: 1fr; }
            .hero .wrap { padding-block: 56px 72px; }
            .grid { grid-template-columns: 1fr 1fr; }
            .steps { grid-template-columns: 1fr 1fr; }
            .phone { transform: none; }
        }

        @media (max-width: 600px) {
            .grid, .steps { grid-template-columns: 1fr; }
            .nav-links a:not(.btn) { display: none; }
            section { padding-block: 64px; }
            .green { padding: 28px; }
        }

        @media (prefers-reduced-motion: reduce) {
            html { scroll-behavior: auto; }
            .btn, .card { transition: none; }
            .btn:hover, .card:hover { transform: none; }
        }
    </style>
</head>
<body>
    <header class="nav">
        <div class="wrap">
            <a href="{{ url('/') }}" aria-label="LexiScan, halaman depan">
                <img src="{{ asset('brand/lexiscan-logo-dark.png') }}" alt="LexiScan">
            </a>
            <nav class="nav-links" aria-label="Navigasi utama">
                <a href="#fitur">Fitur</a>
                <a href="#cara-kerja">Cara kerja</a>
                <a href="#hemat-energi">Hemat energi</a>
                <a class="btn btn-ghost btn-sm" href="{{ url('/admin') }}">Masuk admin</a>
            </nav>
        </div>
    </header>

    <main>
        <section class="hero">
            <div class="wrap">
                <div>
                    <span class="eyebrow">GEMASTIK XIX 2026 &middot; Pengembangan Perangkat Lunak</span>
                    <h1>Membaca jadi lebih <span>ramah</span> untuk pembaca disleksia</h1>
                    <p class="lead">
                        LexiScan memindai halaman buku, menata ulang tipografinya agar lebih mudah dibaca,
                        menyederhanakan kalimat dengan AI, lalu membacakannya suku kata demi suku kata.
                    </p>
                    <div class="actions">
                        <a class="btn btn-primary" href="#fitur">Lihat fiturnya</a>
                        <a class="btn btn-ghost" href="{{ url('/admin') }}">Panel admin</a>
                    </div>
                </div>

                <div class="phone" aria-hidden="true">
                    <div class="screen">
                        <div class="screen-top">
                            <span class="chip">Mode Baca</span>
                            <span class="chip warm">Tingkat L3</span>
                        </div>
                        <p class="reading">
                            <span class="a"><b>M</b>atahari</span>
                            <span class="b"><b>a</b>dalah</span>
                            <span class="a"><b>b</b>intang</span>
                            <span class="b"><b>y</b>ang</span>
                            <span class="a"><b>p</b>aling</span>
                            <span class="b hl"><b>d</b>ekat</span>
                            <span class="a"><b>d</b>engan</span>
                            <span class="b"><b>B</b>umi.</span>
                        </p>
                        <div class="syllables">
                            <span>ma</span><span>ta</span><span>ha</span><span>ri</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section id="fitur">
            <div class="wrap">
                <div class="section-head">
                    <span class="tag">Fitur</span>
                    <h2>Satu aplikasi dari halaman cetak sampai paham isinya</h2>
                    <p>Dirancang bersama prinsip aksesibilitas kognitif: tulisan yang tidak berdesakan, kalimat yang lebih pendek, dan suara yang menuntun.</p>
                </div>

                <div class="grid">
                    <article class="card">
                        <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 9h10M7 13h10M7 17h6"/></svg></div>
                        <h3>Pindai di perangkat</h3>
                        <p>Foto halaman buku langsung dibaca di HP dengan OCR. Gambar tidak pernah dikirim ke server.</p>
                    </article>
                    <article class="card">
                        <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg></div>
                        <h3>Tipografi ramah disleksia</h3>
                        <p>Font Atkinson Hyperlegible, spasi longgar, huruf pertama tebal, dan warna kata berselang.</p>
                    </article>
                    <article class="card">
                        <div class="icon warm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.8L20 10l-5 3.9L16.6 20 12 16.5 7.4 20 9 13.9 4 10l6.1-1.2z"/></svg></div>
                        <h3>Sederhanakan dengan AI</h3>
                        <p>Teks sulit diubah ke empat tingkat kemudahan (L2 sampai L5) tanpa mengubah maknanya.</p>
                    </article>
                    <article class="card">
                        <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg></div>
                        <h3>Dibacakan dan dieja</h3>
                        <p>Suara membacakan paragraf, menyorot kata yang sedang dibaca, dan mengeja per suku kata.</p>
                    </article>
                    <article class="card">
                        <div class="icon warm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg></div>
                        <h3>Tanya Lexi</h3>
                        <p>Ketuk kata yang belum dipahami, dan Lexi menjelaskannya dalam tiga gaya, lengkap dengan alat baca yang sama.</p>
                    </article>
                    <article class="card">
                        <div class="icon leaf"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 12-4 16-9 16z"/><path d="M4 20c4-4 7-6 11-8"/></svg></div>
                        <h3>Hemat energi</h3>
                        <p>Jawaban AI disimpan permanen, jadi teks yang sama tidak pernah memanggil model dua kali.</p>
                    </article>
                </div>
            </div>
        </section>

        <section id="cara-kerja" class="steps-band">
            <div class="wrap">
                <div class="section-head">
                    <span class="tag">Cara kerja</span>
                    <h2>Empat langkah, tanpa ribet</h2>
                </div>
                <div class="steps">
                    <div class="step">
                        <h3>Foto halamannya</h3>
                        <p>Arahkan kamera ke buku, atau unggah gambar, PDF, dan DOCX.</p>
                    </div>
                    <div class="step">
                        <h3>Teks dirapikan</h3>
                        <p>OCR membaca teks di HP, lalu AI memperbaiki salah baca.</p>
                    </div>
                    <div class="step">
                        <h3>Atur cara membaca</h3>
                        <p>Pilih tema warna, ukuran huruf, dan tingkat kesederhanaan.</p>
                    </div>
                    <div class="step">
                        <h3>Baca dan dengarkan</h3>
                        <p>Ikuti sorotan kata sambil mendengar, atau eja per suku kata.</p>
                    </div>
                </div>
            </div>
        </section>

        <section id="hemat-energi">
            <div class="wrap">
                <div class="green">
                    <div>
                        <h2>Dirancang hemat energi sejak awal</h2>
                        <p>
                            Pemanggilan model AI adalah bagian paling boros dari aplikasi seperti ini.
                            Karena itu LexiScan mengerjakan sebanyak mungkin di HP, dan mengukur
                            pemakaiannya secara terbuka.
                        </p>
                    </div>
                    <ul>
                        <li>
                            <svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                            <div><strong>OCR dan suara di perangkat</strong><span>Tidak ada unggahan gambar dan tidak ada streaming audio.</span></div>
                        </li>
                        <li>
                            <svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                            <div><strong>Cache permanen jawaban AI</strong><span>Permintaan yang sama dilayani dari simpanan, tanpa memanggil model.</span></div>
                        </li>
                        <li>
                            <svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                            <div><strong>Jejak karbon tercatat</strong><span>Setiap permintaan AI mencatat token dan taksiran emisinya.</span></div>
                        </li>
                    </ul>
                </div>
            </div>
        </section>

        <section>
            <div class="wrap">
                <div class="cta">
                    <h2>Untuk pendamping dan pengelola</h2>
                    <p>Pantau pemakaian AI, kesehatan layanan, akun pengguna, dan umpan balik dari satu panel.</p>
                    <div class="actions">
                        <a class="btn btn-primary" href="{{ url('/admin') }}">Masuk ke panel admin</a>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer>
        <div class="wrap">
            <span>&copy; {{ date('Y') }} LexiScan &middot; Tim FiveOneZero, Universitas Negeri Yogyakarta</span>
            <span>GEMASTIK XIX 2026</span>
        </div>
    </footer>
</body>
</html>

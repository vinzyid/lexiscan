{{--
    Gaya tambahan panel admin, disisipkan lewat render hook HEAD_END.

    Sengaja CSS biasa di sini, bukan tema Vite: Dockerfile tidak menjalankan
    npm, jadi berkas hasil `npm run build` tidak pernah sampai ke server.
    Selektornya memakai kelas fi-* yang memang disediakan Filament sebagai
    titik kustomisasi, dan warnanya diambil dari variabel --primary-* yang
    dibangkitkan dari ->colors() di AdminPanelProvider.
--}}
<link rel="preconnect" href="https://fonts.bunny.net">
<link href="https://fonts.bunny.net/css?family=fredoka:500,600,700&display=swap" rel="stylesheet">

<style>
    /* Judul memakai Fredoka, sama dengan aplikasi mobile. */
    .fi-header-heading,
    .fi-simple-header-heading,
    .fi-section-header-heading,
    .fi-wi-stats-overview-stat-value {
        font-family: 'Fredoka', ui-sans-serif, system-ui, sans-serif;
        letter-spacing: 0;
    }

    .fi-header-heading,
    .fi-simple-header-heading {
        font-weight: 600;
    }

    /* ── Sidebar ─────────────────────────────────────────────────────── */
    .fi-sidebar {
        background: linear-gradient(180deg, color-mix(in oklab, var(--primary-50) 70%, white) 0%, white 55%);
        border-inline-end: 1px solid color-mix(in oklab, var(--gray-950) 6%, transparent);
    }

    .dark .fi-sidebar {
        background: linear-gradient(180deg, color-mix(in oklab, var(--primary-950) 55%, var(--gray-950)) 0%, var(--gray-950) 60%);
        border-inline-end-color: color-mix(in oklab, white 6%, transparent);
    }

    .fi-sidebar-group-label {
        font-size: 0.7rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .fi-sidebar-item-btn {
        border-radius: 0.75rem;
        transition: background-color 150ms ease, transform 150ms ease;
    }

    .fi-sidebar-item.fi-active > .fi-sidebar-item-btn {
        background: linear-gradient(90deg, color-mix(in oklab, var(--primary-500) 16%, transparent), color-mix(in oklab, var(--primary-500) 4%, transparent));
        box-shadow: inset 3px 0 0 var(--primary-600);
    }

    .dark .fi-sidebar-item.fi-active > .fi-sidebar-item-btn {
        box-shadow: inset 3px 0 0 var(--primary-400);
    }

    /* ── Topbar ──────────────────────────────────────────────────────── */
    .fi-topbar > nav {
        background: color-mix(in oklab, white 82%, transparent);
        backdrop-filter: saturate(1.4) blur(10px);
    }

    .dark .fi-topbar > nav {
        background: color-mix(in oklab, var(--gray-900) 82%, transparent);
    }

    /* ── Kartu statistik & section ───────────────────────────────────── */
    .fi-wi-stats-overview-stat,
    .fi-section:not(.fi-section-not-contained),
    .fi-ta-ctn {
        border-radius: 1rem;
    }

    .fi-wi-stats-overview-stat {
        position: relative;
        overflow: hidden;
        transition: transform 180ms ease, box-shadow 180ms ease;
    }

    .fi-wi-stats-overview-stat::before {
        content: '';
        position: absolute;
        inset: 0 0 auto 0;
        height: 3px;
        background: linear-gradient(90deg, var(--primary-600), var(--primary-300));
        opacity: 0.85;
    }

    .fi-wi-stats-overview-stat:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 24px -12px color-mix(in oklab, var(--primary-700) 35%, transparent);
    }

    .fi-wi-stats-overview-stat-value {
        font-weight: 600;
    }

    @media (prefers-reduced-motion: reduce) {
        .fi-wi-stats-overview-stat,
        .fi-sidebar-item-btn {
            transition: none;
        }

        .fi-wi-stats-overview-stat:hover {
            transform: none;
        }
    }

    /* ── Halaman masuk ───────────────────────────────────────────────── */
    .fi-simple-layout {
        background:
            radial-gradient(60rem 40rem at 10% -10%, color-mix(in oklab, var(--primary-400) 35%, transparent), transparent 60%),
            radial-gradient(50rem 35rem at 110% 110%, color-mix(in oklab, #f59e0b 22%, transparent), transparent 60%),
            #f7f3ff;
    }

    .dark .fi-simple-layout {
        background:
            radial-gradient(60rem 40rem at 10% -10%, color-mix(in oklab, var(--primary-700) 45%, transparent), transparent 60%),
            radial-gradient(50rem 35rem at 110% 110%, color-mix(in oklab, #f59e0b 12%, transparent), transparent 60%),
            #0f0a1e;
    }

    .fi-simple-main {
        border-radius: 1.5rem;
        box-shadow: 0 30px 60px -30px color-mix(in oklab, var(--primary-900) 45%, transparent);
    }

    /* ── Catatan kaki sidebar ────────────────────────────────────────── */
    .lx-sidebar-footer {
        margin: 0.75rem;
        padding: 0.875rem 1rem;
        border-radius: 1rem;
        background: linear-gradient(135deg, #2e0759, var(--primary-600));
        color: white;
        font-size: 0.75rem;
        line-height: 1.4;
    }

    .lx-sidebar-footer strong {
        display: block;
        font-family: 'Fredoka', ui-sans-serif, system-ui, sans-serif;
        font-size: 0.9rem;
        font-weight: 600;
    }

    .lx-sidebar-footer a {
        color: inherit;
        opacity: 0.85;
        text-decoration: underline;
        text-underline-offset: 2px;
    }
</style>

{{-- Disembunyikan saat sidebar diciutkan; isinya tidak muat di lebar ikon saja. --}}
<div class="lx-sidebar-footer" x-show="$store.sidebar.isOpen" x-cloak>
    <strong>LexiScan</strong>
    GEMASTIK XIX 2026 &middot; Tim FiveOneZero UNY
    <div style="margin-top: 0.375rem">
        <a href="{{ url('/') }}" target="_blank" rel="noopener">Lihat halaman depan</a>
    </div>
</div>

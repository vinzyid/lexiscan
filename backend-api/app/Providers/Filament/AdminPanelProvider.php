<?php

namespace App\Providers\Filament;

use App\Filament\Pages\Dashboard;
use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\View\PanelsRenderHook;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('admin')
            ->login()
            ->brandName('LexiScan')
            ->brandLogo(asset('brand/lexiscan-logo-light.png'))
            ->darkModeBrandLogo(asset('brand/lexiscan-logo-dark.png'))
            ->brandLogoHeight('2.25rem')
            ->favicon(asset('favicon.ico'))
            /*
             * Ungu primer dan aksen yang sama dengan aplikasi mobile
             * (mobile-app/design-system.md), supaya panel terasa satu produk.
             * Violet bawaan Tailwind bernilai persis #7c3aed di shade 600;
             * Color::hex('#7c3aed') justru membangkitkan palet yang lebih pucat.
             */
            ->colors([
                'primary' => Color::Violet,
                'gray' => Color::Slate,
                'success' => Color::Emerald,
                'warning' => Color::Amber,
                'danger' => Color::Rose,
                'info' => Color::Sky,
            ])
            ->font('Inter')
            ->renderHook(PanelsRenderHook::HEAD_END, fn (): string => view('filament.admin.theme')->render())
            ->renderHook(PanelsRenderHook::SIDEBAR_FOOTER, fn (): string => view('filament.admin.sidebar-footer')->render())
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\Filament\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\Filament\Pages')
            ->pages([
                Dashboard::class,
            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\Filament\Widgets')
            ->navigationGroups(['Operasional', 'Pengaturan'])
            ->sidebarCollapsibleOnDesktop()
            ->maxContentWidth('7xl')
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                PreventRequestForgery::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ]);
    }
}

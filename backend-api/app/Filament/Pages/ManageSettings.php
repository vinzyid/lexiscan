<?php

namespace App\Filament\Pages;

use App\Services\AiTextService;
use App\Services\SystemSettings;
use BackedEnum;
use Filament\Actions\Action;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Actions;
use Filament\Schemas\Components\EmbeddedSchema;
use Filament\Schemas\Components\Form;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use UnitEnum;

/**
 * Parameter sistem yang bisa diubah tanpa merilis ulang aplikasi.
 *
 * Dua hal yang diatur di sini punya sifat berbeda. Bawaan tipografi hanya
 * menyentuh pengguna BARU — yang sudah pernah mengatur sendiri tidak diganggu.
 * Templat prompt menyentuh semua orang seketika, dan karena kunci simpanan
 * memuat sidik jari promptnya, aturan yang disunting langsung menghasilkan
 * jawaban baru alih-alih menyajikan hasil lama.
 *
 * @property-read Schema $form
 */
class ManageSettings extends Page
{
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedAdjustmentsHorizontal;

    protected static string|UnitEnum|null $navigationGroup = 'Pengaturan';

    protected static ?string $title = 'Parameter sistem';

    protected static ?int $navigationSort = 1;

    /** @var array<string, mixed>|null */
    public ?array $data = [];

    public function mount(): void
    {
        $ai = app(AiTextService::class);

        $this->form->fill([
            'simplify_rules' => $ai->simplifyRules(),
            'explain_styles' => $ai->explainStyles(),
            'typography' => $this->settings()->get(
                SystemSettings::KEY_TYPOGRAPHY,
                config('defaults.typography'),
            ),
        ]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Bawaan pengguna baru')
                    ->description('Hanya berlaku bagi yang belum pernah mengatur sendiri. Preferensi yang sudah dipilih pengguna tidak akan ditimpa.')
                    ->schema([
                        Select::make('typography.theme')
                            ->label('Tema warna')
                            ->options(fn (): array => $this->labelled(config('defaults.options.themes')))
                            ->required(),

                        Select::make('typography.type_level')
                            ->label('Tingkat keterbacaan')
                            ->options(fn (): array => $this->labelled(config('defaults.options.type_levels')))
                            ->required(),
                    ])
                    ->columns(2),

                Section::make('Templat prompt')
                    ->description('Perubahan langsung berlaku untuk permintaan berikutnya. Hasil lama tidak ikut terpakai karena kunci simpanan memuat sidik jari promptnya.')
                    ->schema([
                        Tabs::make('bahasa')->tabs([
                            $this->languageTab('id', 'Bahasa Indonesia'),
                            $this->languageTab('en', 'Bahasa Inggris'),
                        ]),
                    ]),
            ])
            ->statePath('data');
    }

    public function save(): void
    {
        $data = $this->form->getState();

        $this->settings()->put(SystemSettings::KEY_SIMPLIFY_RULES, $data['simplify_rules']);
        $this->settings()->put(SystemSettings::KEY_EXPLAIN_STYLES, $data['explain_styles']);
        $this->settings()->put(SystemSettings::KEY_TYPOGRAPHY, $data['typography']);

        Notification::make()
            ->title('Parameter tersimpan')
            ->body('Permintaan AI berikutnya sudah memakai aturan yang baru.')
            ->success()
            ->send();
    }

    public function content(Schema $schema): Schema
    {
        return $schema->components([
            Form::make([EmbeddedSchema::make('form')])
                ->id('form')
                ->livewireSubmitHandler('save')
                ->footer([
                    Actions::make([
                        Action::make('save')
                            ->label('Simpan perubahan')
                            ->submit('save'),
                    ]),
                ]),
        ]);
    }

    /** Satu tab per bahasa: aturan penyederhanaan dan gaya penjelasan sekaligus. */
    private function languageTab(string $language, string $label): Tab
    {
        $ai = app(AiTextService::class);

        return Tab::make($label)->schema([
            Section::make('Aturan penyederhanaan')
                ->description('Kalimat ini disisipkan ke prompt sebagai instruksi untuk setiap level.')
                ->schema(array_map(
                    fn (string $level): Textarea => Textarea::make("simplify_rules.{$language}.{$level}")
                        ->label($level)
                        ->rows(3)
                        ->required(),
                    array_keys($ai->simplifyRules()[$language] ?? []),
                )),

            Section::make('Gaya penjelasan')
                ->description('Instruksi untuk fitur Tanya Lexi.')
                ->schema(array_map(
                    fn (string $style): Textarea => Textarea::make("explain_styles.{$language}.{$style}")
                        ->label($style)
                        ->rows(3)
                        ->required(),
                    array_keys($ai->explainStyles()[$language] ?? []),
                )),
        ]);
    }

    /**
     * @param  array<int, string>  $values
     * @return array<string, string>
     */
    private function labelled(array $values): array
    {
        return array_combine($values, array_map(ucfirst(...), $values));
    }

    private function settings(): SystemSettings
    {
        return app(SystemSettings::class);
    }
}

<?php

namespace Tests\Feature;

use App\Filament\Resources\Readers\ReaderResource;
use App\Filament\Resources\Users\UserResource;
use App\Models\Reader;
use App\Models\User;
use App\Services\AccountManagement;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class AccountManagementTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['password' => 'admin-password']);
    }

    private function reader(): Reader
    {
        return Reader::create(['name' => 'Rafi', 'username' => 'rafi', 'password' => 'rahasia', 'reading_level' => 'belum']);
    }

    public function test_disabled_reader_cannot_login_or_use_existing_tokens(): void
    {
        $reader = $this->reader();
        $token = $reader->createToken('mobile')->plainTextToken;
        $reader->forceFill(['is_active' => false])->save();
        $this->postJson('/api/auth/login', ['username' => 'rafi', 'password' => 'rahasia'])->assertUnauthorized();
        $this->withToken($token)->getJson('/api/auth/me')->assertForbidden();
        $this->withToken($token)->patchJson('/api/auth/preferences', ['name' => 'Other'])->assertForbidden();
        $this->withToken($token)->postJson('/api/auth/logout')->assertForbidden();
    }

    public function test_reader_can_be_disabled_and_reactivated_without_restoring_tokens(): void
    {
        $admin = $this->admin();
        $reader = $this->reader();
        $reader->createToken('mobile');
        $service = app(AccountManagement::class);
        $service->setActive($admin, $reader, false, 'admin-password');
        $this->assertFalse($reader->fresh()->is_active);
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $service->setActive($admin, $reader, true, 'admin-password');
        $this->postJson('/api/auth/login', ['username' => 'rafi', 'password' => 'rahasia'])->assertOk();
    }

    public function test_admin_disable_revokes_sessions_tokens_and_panel_access(): void
    {
        $admin = $this->admin();
        $other = $this->admin();
        $other->createToken('test');
        DB::table('sessions')->insert(['id' => 'session', 'user_id' => $other->id, 'payload' => '', 'last_activity' => time()]);
        app(AccountManagement::class)->setActive($admin, $other, false, 'admin-password');
        $this->assertFalse($other->fresh()->canAccessPanel(Filament::getPanel('admin')));
        $this->assertDatabaseCount('sessions', 0);
        $this->assertDatabaseCount('personal_access_tokens', 0);
        app(AccountManagement::class)->setActive($admin, $other, true, 'admin-password');
        $this->assertTrue($other->fresh()->canAccessPanel(Filament::getPanel('admin')));
    }

    public function test_admin_cannot_disable_self_or_last_active_admin(): void
    {
        $admin = $this->admin();
        try {
            app(AccountManagement::class)->setActive($admin, $admin, false, 'admin-password');
            $this->fail('Self-disable must fail.');
        } catch (ValidationException) {
            $this->assertTrue($admin->fresh()->is_active);
        }
    }

    public function test_password_resets_hash_password_and_revoke_all_tokens(): void
    {
        $admin = $this->admin();
        foreach ([$this->reader(), $this->admin()] as $account) {
            $account->createToken('test');
            app(AccountManagement::class)->resetPassword($admin, $account, 'admin-password', 'replacement-password', 'replacement-password');
            $this->assertTrue(Hash::check('replacement-password', $account->fresh()->password));
            $this->assertSame(0, $account->tokens()->count());
            $this->assertTrue($account->fresh()->is_active);
        }
        $this->postJson('/api/auth/login', ['username' => 'rafi', 'password' => 'rahasia'])->assertUnauthorized();
        $this->postJson('/api/auth/login', ['username' => 'rafi', 'password' => 'replacement-password'])->assertOk();
    }

    public function test_wrong_admin_password_cannot_reset_or_disable_accounts(): void
    {
        $admin = $this->admin();
        $reader = $this->reader();
        foreach (['disable', 'reset'] as $operation) {
            try {
                $service = app(AccountManagement::class);
                if ($operation === 'disable') {
                    $service->setActive($admin, $reader, false, 'wrong');
                } else {
                    $service->resetPassword($admin, $reader, 'wrong', 'replacement-password', 'replacement-password');
                }
                $this->fail('Reauthentication must fail.');
            } catch (ValidationException) {
                $this->assertTrue($reader->fresh()->is_active);
                $this->assertTrue(Hash::check('rahasia', $reader->fresh()->password));
            }
        }
    }

    public function test_disabled_admin_cannot_manage_accounts(): void
    {
        $admin = $this->admin();
        $admin->forceFill(['is_active' => false])->save();
        $this->expectException(HttpException::class);
        app(AccountManagement::class)->setActive($admin, $this->reader(), false, 'admin-password');
    }

    public function test_admin_resources_render_account_actions(): void
    {
        $this->actingAs($this->admin());
        $this->reader();
        $this->get(UserResource::getUrl())->assertOk();
        $this->get(ReaderResource::getUrl())->assertOk();
    }

    public function test_reset_requires_matching_confirmation(): void
    {
        $this->expectException(ValidationException::class);
        app(AccountManagement::class)->resetPassword($this->admin(), $this->reader(), 'admin-password', 'replacement-password', 'different');
    }
}

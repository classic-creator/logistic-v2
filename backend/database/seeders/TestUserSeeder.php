<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TestUserSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => bcrypt('secret'),
            ]
        );
        // Assign a role if roles exist, e.g., Driver
        if (\Spatie\Permission\Models\Role::where('name', 'Driver')->exists()) {
            $role = \Spatie\Permission\Models\Role::findByName('Driver');
            $user->assignRole($role);
        }
    }
}

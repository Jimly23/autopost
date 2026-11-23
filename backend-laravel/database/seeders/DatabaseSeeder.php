<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'jimly@automation.dev'],
            [
                'name' => 'Jimly Assidqi Hardiansyah',
                'password_hash' => Hash::make('Automation123!'),
            ]
        );
    }
}

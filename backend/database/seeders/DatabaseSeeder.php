<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Define Roles
        $roles = [
            'Super Admin',
            'Operations Manager',
            'Dispatcher',
            'Finance Manager',
            'Driver'
        ];

        foreach ($roles as $roleName) {
            \Spatie\Permission\Models\Role::firstOrCreate(['name' => $roleName]);
        }

        // Seed Companies
        $companies = [
            [
                'name' => 'Acme Logistics',
                'gst' => '27AAAAA1111A1Z1',
                'address' => '123 Industrial Area, Pune',
                'contact_person' => 'Alice Smith',
                'phone' => '9876543210',
                'email' => 'alice@acme.com',
                'payment_terms' => 'Net 30',
                'status' => 'Active'
            ],
            [
                'name' => 'Globex Corporation',
                'gst' => '27BBBBB2222B2Z2',
                'address' => '456 Tech Park, Bangalore',
                'contact_person' => 'Bob Johnson',
                'phone' => '9876543211',
                'email' => 'bob@globex.com',
                'payment_terms' => 'Net 15',
                'status' => 'Active'
            ],
            [
                'name' => 'Initech Corp',
                'gst' => '27CCCCC3333C3Z3',
                'address' => '789 Business Hub, Mumbai',
                'contact_person' => 'Peter Gibbons',
                'phone' => '9876543212',
                'email' => 'peter@initech.com',
                'payment_terms' => 'COD',
                'status' => 'Active'
            ]
        ];

        foreach ($companies as $comp) {
            \App\Models\Company::create($comp);
        }

        // Seed Vehicles
        $vehicles = [
            [
                'number' => 'MH12QW1234',
                'type' => '10-Ton Truck',
                'capacity' => '10 Ton',
                'fuel_type' => 'Diesel',
                'rc' => 'RC-MH12-1234',
                'insurance' => 'INS-9999',
                'fitness' => 'FIT-2027',
                'permit' => 'National',
                'pollution' => 'PUC-2026',
                'gps_id' => 'GPS-001',
                'status' => 'Running'
            ],
            [
                'number' => 'DL01AB5678',
                'type' => 'Container',
                'capacity' => '20 Ton',
                'fuel_type' => 'Diesel',
                'rc' => 'RC-DL01-5678',
                'insurance' => 'INS-8888',
                'fitness' => 'FIT-2028',
                'permit' => 'National',
                'pollution' => 'PUC-2026',
                'gps_id' => 'GPS-002',
                'status' => 'Available'
            ],
            [
                'number' => 'KA03XY9999',
                'type' => 'Mini Truck',
                'capacity' => '3 Ton',
                'fuel_type' => 'CNG',
                'rc' => 'RC-KA03-9999',
                'insurance' => 'INS-7777',
                'fitness' => 'FIT-2026',
                'permit' => 'State',
                'pollution' => 'PUC-2026',
                'gps_id' => 'GPS-003',
                'status' => 'Available'
            ],
            [
                'number' => 'HR55ZZ1111',
                'type' => 'Trailer',
                'capacity' => '40 Ton',
                'fuel_type' => 'Diesel',
                'rc' => 'RC-HR55-1111',
                'insurance' => 'INS-6666',
                'fitness' => 'FIT-2029',
                'permit' => 'National',
                'pollution' => 'PUC-2026',
                'gps_id' => 'GPS-004',
                'status' => 'Maintenance'
            ]
        ];

        foreach ($vehicles as $veh) {
            \App\Models\Vehicle::create($veh);
        }

        // Seed Drivers
        $drivers = [
            [
                'name' => 'John Doe',
                'mobile' => '9999988888',
                'license' => 'DL-1234567',
                'license_expiry' => '2030-12-31',
                'aadhaar' => '1234-5678-9012',
                'emergency_contact' => '9999988889',
                'assigned_vehicle' => 'MH12QW1234',
                'status' => 'On Trip'
            ],
            [
                'name' => 'Jane Smith',
                'mobile' => '9999977777',
                'license' => 'DL-7654321',
                'license_expiry' => '2029-05-15',
                'aadhaar' => '9876-5432-1098',
                'emergency_contact' => '9999977778',
                'assigned_vehicle' => 'KA03XY9999',
                'status' => 'Available'
            ],
            [
                'name' => 'Robert Paulson',
                'mobile' => '9999966666',
                'license' => 'DL-1112223',
                'license_expiry' => '2028-10-20',
                'aadhaar' => '1111-2222-3333',
                'emergency_contact' => '9999966667',
                'assigned_vehicle' => 'DL01AB5678',
                'status' => 'Available'
            ]
        ];

        foreach ($drivers as $drv) {
            \App\Models\Driver::create($drv);
        }

        // Create Users and Assign Roles (Moved below drivers to link driver_id foreign keys)
        $users = [
            [
                'name' => 'System Admin',
                'email' => 'admin@logistics.com',
                'password' => bcrypt('password'),
                'role' => 'Super Admin'
            ],
            [
                'name' => 'Ops Manager',
                'email' => 'ops@logistics.com',
                'password' => bcrypt('password'),
                'role' => 'Operations Manager'
            ],
            [
                'name' => 'Dispatcher John',
                'email' => 'dispatcher@logistics.com',
                'password' => bcrypt('password'),
                'role' => 'Dispatcher'
            ],
            [
                'name' => 'Finance Dept',
                'email' => 'finance@logistics.com',
                'password' => bcrypt('password'),
                'role' => 'Finance Manager'
            ],
            [
                'name' => 'Driver Dave',
                'email' => 'driver@logistics.com',
                'password' => bcrypt('password'),
                'role' => 'Driver',
                'driver_id' => 1
            ],
            [
                'name' => 'John Doe',
                'email' => 'john@logistics.com',
                'password' => bcrypt('password'),
                'role' => 'Driver',
                'driver_id' => 1
            ],
            [
                'name' => 'Jane Smith',
                'email' => 'jane@logistics.com',
                'password' => bcrypt('password'),
                'role' => 'Driver',
                'driver_id' => 2
            ],
            [
                'name' => 'Robert Paulson',
                'email' => 'robert@logistics.com',
                'password' => bcrypt('password'),
                'role' => 'Driver',
                'driver_id' => 3
            ],
        ];

        foreach ($users as $userData) {
            $roleName = $userData['role'];
            unset($userData['role']);
            $user = User::firstOrCreate(['email' => $userData['email']], $userData);
            
            // Explicitly find the role
            $role = \Spatie\Permission\Models\Role::findByName($roleName);
            $user->assignRole($role);
        }

        // Seed Orders
        $orders = [
            [
                'company_id' => 1,
                'pickup_location' => 'Pune Factory',
                'destination' => 'Mumbai Port',
                'material' => 'Auto Parts',
                'weight' => '8 Tons',
                'vehicle_type_required' => '10-Ton Truck',
                'expected_price' => 25000.00,
                'status' => 'Dispatched'
            ],
            [
                'company_id' => 2,
                'pickup_location' => 'Bangalore Warehouse',
                'destination' => 'Chennai Port',
                'material' => 'Electronics',
                'weight' => '15 Tons',
                'vehicle_type_required' => 'Container',
                'expected_price' => 45000.00,
                'status' => 'Completed'
            ],
            [
                'company_id' => 3,
                'pickup_location' => 'Mumbai Warehouse',
                'destination' => 'Pune Showroom',
                'material' => 'Office Furniture',
                'weight' => '2.5 Tons',
                'vehicle_type_required' => 'Mini Truck',
                'expected_price' => 12000.00,
                'status' => 'Completed'
            ],
            [
                'company_id' => 1,
                'pickup_location' => 'Pune Warehouse',
                'destination' => 'Delhi Hub',
                'material' => 'Machinery',
                'weight' => '18 Tons',
                'vehicle_type_required' => 'Container',
                'expected_price' => 75000.00,
                'status' => 'Pending'
            ]
        ];

        foreach ($orders as $ord) {
            \App\Models\Order::create($ord);
        }

        // Seed Trips
        $today = date('Y-m-d');
        $trips = [
            [
                'order_id' => 1,
                'vehicle_id' => 1,
                'driver_id' => 1,
                'company_name' => 'Acme Logistics',
                'driver_name' => 'John Doe',
                'vehicle_number' => 'MH12QW1234',
                'pickup_date' => $today, // Today's trip
                'delivery_date' => date('Y-m-d', strtotime('+1 day')),
                'start_date' => now(),
                'status' => 'Running'
            ],
            [
                'order_id' => 2,
                'vehicle_id' => 2,
                'driver_id' => 3,
                'company_name' => 'Globex Corporation',
                'driver_name' => 'Robert Paulson',
                'vehicle_number' => 'DL01AB5678',
                'pickup_date' => date('Y-m-d', strtotime('-5 days')),
                'delivery_date' => date('Y-m-d', strtotime('-4 days')),
                'start_date' => date('Y-m-d H:i:s', strtotime('-5 days')),
                'end_date' => date('Y-m-d H:i:s', strtotime('-4 days')),
                'status' => 'Completed'
            ],
            [
                'order_id' => 3,
                'vehicle_id' => 3,
                'driver_id' => 2,
                'company_name' => 'Initech Corp',
                'driver_name' => 'Jane Smith',
                'vehicle_number' => 'KA03XY9999',
                'pickup_date' => date('Y-m-d', strtotime('-1 month')),
                'delivery_date' => date('Y-m-d', strtotime('-1 month + 1 day')),
                'start_date' => date('Y-m-d H:i:s', strtotime('-1 month')),
                'end_date' => date('Y-m-d H:i:s', strtotime('-1 month + 1 day')),
                'status' => 'Completed'
            ]
        ];

        foreach ($trips as $trp) {
            \App\Models\Trip::create($trp);
        }

        // Seed Finances
        $finances = [
            [
                'trip_id' => 2,
                'trip_amount' => 45000.00,
                'total_expenses' => 15000.00,
                'net_profit' => 30000.00,
                'recorded_at' => date('Y-m-d H:i:s', strtotime('-4 days'))
            ],
            [
                'trip_id' => 3,
                'trip_amount' => 12000.00,
                'total_expenses' => 4000.00,
                'net_profit' => 8000.00,
                'recorded_at' => date('Y-m-d H:i:s', strtotime('-1 month'))
            ]
        ];

        foreach ($finances as $fin) {
            \App\Models\FinanceLedger::create($fin);
        }

        // Also call other seeders if needed (but currently they are empty)
        $this->call(TestUserSeeder::class);
        $this->call(FuelSeeder::class);
        $this->call(IntelligenceSeeder::class);
    }
}

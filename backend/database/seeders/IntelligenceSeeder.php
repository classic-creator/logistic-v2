<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\RouteStatistic;

class IntelligenceSeeder extends Seeder
{
    public function run(): void
    {
        // 1. UPDATE trips table to fill intelligence columns for completed trips (Trip 2 and 3)
        DB::table('trips')->where('id', 2)->update([
            'start_odometer' => 34000,
            'end_odometer' => 34850,
            'cargo_weight' => 15,
            'cargo_type' => 'Electronics',
            'actual_distance' => 850,
            'actual_fuel_liters' => 106.25,
            'actual_fuel_cost' => 10093.75,
            'actual_mileage' => 8.0,
            'fuel_budget' => 12000,
            'fuel_variance_percent' => -5.2,
            'trip_fuel_score' => 78,
        ]);

        DB::table('trips')->where('id', 3)->update([
            'start_odometer' => 25000,
            'end_odometer' => 25320,
            'cargo_weight' => 5,
            'cargo_type' => 'Pharmaceuticals',
            'actual_distance' => 320,
            'actual_fuel_liters' => 32,
            'actual_fuel_cost' => 3040,
            'actual_mileage' => 10.0,
            'fuel_budget' => 3500,
            'fuel_variance_percent' => -8.5,
            'trip_fuel_score' => 85,
        ]);

        // 2. SEED vehicle_statistics
        DB::table('vehicle_statistics')->insert([
            [
                'vehicle_id' => 1, 'total_trips' => 15, 'total_distance_km' => 12500, 'total_fuel_liters' => 1562.5,
                'total_fuel_cost' => 148437.50, 'avg_mileage_kmpl' => 8.0, 'manufacturer_mileage' => 8.5,
                'current_learned_mileage' => 8.1, 'fuel_score' => 72, 'confidence_score' => 0.75, 'last_calculated_at' => now(),
            ],
            [
                'vehicle_id' => 2, 'total_trips' => 22, 'total_distance_km' => 28600, 'total_fuel_liters' => 3575,
                'total_fuel_cost' => 339625, 'avg_mileage_kmpl' => 8.0, 'manufacturer_mileage' => 7.5,
                'current_learned_mileage' => 7.8, 'fuel_score' => 68, 'confidence_score' => 0.85, 'last_calculated_at' => now(),
            ],
            [
                'vehicle_id' => 3, 'total_trips' => 18, 'total_distance_km' => 5760, 'total_fuel_liters' => 576,
                'total_fuel_cost' => 40320, 'avg_mileage_kmpl' => 10.0, 'manufacturer_mileage' => 12.0,
                'current_learned_mileage' => 10.5, 'fuel_score' => 82, 'confidence_score' => 0.90, 'last_calculated_at' => now(),
            ],
            [
                'vehicle_id' => 4, 'total_trips' => 8, 'total_distance_km' => 9600, 'total_fuel_liters' => 1371.4,
                'total_fuel_cost' => 130285, 'avg_mileage_kmpl' => 7.0, 'manufacturer_mileage' => 6.5,
                'current_learned_mileage' => 6.8, 'fuel_score' => 55, 'confidence_score' => 0.40, 'last_calculated_at' => now(),
            ],
        ]);

        // 3. SEED driver_statistics
        DB::table('driver_statistics')->insert([
            [
                'driver_id' => 1, 'total_trips' => 20, 'total_distance_km' => 18000, 'total_fuel_liters' => 2250,
                'total_fuel_cost' => 213750, 'avg_mileage_kmpl' => 8.0, 'avg_fuel_cost_per_km' => 11.88,
                'fuel_efficiency_score' => 75, 'driving_efficiency_score' => 80, 'fuel_score' => 78, 'last_calculated_at' => now(),
            ],
            [
                'driver_id' => 2, 'total_trips' => 18, 'total_distance_km' => 14400, 'total_fuel_liters' => 1440,
                'total_fuel_cost' => 136800, 'avg_mileage_kmpl' => 10.0, 'avg_fuel_cost_per_km' => 9.50,
                'fuel_efficiency_score' => 88, 'driving_efficiency_score' => 85, 'fuel_score' => 86, 'last_calculated_at' => now(),
            ],
            [
                'driver_id' => 3, 'total_trips' => 12, 'total_distance_km' => 10800, 'total_fuel_liters' => 1542.9,
                'total_fuel_cost' => 146571, 'avg_mileage_kmpl' => 7.0, 'avg_fuel_cost_per_km' => 13.57,
                'fuel_efficiency_score' => 60, 'driving_efficiency_score' => 65, 'fuel_score' => 62, 'last_calculated_at' => now(),
            ],
        ]);

        // 4. SEED route_statistics
        DB::table('route_statistics')->insert([
            [
                'route_key' => RouteStatistic::generateRouteKey('Mumbai', 'Delhi'),
                'pickup_location' => 'Mumbai', 'destination' => 'Delhi',
                'total_trips' => 12, 'avg_distance_km' => 1400, 'avg_fuel_liters' => 175, 'avg_fuel_cost' => 16625,
                'avg_duration_hours' => 24, 'avg_mileage_kmpl' => 8.0, 'avg_revenue' => 35000, 'avg_profit' => 15000,
                'best_vehicle_id' => 1, 'best_driver_id' => 1, 'worst_vehicle_id' => 4, 'worst_driver_id' => 3,
                'route_fuel_score' => 75, 'last_calculated_at' => now(),
            ],
            [
                'route_key' => RouteStatistic::generateRouteKey('Bangalore', 'Chennai'),
                'pickup_location' => 'Bangalore', 'destination' => 'Chennai',
                'total_trips' => 8, 'avg_distance_km' => 350, 'avg_fuel_liters' => 43.75, 'avg_fuel_cost' => 4156,
                'avg_duration_hours' => 6, 'avg_mileage_kmpl' => 8.0, 'avg_revenue' => 15000, 'avg_profit' => 8000,
                'best_vehicle_id' => 3, 'best_driver_id' => 2, 'worst_vehicle_id' => 2, 'worst_driver_id' => 3,
                'route_fuel_score' => 82, 'last_calculated_at' => now(),
            ],
            [
                'route_key' => RouteStatistic::generateRouteKey('Delhi', 'Jaipur'),
                'pickup_location' => 'Delhi', 'destination' => 'Jaipur',
                'total_trips' => 6, 'avg_distance_km' => 280, 'avg_fuel_liters' => 28, 'avg_fuel_cost' => 2660,
                'avg_duration_hours' => 5, 'avg_mileage_kmpl' => 10.0, 'avg_revenue' => 12000, 'avg_profit' => 7000,
                'best_vehicle_id' => null, 'best_driver_id' => null, 'worst_vehicle_id' => null, 'worst_driver_id' => null,
                'route_fuel_score' => 88, 'last_calculated_at' => now(),
            ],
            [
                'route_key' => RouteStatistic::generateRouteKey('Hyderabad', 'Mumbai'),
                'pickup_location' => 'Hyderabad', 'destination' => 'Mumbai',
                'total_trips' => 5, 'avg_distance_km' => 710, 'avg_fuel_liters' => 101.4, 'avg_fuel_cost' => 9633,
                'avg_duration_hours' => 12, 'avg_mileage_kmpl' => 7.0, 'avg_revenue' => 22000, 'avg_profit' => 9000,
                'best_vehicle_id' => null, 'best_driver_id' => null, 'worst_vehicle_id' => null, 'worst_driver_id' => null,
                'route_fuel_score' => 65, 'last_calculated_at' => now(),
            ],
            [
                'route_key' => RouteStatistic::generateRouteKey('Pune', 'Bangalore'),
                'pickup_location' => 'Pune', 'destination' => 'Bangalore',
                'total_trips' => 4, 'avg_distance_km' => 840, 'avg_fuel_liters' => 105, 'avg_fuel_cost' => 9975,
                'avg_duration_hours' => 14, 'avg_mileage_kmpl' => 8.0, 'avg_revenue' => 28000, 'avg_profit' => 14000,
                'best_vehicle_id' => null, 'best_driver_id' => null, 'worst_vehicle_id' => null, 'worst_driver_id' => null,
                'route_fuel_score' => 78, 'last_calculated_at' => now(),
            ],
        ]);

        // 5. SEED customer_statistics
        DB::table('customer_statistics')->insert([
            [
                'company_id' => 1, 'total_trips' => 18, 'total_distance_km' => 16200, 'total_fuel_cost' => 108000,
                'avg_revenue_per_trip' => 30000, 'avg_profit_per_trip' => 12000, 'avg_cost_per_km' => 6.67,
                'most_used_route' => 'Mumbai → Delhi', 'customer_fuel_score' => 75, 'last_calculated_at' => now(),
            ],
            [
                'company_id' => 2, 'total_trips' => 12, 'total_distance_km' => 9600, 'total_fuel_cost' => 72000,
                'avg_revenue_per_trip' => 25000, 'avg_profit_per_trip' => 10000, 'avg_cost_per_km' => 7.50,
                'most_used_route' => 'Bangalore → Chennai', 'customer_fuel_score' => 70, 'last_calculated_at' => now(),
            ],
            [
                'company_id' => 3, 'total_trips' => 8, 'total_distance_km' => 6400, 'total_fuel_cost' => 51200,
                'avg_revenue_per_trip' => 20000, 'avg_profit_per_trip' => 8000, 'avg_cost_per_km' => 8.00,
                'most_used_route' => 'Delhi → Jaipur', 'customer_fuel_score' => 65, 'last_calculated_at' => now(),
            ],
        ]);

        // 6. SEED learning_history
        DB::table('learning_history')->insert([
            // Vehicle 1
            ['entity_type' => 'vehicle', 'entity_id' => 1, 'previous_mileage' => 8.5, 'new_mileage' => 8.3, 'confidence_score' => 0.15, 'data_points_used' => 3, 'trigger' => 'trip_completed', 'created_at' => now()->subMonths(6)],
            ['entity_type' => 'vehicle', 'entity_id' => 1, 'previous_mileage' => 8.3, 'new_mileage' => 8.2, 'confidence_score' => 0.30, 'data_points_used' => 6, 'trigger' => 'trip_completed', 'created_at' => now()->subMonths(5)],
            ['entity_type' => 'vehicle', 'entity_id' => 1, 'previous_mileage' => 8.2, 'new_mileage' => 8.1, 'confidence_score' => 0.45, 'data_points_used' => 9, 'trigger' => 'trip_completed', 'created_at' => now()->subMonths(4)],
            ['entity_type' => 'vehicle', 'entity_id' => 1, 'previous_mileage' => 8.1, 'new_mileage' => 8.0, 'confidence_score' => 0.55, 'data_points_used' => 11, 'trigger' => 'trip_completed', 'created_at' => now()->subMonths(3)],
            ['entity_type' => 'vehicle', 'entity_id' => 1, 'previous_mileage' => 8.0, 'new_mileage' => 8.05, 'confidence_score' => 0.65, 'data_points_used' => 13, 'trigger' => 'trip_completed', 'created_at' => now()->subMonths(2)],
            ['entity_type' => 'vehicle', 'entity_id' => 1, 'previous_mileage' => 8.05, 'new_mileage' => 8.1, 'confidence_score' => 0.75, 'data_points_used' => 15, 'trigger' => 'trip_completed', 'created_at' => now()->subMonths(1)],

            // Vehicle 3
            ['entity_type' => 'vehicle', 'entity_id' => 3, 'previous_mileage' => 12.0, 'new_mileage' => 11.5, 'confidence_score' => 0.20, 'data_points_used' => 4, 'trigger' => 'trip_completed', 'created_at' => now()->subMonths(5)],
            ['entity_type' => 'vehicle', 'entity_id' => 3, 'previous_mileage' => 11.5, 'new_mileage' => 11.0, 'confidence_score' => 0.40, 'data_points_used' => 8, 'trigger' => 'trip_completed', 'created_at' => now()->subMonths(4)],
            ['entity_type' => 'vehicle', 'entity_id' => 3, 'previous_mileage' => 11.0, 'new_mileage' => 10.5, 'confidence_score' => 0.90, 'data_points_used' => 18, 'trigger' => 'trip_completed', 'created_at' => now()->subMonths(1)],

            // Driver 1
            ['entity_type' => 'driver', 'entity_id' => 1, 'previous_mileage' => 8.5, 'new_mileage' => 8.2, 'confidence_score' => 0.30, 'data_points_used' => 5, 'trigger' => 'trip_completed', 'created_at' => now()->subMonths(4)],
            ['entity_type' => 'driver', 'entity_id' => 1, 'previous_mileage' => 8.2, 'new_mileage' => 8.0, 'confidence_score' => 0.75, 'data_points_used' => 20, 'trigger' => 'trip_completed', 'created_at' => now()->subMonths(1)],

            // Driver 2
            ['entity_type' => 'driver', 'entity_id' => 2, 'previous_mileage' => 9.5, 'new_mileage' => 9.8, 'confidence_score' => 0.40, 'data_points_used' => 7, 'trigger' => 'trip_completed', 'created_at' => now()->subMonths(3)],
            ['entity_type' => 'driver', 'entity_id' => 2, 'previous_mileage' => 9.8, 'new_mileage' => 10.0, 'confidence_score' => 0.88, 'data_points_used' => 18, 'trigger' => 'trip_completed', 'created_at' => now()->subMonths(1)],
        ]);

        // 7. SEED prediction_history
        $pred2Id = DB::table('prediction_history')->insertGetId([
            'trip_id' => 2, 'predicted_distance' => 850, 'predicted_fuel_liters' => 100, 'predicted_fuel_cost' => 9500,
            'predicted_mileage' => 8.5, 'predicted_duration_hours' => 14, 'predicted_profit' => 12000,
            'actual_distance' => 850, 'actual_fuel_liters' => 106.25, 'actual_fuel_cost' => 10093.75,
            'actual_mileage' => 8.0, 'accuracy_score' => 93.8,
            'prediction_factors' => json_encode(['vehicle_mileage' => 8.5, 'driver_mileage' => 8.0, 'route_mileage' => 8.2, 'cargo_adjustment' => 0.92, 'price' => 95]),
            'created_at' => now()->subDays(5)
        ]);

        $pred3Id = DB::table('prediction_history')->insertGetId([
            'trip_id' => 3, 'predicted_distance' => 320, 'predicted_fuel_liters' => 29, 'predicted_fuel_cost' => 2755,
            'predicted_mileage' => 11.0, 'predicted_duration_hours' => 5.5, 'predicted_profit' => 6000,
            'actual_distance' => 320, 'actual_fuel_liters' => 32, 'actual_fuel_cost' => 3040,
            'actual_mileage' => 10.0, 'accuracy_score' => 89.7,
            'prediction_factors' => json_encode(['vehicle_mileage' => 12.0, 'driver_mileage' => 10.0, 'route_mileage' => 11.5, 'cargo_adjustment' => 0.95, 'price' => 95]),
            'created_at' => now()->subMonths(1)
        ]);

        DB::table('trips')->where('id', 2)->update(['prediction_id' => $pred2Id]);
        DB::table('trips')->where('id', 3)->update(['prediction_id' => $pred3Id]);

        // 8. SEED recommendation_history
        DB::table('recommendation_history')->insert([
            [
                'trip_id' => 2, 'type' => 'vehicle',
                'recommendation' => json_encode(['vehicle_id' => 2, 'vehicle_number' => 'DL01AB5678', 'score' => 85, 'reasoning' => 'Best mileage on this route']),
                'confidence_percent' => 82, 'was_accepted' => true, 'outcome_score' => 88, 'created_at' => now()->subDays(5)
            ],
            [
                'trip_id' => 2, 'type' => 'driver',
                'recommendation' => json_encode(['driver_id' => 3, 'driver_name' => 'Robert Paulson', 'score' => 80, 'reasoning' => 'Available driver with good history on this route']),
                'confidence_percent' => 75, 'was_accepted' => true, 'outcome_score' => 85, 'created_at' => now()->subDays(5)
            ],
            [
                'trip_id' => 3, 'type' => 'vehicle',
                'recommendation' => json_encode(['vehicle_id' => 3, 'vehicle_number' => 'KA03XY9999', 'score' => 92, 'reasoning' => 'High efficiency for this cargo weight']),
                'confidence_percent' => 88, 'was_accepted' => true, 'outcome_score' => 90, 'created_at' => now()->subMonths(1)
            ],
            [
                'trip_id' => 3, 'type' => 'driver',
                'recommendation' => json_encode(['driver_id' => 2, 'driver_name' => 'Jane Smith', 'score' => 95, 'reasoning' => 'Top performing driver overall']),
                'confidence_percent' => 90, 'was_accepted' => true, 'outcome_score' => 92, 'created_at' => now()->subMonths(1)
            ],
            [
                'trip_id' => 3, 'type' => 'budget',
                'recommendation' => json_encode(['budget' => 3500, 'reasoning' => 'Based on predicted mileage and current fuel prices']),
                'confidence_percent' => 85, 'was_accepted' => true, 'outcome_score' => 88, 'created_at' => now()->subMonths(1)
            ],
        ]);
    }
}

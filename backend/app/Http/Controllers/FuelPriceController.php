<?php
namespace App\Http\Controllers;

use App\Models\FuelPrice;
use App\Http\Resources\FuelPriceResource;
use App\Http\Requests\StoreFuelPriceRequest;
use App\Http\Requests\UpdateFuelPriceRequest;
use Illuminate\Http\Request;

class FuelPriceController extends Controller
{
    public function index(Request $request)
    {
        $query = FuelPrice::query()->with('company');

        foreach (['company_id', 'city', 'state', 'fuel_type'] as $field) {
            if ($request->has($field)) {
                $query->where($field, $request->input($field));
            }
        }

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        $data = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => FuelPriceResource::collection($data)
        ]);
    }

    public function store(StoreFuelPriceRequest $request)
    {
        $data = $request->validated();
        $data['is_active'] = $request->boolean('is_active', true);
        $price = FuelPrice::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Fuel price saved',
            'data' => new FuelPriceResource($price->load('company'))
        ], 201);
    }

    public function show(FuelPrice $fuelPrice)
    {
        return response()->json([
            'success' => true,
            'data' => new FuelPriceResource($fuelPrice->load('company'))
        ]);
    }

    public function update(UpdateFuelPriceRequest $request, FuelPrice $fuelPrice)
    {
        $fuelPrice->update($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Fuel price updated',
            'data' => new FuelPriceResource($fuelPrice->load('company'))
        ]);
    }

    public function destroy(FuelPrice $fuelPrice)
    {
        $fuelPrice->delete();
        return response()->json(['success' => true]);
    }
}

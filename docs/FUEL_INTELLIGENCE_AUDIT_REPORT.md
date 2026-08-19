# MASTER FUEL INTELLIGENCE SYSTEM AUDIT & GAP ANALYSIS
**Enterprise Logistics ERP — Comprehensive Architecture, Codebase & Business Intelligence Report**

---

## 1. Executive Summary

This document presents a complete technical, algorithmic, structural, and business audit of the existing **Fuel Intelligence System** in the Logistics ERP platform. The audit covers the entire backend pipeline (Laravel 11, MySQL, Python FastAPI ML Microservice), background job workers (Redis/Queue), frontend interface components (React 18, Tailwind CSS, Lucide React), data models, API endpoints, OCR/receipt parsing workflows, and financial integration hooks.

### Key Audit Highlights:
- **Architecture Maturity**: The application possesses a hybrid dual-engine architecture: a primary **Python FastAPI ML Microservice** utilizing `HistGradientBoostingRegressor` and a fallback **Statistical EWMA Engine** (`decay_factor = 0.85`) written in Laravel PHP.
- **Data Quality & Integrity Risks**: Mileage formulas rely heavily on manually reported odometer readings and static trip distances (`order.route_distance_km`), creating vulnerability to odometer tampering, missing end-of-trip odometer entries, and erroneous distance inputs.
- **AI/ML Reality Check**: Real machine learning exists in `ml_service/model_trainer.py`, but when historical trip data is sparse (<30 trips), it bootstraps using **synthetic dataset generation**. Statistical EWMA blending and hardcoded formulas serve as the primary active fallbacks in production.
- **Financial Integration**: Fully wired via `FuelFinanceService` — approved fuel entries automatically aggregate into `finance_ledgers.diesel_expense`, recalculating trip total expenses, net profit, and profit margin in real-time.
- **Multi-Tenant & Security Vulnerabilities**: Scoping gaps exist in several stats endpoints where `company_id` filters are not strictly enforced from `$request->user()->company_id`, posing potential cross-tenant data leakage risks.

---

## 2. Current Architecture & Data Flow

### Complete System Workflow Trace

```
Trip Created (Order/Dispatch)
      │
      ├──> Trigger: GeneratePredictionJob (Async Queue)
      │      ├──> PythonMlService (FastAPI :8001 /predict-fuel)
      │      │      ├── [Success] -> HistGradientBoostingRegressor Point + 90% CI
      │      │      └── [Failure/Fallback] -> EWMA Blending (Vehicle 40% + Driver 30% + Route 30%)
      │      ├──> Persists: prediction_histories (fuel_budget = point_cost * 1.10)
      │      └──> RecommendationEngine (recommends Vehicle, Driver & Fuel Budget)
      │
Vehicle & Driver Assigned
      │
Trip Started (Status: Running)
      │
Fuel Entry Submitted (Driver Mobile / Admin)
      │      ├──> Option A: Manual Form Entry
      │      └──> Option B: OCR Receipt Scanner (FuelReceiptScannerController -> MockOcrScanner -> FuelReceiptDataExtractor)
      │
Fuel Entry Saved (Status: Pending / Approved)
      │      ├──> AnomalyDetectionService::inspect()
      │      │      ├──> Flags: high_cost, low_mileage, duplicate, odometer_backward, over_capacity, frequent_fill, etc.
      │      │      └──> Updates fuel_entries.is_flagged & flags array
      │      └──> [If Approved] -> FuelFinanceService::syncFuelEntry() -> Updates finance_ledgers.diesel_expense
      │
Trip Completed (Status: Completed)
      │
      └──> Trigger: RecalculateStatisticsJob (Async Queue)
             ├──> StatisticsAggregator::recalculateVehicle(), recalculateDriver(), recalculateRoute(), recalculateCustomer()
             ├──> LearningEngine::learnVehicleMileage() (EWMA decay = 0.85), learnDriverEfficiency(), learnRouteMileage()
             ├──> FuelScoreCalculator::vehicleScore(), driverScore(), routeScore(), tripScore()
             └──> PredictionEngine::trackAccuracy() -> Calculates prediction accuracy_score %
```

---

## 3. Current Fuel Intelligence Capabilities

The current system combines rule-based heuristics, statistical EWMA (Exponentially Weighted Moving Average) learning, and a Scikit-Learn ML microservice:

1. **Dual-Engine Fuel Prediction**:
   - **Primary Engine**: `PythonMlService.php` connects via HTTP POST to `http://localhost:8001/predict-fuel`. Model: `HistGradientBoostingRegressor` with feature inputs: `distance_km`, `cargo_load_ratio`, `driver_score`, `vehicle_age_km`, `vehicle_type_encoded`, `route_terrain`, `traffic_index`, `temp_celsius`.
   - **Fallback Engine**: `PredictionEngine::persistFromEwma()` computes a weighted blend: `(Vehicle Mileage * 0.4) + (Driver Mileage * 0.3) + (Route Mileage * 0.3)` adjusted for cargo weight: `blendedMileage * (1 - (cargoWeight / capacity) * 0.15)`.

2. **Automated Anomaly Detection**:
   - `AnomalyDetectionService.php` inspects every saved fuel entry across 11 distinct rules (e.g., cost > 110% estimate, mileage < 60% baseline, duplicate odometer/station/amount, odometer rollback, tank capacity breach).

3. **Receipt OCR Extraction**:
   - `FuelReceiptDataExtractor.php` uses regex pattern matching to extract quantity, unit price, total amount, odometer, and station dealer name, computing a mathematical validation confidence score (0–100%).

4. **Multi-Entity Statistical Aggregation**:
   - `StatisticsAggregator.php` maintains rolled-up statistics in dedicated SQL tables (`vehicle_statistics`, `driver_statistics`, `route_statistics`, `customer_statistics`).

---

## 4. Current Feature Inventory

| Feature | Implemented? | Partially Implemented? | Missing? | Broken? | Location in Code | Quality | Priority |
| :--- | :---: | :---: | :---: | :---: | :--- | :---: | :---: |
| **Fuel Estimation** | Yes | — | — | — | `backend/app/Services/FuelEstimationService.php#L42` | High | P1 |
| **Fuel Cost Estimation** | Yes | — | — | — | `backend/app/Services/FuelEstimationService.php#L50` | High | P1 |
| **Fuel Entry Management** | Yes | — | — | — | `backend/app/Http/Controllers/FuelEntryController.php#L34` | High | P0 |
| **Fuel Receipt Upload** | Yes | — | — | — | `backend/app/Http/Controllers/FuelReceiptScannerController.php#L24` | Medium | P1 |
| **Document Reader Integration** | Yes | — | — | — | `backend/app/Services/FuelReceiptDataExtractor.php#L13` | High | P1 |
| **OCR Text Extraction** | Yes | — | — | — | `backend/app/Services/Ocr/MockOcrScanner.php#L10` | Mocked | P1 |
| **AI Data Extraction** | — | Yes | — | — | Regex extraction in `FuelReceiptDataExtractor.php` | Medium | P2 |
| **Fuel Price Resolution** | Yes | — | — | — | `backend/app/Models/FuelPrice.php#L26` | High | P1 |
| **Vehicle Mileage Tracking** | Yes | — | — | — | `backend/app/Services/Intelligence/LearningEngine.php#L15` | High | P1 |
| **Driver Mileage Tracking** | Yes | — | — | — | `backend/app/Services/Intelligence/LearningEngine.php#L73` | Medium | P1 |
| **Route Mileage Tracking** | Yes | — | — | — | `backend/app/Services/Intelligence/LearningEngine.php#L115` | Medium | P2 |
| **Trip Distance Calculation** | Yes | — | — | — | `backend/app/Models/Trip.php#L88` | Medium | P1 |
| **Actual Distance (GPS)** | — | Yes | — | — | Fallback to odometer difference in `Trip.php#L90` | Low | P1 |
| **Expected Distance** | Yes | — | — | — | `backend/app/Services/FuelEstimationService.php#L63` | Medium | P1 |
| **Fuel Budget Management** | Yes | — | — | — | `backend/app/Services/Intelligence/PredictionEngine.php#L106` | High | P1 |
| **Estimated Fuel vs Actual** | Yes | — | — | — | `backend/app/Http/Controllers/FuelIntelligenceController.php#L73` | High | P1 |
| **Fuel Variance Analysis** | Yes | — | — | — | `backend/app/Http/Controllers/FuelIntelligenceController.php#L689` | High | P1 |
| **Cost Variance Analysis** | Yes | — | — | — | `backend/app/Http/Controllers/FuelIntelligenceController.php#L112` | High | P1 |
| **Fuel Cost Per KM** | Yes | — | — | — | `backend/app/Services/Intelligence/StatisticsAggregator.php#L64` | High | P1 |
| **Vehicle Fuel Statistics** | Yes | — | — | — | `backend/app/Models/VehicleStatistic.php` | High | P1 |
| **Driver Fuel Statistics** | Yes | — | — | — | `backend/app/Models/DriverStatistic.php` | High | P1 |
| **Route Fuel Statistics** | Yes | — | — | — | `backend/app/Models/RouteStatistic.php` | High | P2 |
| **Customer Fuel Statistics**| Yes | — | — | — | `backend/app/Models/CustomerStatistic.php` | High | P2 |
| **Branch Fuel Statistics**  | — | — | Yes | — | Missing `branch_id` model scoping | — | P2 |
| **Company Fuel Statistics** | Yes | — | — | — | `backend/app/Http/Controllers/FuelIntelligenceController.php#L394` | High | P1 |
| **Fuel Dashboard** | Yes | — | — | — | `src/features/fuel/FuelDashboard.jsx` | High | P1 |
| **Fuel Analytics View** | Yes | — | — | — | `src/features/fuel/FuelAnalytics.jsx` | High | P1 |
| **Fuel Anomaly Detection** | Yes | — | — | — | `backend/app/Services/AnomalyDetectionService.php` | High | P0 |
| **Fuel Fraud Detection** | — | Yes | — | — | Heuristic rules in `AnomalyDetectionService.php#L197` | Medium | P1 |
| **Fuel Recommendations** | Yes | — | — | — | `backend/app/Services/Intelligence/RecommendationEngine.php` | High | P2 |
| **Fuel Efficiency Scores** | Yes | — | — | — | `backend/app/Services/Intelligence/FuelScoreCalculator.php` | High | P2 |
| **Historical EWMA Learning** | Yes | — | — | — | `backend/app/Services/Intelligence/LearningEngine.php` | High | P1 |
| **Python ML Engine** | Yes | — | — | — | `ml_service/model_trainer.py` & `PythonMlService.php` | High | P1 |
| **Live GPS Telemetry** | — | — | Yes | — | No live CAN bus/GPS API stream | — | P2 |
| **Weather & Traffic API** | — | — | Yes | — | Fields exist in DB, no external API fetch | — | P3 |
| **Maintenance Linkage** | — | Yes | — | — | Separate maintenance tables, no mileage correlation | Low | P2 |

---

## 5. Data Collection Audit

### Current vs Missing Data Audit Matrix

| Dimension | Exists in DB? | Auto/Manual | Reliability | Missing Fields / Requirements |
| :--- | :---: | :---: | :---: | :--- |
| **Vehicle** | Yes | Manual/Auto | High | Tank capacity, fuel type, manufacturer mileage exist. Missing engine displacement & wear factor. |
| **Driver** | Yes | Manual | High | Driver name, mobile, license exist. Missing driving behavior logs (harsh braking/speeding). |
| **Trip** | Yes | Auto/Manual | High | Distance, locations, status exist. Cargo weight is manually entered. |
| **Route** | Yes | Auto-Calculated | Medium | Derived from pickup/destination string matching (`RouteStatistic`). Missing waypoints & highway ratio. |
| **Distance** | Yes | Manual/Calculated| Medium | Primary: order route distance. Fallback: odometer difference. Missing verified GPS route trace. |
| **Fuel Entry** | Yes | Manual/OCR | High | Quantity, unit price, total cost, station, odometer, coordinates. |
| **Odometer** | Yes | Manual | Medium | Subject to driver entry errors; protected by `AnomalyDetectionService` rollback flags. |
| **Fuel Price** | Yes | Auto/Manual | High | Multi-level hierarchy (City -> State -> Global -> Hardcoded Fallback). |
| **Cargo Weight** | Yes | Manual | Low | Entered at order creation; no weighbridge scale verification integration. |
| **GPS Tracking** | Partial | Manual Input | Low | Latitude/Longitude captured on fuel receipt submit; no continuous OBD-II / telematics stream. |
| **Weather/Traffic** | Partial | Simulated/Static | Low | Fields `ambient_temp_celsius`, `traffic_index` exist in DB schema, but rely on defaults (`28°C`, `mixed`). |

---

## 6. Fuel Data Quality Audit

### Empirical Data Integrity Inspection Findings

1. **Duplicate Receipt Submissions**:
   - *Evidence*: `backend/app/Services/AnomalyDetectionService.php#L92`
   - *Detection Logic*: Checks if an entry exists with identical `trip_id`, `quantity`, `station_name`, and `odometer`. Flags as `duplicate_entry` with `critical` severity.

2. **Odometer Decreasing / Rollback**:
   - *Evidence*: `backend/app/Services/AnomalyDetectionService.php#L123` & `L242`
   - *Detection Logic*: Compares `$entry->odometer` against `$prev->odometer`. If lower, triggers `odometer_backward` and `odometer_rollback` critical flags.

3. **Fuel Quantity Exceeding Tank Capacity**:
   - *Evidence*: `backend/app/Services/AnomalyDetectionService.php#L146`
   - *Detection Logic*: Compares `$entry->quantity` with `$vehicle->tankCapacity()` (default 300L). Flags `quantity_over_capacity`.

4. **Frequent Refill Anomaly**:
   - *Evidence*: `backend/app/Services/AnomalyDetectionService.php#L162`
   - *Detection Logic*: Checks for $\ge 2$ fuel fills for the same vehicle within a $\pm 6$ hour window. Flags `frequent_fill`.

5. **OCR Extraction Errors**:
   - *Evidence*: `backend/app/Services/FuelReceiptDataExtractor.php#L95`
   - *Validation Logic*: Checks `$quantity * $unit_price == $total_cost`. If variance is $> \text{₹}1.00$, deducts 20 points from confidence score.

---

## 7. Mileage Engine Audit

### Current Mileage Formula & Implementation

The application employs a **Decaying Exponentially Weighted Moving Average (EWMA)** for learning entity mileage over time.

$$\text{Weight}_i = \text{DECAY\_FACTOR}^i \quad \text{where } \text{DECAY\_FACTOR} = 0.85$$

$$\text{Learned Mileage} = \frac{\sum_{i=0}^{N-1} \left( \text{Mileage}_i \times 0.85^i \right)}{\sum_{i=0}^{N-1} 0.85^i}$$

```php
// File: backend/app/Services/Intelligence/LearningEngine.php (Lines 15-46)
foreach ($trips as $i => $trip) {
    $dist = $trip->actualDistance();
    $liters = $trip->actualFuelLiters();
    if ($dist <= 0 || $liters <= 0) continue;
    
    $mileage = $dist / $liters;
    $weight = pow(0.85, $i);
    
    $numerator += $mileage * $weight;
    $denominator += $weight;
    $dataPoints++;
}
```

### Cold-Start Bootstrap Formula:
When completed trip data points $N < 3$, the engine blends manufacturer mileage ($M_{\text{mfg}}$) with learned mileage ($M_{\text{learned}}$):

$$M_{\text{final}} = \left( M_{\text{mfg}} \times \frac{3 - N}{3} \right) + \left( M_{\text{learned}} \times \frac{N}{3} \right)$$

### Engine Evaluation:
- **Strengths**: Recent trips have exponentially higher influence ($0.85^0 = 1.0$, $0.85^1 = 0.85$, $0.85^2 = 0.7225$). Prevents ancient trip data from skewing current vehicle condition.
- **Weaknesses**: Unapproved or unflagged bad fuel entries can still distort the moving average if approved by a dispatcher without proper verification.

---

## 8. Fuel Estimation Audit

### Current Estimation Pipeline

`FuelEstimationService.php` resolves estimation via:

$$\text{Distance} = \text{Trip Distance} \text{ (or Order Route Distance)}$$

$$\text{Mileage} = \text{Historical Vehicle EWMA Mileage} \quad (\text{fallback to } vehicle->effectiveMileage() \text{ or } 4.0\text{ km/L})$$

$$\text{Estimated Liters} = \frac{\text{Distance}}{\max(\text{Mileage}, 0.1)}$$

$$\text{Estimated Cost} = \text{Estimated Liters} \times \text{Resolved Price Per Liter}$$

```php
// File: backend/app/Services/FuelEstimationService.php (Lines 46-50)
$mileage = $vehicle ? $this->resolveMileage($vehicle) : 4.0;
$fuelLiters = $distance > 0 ? round($distance / max($mileage, 0.1), 2) : 0;
$price = $this->resolvePrice($trip, $vehicle);
$fuelCost = $fuelLiters > 0 ? round($fuelLiters * $price['price_per_liter'], 2) : 0;
```

### Weaknesses Identified:
1. Does not dynamically adjust basic estimations for cargo weight or elevation in `FuelEstimationService` (though `PredictionEngine` EWMA fallback does apply cargo penalty).
2. Linear fallback to 4.0 km/L if vehicle history is completely absent.

---

## 9. Fuel Cost Estimation Audit

### Fuel Price Resolution Priority Chain

`FuelPrice::resolve()` resolves current fuel prices using a hierarchical fallback order:

```
1. Company + City + Fuel Type + Date Range Match
      ↓ (if null)
2. Company + State + Fuel Type + Date Range Match
      ↓ (if null)
3. Company + Global Fuel Type + Date Range Match
      ↓ (if null)
4. System Hardcoded Fallback:
      - Petrol: ₹106.00 / L
      - Diesel: ₹92.00 / L
      - CNG:    ₹76.00 / L
```

*Code Evidence*: `backend/app/Models/FuelPrice.php#L26-L58` & `backend/app/Services/FuelEstimationService.php#L146-L150`.

---

## 10. Driver Intelligence Audit

- **Driver Metrics**: Tracked via `driver_statistics` SQL table. Stores `total_trips`, `total_distance_km`, `total_fuel_liters`, `total_fuel_cost`, `avg_mileage_kmpl`, `avg_fuel_cost_per_km`, and `fuel_score`.
- **Driver Fuel Score Formula**:
  ```php
  // File: backend/app/Services/Intelligence/FuelScoreCalculator.php#L43
  $mileageEfficiency = min(100, ($stats->avg_mileage_kmpl / 4.0) * 100);
  ```
- **Audit Findings**: Driver comparison currently compares raw `avg_mileage_kmpl` without normalizing for load ratio or terrain, which could penalize drivers taking heavy cargo on hilly routes.

---

## 11. Vehicle Intelligence Audit

- **Vehicle Metrics**: Tracked via `vehicle_statistics` SQL table. Stores `current_learned_mileage`, `confidence_score`, `fuel_score`, `total_distance_km`, `total_fuel_liters`, `total_fuel_cost`.
- **Vehicle Fuel Score Formula**:
  ```php
  // File: backend/app/Services/Intelligence/FuelScoreCalculator.php#L30
  $score = ($mileageEfficiency * 0.4) + ($costEfficiency * 0.3) + ((1 - $anomalyRate) * 100 * 0.2) + $trendBonus;
  ```
- **Mileage Degradation Detection**:
  - *Evidence*: `AnomalyDetectionService.php#L82` flags an entry if current segment mileage is $> 40\%$ below the vehicle's `current_avg_mileage`.

---

## 12. Route Intelligence Audit

- **Route Key**: Unique string generated as `MD5(UPPER(pickup) . '_' . UPPER(destination))`.
- **Route Metrics**: `route_statistics` table stores `avg_distance_km`, `avg_fuel_liters`, `avg_fuel_cost`, `avg_duration_hours`, `avg_mileage_kmpl`, `avg_revenue`, `avg_profit`, `best_vehicle_id`, `best_driver_id`, `worst_vehicle_id`, `worst_driver_id`.
- *Code Evidence*: `backend/app/Services/Intelligence/StatisticsAggregator.php#L70-L161`.

---

## 13. Fuel Anomaly Detection Audit

`AnomalyDetectionService.php` contains 11 distinct rule-based anomaly inspect methods:

1. `highCostVsEstimate`: Triggers if entry cost exceeds estimated trip cost by $> 10\%$.
2. `lowMileage`: Triggers if segment mileage is $> 40\%$ below vehicle average.
3. `duplicateEntry`: Triggers on matching `trip_id`, `quantity`, `station_name`, `odometer`.
4. `odometerIssues`: Triggers on backward reading or implausibly high mileage ($> 25\text{ km/L}$).
5. `overCapacity`: Triggers if quantity exceeds vehicle tank capacity.
6. `frequentFill`: Triggers if $\ge 2$ entries are logged within 6 hours.
7. `fuelTheftPattern`: Triggers if $\ge 4$ of last 5 trips show $> 15\%$ negative fuel variance.
8. `repeatedFilling`: Triggers if same station & similar amount filled within 2 hours.
9. `odometerRollback`: Explicit check for current odometer < previous odometer.
10. `distanceFuelMismatch`: Triggers if implied mileage $< 50\%$ of learned mileage.
11. `driverOutlier`: Triggers if consumption rate deviates significantly from driver average.

---

## 14. AI / Machine Learning Audit

### Real ML vs Rule-Based Architecture Comparison

```
                    ┌────────────────────────────────────────────────────────┐
                    │               Python ML Microservice                   │
                    │               (FastAPI on Port 8001)                   │
                    │  - Model: HistGradientBoostingRegressor                │
                    │  - Features: distance, cargo_ratio, driver_score,      │
                    │    vehicle_age_km, vehicle_type, terrain, traffic, temp│
                    │  - Outputs: point estimate, 90% CI bounds, R², MAE     │
                    └───────────────────────────┬────────────────────────────┘
                                                │
                                       Http::post() call
                                                │
                                                ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PredictionEngine.php                                   │
│                                                                                        │
│   if ($mlResult['ml_available']) ───────────────────────────► Use Python ML Output      │
│   else ────────────────────────────────────────────────────► Fallback to EWMA Blend    │
│                                                               (Vehicle 40% + Driver 30%│
│                                                                + Route 30% - Cargo Adj)│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

- **ML Microservice Location**: `ml_service/model_trainer.py` & `ml_service/main.py`.
- **Synthetic Training Bootstrapping**: `model_trainer.py#L92` automatically generates 500-600 synthetic training samples when real trip records are $< 30$.

---

## 15. Prediction Engine Audit

- **Execution Flow**: `PredictionEngine::predictTrip(Trip $trip)`.
- **Budget Contingency**: Automatically calculates trip `fuel_budget = predicted_fuel_cost * 1.10` (10% contingency buffer).
- **Accuracy Tracking**: When a trip completes, `PredictionEngine::trackAccuracy($trip)` calculates error percentage:
  $$\text{Accuracy Score} = \max\left(0, 100 - \left| \frac{\text{Predicted Cost} - \text{Actual Cost}}{\text{Predicted Cost}} \right| \times 100\right)$$
  and stores it in `prediction_histories.accuracy_score`.

---

## 16. Recommendation Engine Audit

`RecommendationEngine.php` provides 4 actionable recommendation types:
1. `recommendVehicle($pickup, $destination, $cargoWeight)`: Ranks top 3 vehicles by combined score: $(0.4 \times \text{FuelScore}) + (0.3 \times \text{LearnedMileageScore}) + (0.2 \times \text{RouteScore}) + (0.1 \times \text{CapacityScore})$.
2. `recommendDriver($pickup, $destination)`: Ranks top 3 drivers by: $(0.4 \times \text{FuelScore}) + (0.3 \times \text{RouteFamiliarity}) + (0.3 \times \text{Efficiency})$.
3. `recommendFuelBudget($trip)`: Calculates baseline predicted cost vs 10% contingency budget and status color.
4. `recommendFuelStops($trip)`: Recommends stop locations based on $80\%$ of vehicle safe range ($\text{Tank Capacity} \times \text{Mileage} \times 0.8$).

---

## 17. Fuel Dashboard & Frontend UI Audit

Frontend modules located in `src/features/fuel/`:
- `FuelDashboard.jsx`: Executive summary metrics (Today's fuel cost, monthly cost, fleet average mileage, cost per km, vehicle/driver cost breakdown, monthly trend chart).
- `FuelAnalytics.jsx`: Multi-dimensional filtering by vehicle, driver, route, company, month, year, and anomalies.
- `FuelPredictionCenter.jsx`: Interactive live trip prediction sandbox with feature importance sliders and 90% confidence interval visualizer.
- `FuelScoreboard.jsx`: Ranked leaderboards for vehicles, drivers, and routes.
- `FuelVarianceAnalysis.jsx`: Estimation vs actual variance comparison table with root cause indicators.
- `TripFuelPanel.jsx`: Tabbed widget embedded inside Trip Detail view.

---

## 18. Finance Integration Audit

- **Service**: `backend/app/Services/FuelFinanceService.php`.
- **Automation Trigger**: Whenever a `FuelEntry` status changes to `Approved`, `FuelFinanceService::syncFuelEntry()` is called.
- **Financial Math**:
  $$\text{diesel\_expense} = \sum \text{Approved FuelEntries total\_cost}$$
  $$\text{total\_expenses} = \text{diesel\_expense} + \text{toll\_expense} + \text{driver\_allowance} + \text{loading} + \text{unloading} + \text{other}$$
  $$\text{net\_profit} = \text{trip\_amount} - \text{total\_expenses}$$
  $$\text{profit\_margin} = \left( \frac{\text{net\_profit}}{\text{trip\_amount}} \right) \times 100$$

---

## 19. Trip Integration Audit

- **Trip Creation / Dispatch**: Triggers `GeneratePredictionJob::dispatch($trip)` asynchronously.
- **Trip Completion**: Triggers `RecalculateStatisticsJob::dispatch($trip)` asynchronously.
- **Trip Cancellation / Reopening**: Trip actuals update, but statistics recalculation is strictly scoped to `status === 'Completed'`.

---

## 20. Smart Document Reader Audit

- **Controllers & Services**: `FuelReceiptScannerController.php` & `FuelReceiptDataExtractor.php`.
- **Regex Field Extraction**: Extracts quantity, rate, total amount, odometer, dealer name.
- **Confidence Scoring**: Starts at 0, adds +20 points for each detected key field, +10 bonus for mathematical validation ($\text{Qty} \times \text{Rate} == \text{Amount}$), -20 penalty for mismatch.

---

## 21. API Audit

| Endpoint | Method | Controller & Method | Description |
| :--- | :---: | :--- | :--- |
| `/api/v1/fuel-entries` | GET/POST | `FuelEntryController@index`, `@store` | Paginated fuel entries & entry creation |
| `/api/v1/fuel-entries/{id}` | GET/PUT/DEL| `FuelEntryController@show`, `@update`, `@destroy` | Fuel entry CRUD operations |
| `/api/v1/fuel-entries/{id}/approve` | POST | `FuelEntryController@approve` | Approve entry & trigger finance sync |
| `/api/v1/fuel-entries/{id}/reject` | POST | `FuelEntryController@reject` | Reject entry |
| `/api/v1/fuel-entries/parse-receipt` | POST | `FuelReceiptScannerController@scan` | Upload receipt image & run OCR |
| `/api/v1/fuel-prices` | GET/POST | `FuelPriceController` | Fuel price master CRUD |
| `/api/v1/fuel/estimate-preview` | POST | `FuelIntelligenceController@estimatePreview` | Live pre-dispatch fuel estimate |
| `/api/v1/fuel/trips/{trip}/breakdown`| GET | `FuelIntelligenceController@tripBreakdown` | Estimate vs actual trip breakdown |
| `/api/v1/fuel/dashboard` | GET | `FuelIntelligenceController@dashboard` | Executive fuel dashboard metrics |
| `/api/v1/fuel/analytics` | GET | `FuelIntelligenceController@analytics` | Deep analytics by dimension |
| `/api/v1/fuel/intelligence/overview` | GET | `FuelIntelligenceController@intelligenceOverview` | Fleet scores & accuracy summary |
| `/api/v1/fuel/intelligence/predictions`| GET | `FuelIntelligenceController@predictionHistory` | Prediction history log |
| `/api/v1/fuel/intelligence/predict` | POST | `FuelIntelligenceController@predictOnDemand` | On-demand ML prediction endpoint |
| `/api/v1/fuel/intelligence/recommend` | POST | `FuelIntelligenceController@recommendOnDemand` | On-demand vehicle/driver recommendation |
| `/api/v1/fuel/intelligence/anomalies` | GET | `FuelIntelligenceController@anomalyDashboard` | Flagged fuel entries & anomaly queue |

---

## 22. Database Audit

### Schema Normalization & Entities Overview

1. **`fuel_entries`**: Stores `trip_id`, `company_id`, `vehicle_id`, `driver_id`, `quantity`, `unit_price`, `total_cost`, `odometer`, `station_name`, `receipt_path`, `is_flagged`, `flags` (json), `status`.
2. **`fuel_prices`**: Stores `company_id`, `state`, `city`, `fuel_type`, `price_per_liter`, `effective_from`, `effective_to`, `is_active`.
3. **`prediction_histories`**: Stores `trip_id`, `predicted_distance`, `predicted_fuel_liters`, `predicted_fuel_cost`, `predicted_mileage`, `actual_fuel_cost`, `accuracy_score`, `prediction_factors` (json).
4. **`recommendation_histories`**: Stores `trip_id`, `type`, `recommendation` (json), `confidence_percent`.
5. **`vehicle_statistics`**: Stores `vehicle_id`, `total_trips`, `total_distance_km`, `total_fuel_liters`, `total_fuel_cost`, `avg_mileage_kmpl`, `current_learned_mileage`, `confidence_score`, `fuel_score`.
6. **`driver_statistics`**: Stores `driver_id`, `total_trips`, `total_distance_km`, `total_fuel_liters`, `total_fuel_cost`, `avg_mileage_kmpl`, `avg_fuel_cost_per_km`, `fuel_score`.
7. **`route_statistics`**: Stores `route_key`, `pickup_location`, `destination`, `total_trips`, `avg_distance_km`, `avg_fuel_liters`, `avg_fuel_cost`, `avg_mileage_kmpl`, `best_vehicle_id`, `best_driver_id`.
8. **`customer_statistics`**: Stores `company_id`, `total_trips`, `total_distance_km`, `total_fuel_cost`, `avg_cost_per_km`.
9. **`learning_histories`**: Stores `entity_type`, `entity_id`, `previous_mileage`, `new_mileage`, `confidence_score`, `trigger`, `trip_id`.

---

## 23. Performance Audit

- **Indexes**: Performance and isolation composite indexes added in migration `2026_08_11_000000_add_performance_and_isolation_indexes.php` on `fuel_entries(company_id, status)`, `fuel_entries(vehicle_id, filled_at)`, `fuel_entries(driver_id, filled_at)`.
- **Asynchronous Heavy Processing**: `GeneratePredictionJob` and `RecalculateStatisticsJob` offload ML prediction and statistical rollup off the main HTTP request thread onto Redis background queues.
- **Query Optimization**: Dashboard endpoints utilize eager loading `with(['vehicle', 'driver', 'company', 'trip'])` to avoid N+1 query overhead.

---

## 24. Security Audit

- **Authentication**: All fuel APIs protected by Laravel Sanctum middleware (`auth:sanctum`).
- **Multi-Tenant Scoping**: `FuelEntryController` enforces tenant company isolation (`$user->company_id`).
- **Authorization**: Approval and rejection endpoints restrict modifications to authorized users.

---

## 25. Scalability Audit

- **100,000+ Trip Horizon**: With composite indexes and server-side capped pagination (`per_page <= 100`), table reads remain fast.
- **Background Queue Decoupling**: Heavy statistical recalculations do not block user requests.
- **Microservice Isolation**: Python FastAPI ML engine runs independently on port 8001, ensuring Python compute overhead does not starve the Laravel HTTP process.

---

## 26. Data Learning Readiness

- **Current Dataset State**: Real trip datasets are currently limited. The Python ML trainer successfully bootstraps with realistic synthetic data (`_generate_synthetic_data(600)`).
- **Minimum Recommended Dataset Size for Production ML**:
  - Vehicle Mileage Model: $\ge 200$ completed trips per vehicle class.
  - Anomaly Detection Model: $\ge 1,000$ verified fuel receipts.
  - Route Efficiency Model: $\ge 50$ trips per specific origin-destination pair.

---

## 27. Data Collection Requirements

To evolve into a Grade-A Enterprise Fuel Intelligence system, the following data collection additions are recommended:
1. **Telematics / CAN-Bus Integration**: Capture exact fuel level percentage directly from ECU/CAN-bus sensors to detect silent siphoning while parked.
2. **Geofenced Station Verification**: Cross-reference mobile fuel entry GPS coordinates with known petrol pump geofences.
3. **Weighbridge Integration**: Automated capture of gross vs tare cargo weight to eliminate manual weight entry inaccuracy.

---

## 28. Recommended Target Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   React 18 Frontend                                    │
│       (FuelDashboard, FuelAnalytics, FuelPredictionCenter, TripFuelPanel)              │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ REST API / JSON
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Laravel 11 ERP Backend Core                               │
│  - FuelEntryController & DocumentReaderController                                      │
│  - AnomalyDetectionService & FuelFinanceService                                        │
│  - RecalculateStatisticsJob & GeneratePredictionJob                                    │
└─────────────────────┬─────────────────────────────────────────────┬────────────────────┘
                      │ DB Queries                                  │ HTTP :8001
                      ▼                                             ▼
┌──────────────────────────────────────────┐    ┌────────────────────────────────────────┐
│               MySQL 8.0                  │    │       Python FastAPI ML Engine         │
│  - fuel_entries, fuel_prices             │    │  - HistGradientBoostingRegressor       │
│  - vehicle_statistics, driver_statistics │    │  - Quantile Regression Bounds          │
│  - prediction_histories, learning_logs   │    │  - Feature Importance Analysis         │
└──────────────────────────────────────────┘    └────────────────────────────────────────┘
```

---

## 29. Improvement Roadmap

### Phase 1: Security & Multi-Tenant Scoping Polish (P0)
- Enforce strict `$user->company_id` scoping across all `FuelIntelligenceController` analytics and overview endpoints.

### Phase 2: Enhanced Anomaly Detection & Geofencing (P1)
- Add geofence validation comparing fuel entry lat/long against petrol pump locations.
- Implement driver load-normalized efficiency scoring.

### Phase 3: Real OCR Service Integration (P1)
- Replace `MockOcrScanner` with AWS Textract or Tesseract OCR for live receipt image extraction.

### Phase 4: CAN-Bus & Telematics Stream (P2)
- Integrate GPS telematics API for continuous odometer and tank level telemetry.

---

## 30. Priority Matrix

### P0 — Critical (Security & Correctness)
1. **Multi-Tenant Scoping Hardening**: Ensure all `FuelIntelligenceController` aggregate queries scope by tenant `$user->company_id`.
2. **Transaction Scoping in Approval**: Wrap `FuelEntryController@approve` and `FuelFinanceService@syncFuelEntry` inside an explicit DB transaction.

### P1 — Very Important (Reliability & OCR)
1. **Real OCR Engine Swap**: Wire a production-grade OCR engine (Tesseract / AWS Textract) into `OcrScannerInterface`.
2. **Driver Load Normalization**: Adjust driver fuel score formula to account for cargo weight ratio and route terrain.

### P2 — Important (Analytics & Feature Enhancements)
1. **Geofenced Station Check**: Verify fuel fill GPS coordinates against station location.
2. **Maintenance-Mileage Correlation**: Correlate declining vehicle mileage trends with overdue maintenance logs.

### P3 — Enhancement (Future Scope)
1. **Live Weather & Traffic API Integration**: Connect OpenWeather & Google Distance Matrix API into feature payload for ML training.
2. **Automated Driver Coaching Alerts**: Trigger push notifications to drivers exhibiting low fuel score trends.

---
*Report compiled autonomously by Enterprise Fuel Intelligence Architect.*

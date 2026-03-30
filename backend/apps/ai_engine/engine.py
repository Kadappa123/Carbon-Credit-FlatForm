import numpy as np
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class CarbonAIVerifier:
    """
    AI Engine for carbon emission verification.
    Uses statistical analysis and rule-based checks.
    In production, replace with trained ML model.
    """

    # Industry benchmark emissions (tons CO2 per unit production)
    INDUSTRY_BENCHMARKS = {
        'manufacturing': {'emission_factor': 0.45, 'energy_factor': 0.8},
        'energy': {'emission_factor': 0.85, 'energy_factor': 0.95},
        'transport': {'emission_factor': 0.65, 'energy_factor': 0.7},
        'agriculture': {'emission_factor': 0.35, 'energy_factor': 0.4},
        'construction': {'emission_factor': 0.5, 'energy_factor': 0.6},
        'chemical': {'emission_factor': 0.75, 'energy_factor': 0.85},
        'mining': {'emission_factor': 0.6, 'energy_factor': 0.7},
        'tech': {'emission_factor': 0.15, 'energy_factor': 0.2},
        'other': {'emission_factor': 0.5, 'energy_factor': 0.6},
    }

    def verify_submission(self, submission):
        """
        Full verification pipeline for an emission submission.
        Returns dict with verified_emissions, confidence_score, fraud_flag, notes.
        """
        results = {
            'verified_emissions': None,
            'confidence_score': 0.0,
            'fraud_flag': False,
            'notes': [],
        }

        industry = submission.company.industry
        benchmark = self.INDUSTRY_BENCHMARKS.get(industry, self.INDUSTRY_BENCHMARKS['other'])

        # Step 1: Cross-validate CO2 from energy consumption
        estimated_from_energy = self._estimate_co2_from_energy(
            submission.energy_consumption,
            submission.fuel_consumption,
            submission.renewable_energy_percentage,
        )

        # Step 2: Production-based estimation
        estimated_from_production = self._estimate_co2_from_production(
            submission.production_volume,
            benchmark['emission_factor'],
        )

        # Step 3: Variance check
        reported = submission.total_co2_emissions
        estimates = [e for e in [estimated_from_energy, estimated_from_production] if e > 0]

        if estimates:
            avg_estimate = np.mean(estimates)
            variance = abs(reported - avg_estimate) / max(avg_estimate, 1)

            if variance > 0.5:
                results['fraud_flag'] = True
                results['notes'].append(
                    f"ALERT: Reported emissions ({reported:.2f}t) deviate {variance*100:.1f}% from AI estimate ({avg_estimate:.2f}t)"
                )
                confidence = max(0.1, 1 - variance)
            elif variance > 0.25:
                results['notes'].append(
                    f"WARNING: Minor deviation ({variance*100:.1f}%) between reported and estimated emissions."
                )
                confidence = max(0.5, 1 - variance)
            else:
                results['notes'].append("Emission data consistent with AI estimates.")
                confidence = min(0.99, 1 - (variance * 0.5))

            results['verified_emissions'] = avg_estimate
            results['confidence_score'] = round(confidence, 4)
        else:
            # Fallback: trust reported value with lower confidence
            results['verified_emissions'] = reported
            results['confidence_score'] = 0.65
            results['notes'].append("Insufficient data for cross-validation; using reported value.")

        # Step 4: Anomaly detection
        self._detect_anomalies(submission, results)

        # Step 5: Calculate carbon credit score
        results['carbon_credit_score'] = self._calculate_score(
            submission, results['verified_emissions']
        )
        results['recommended_credits'] = self._recommend_credits(
            submission, results['verified_emissions']
        )

        return results

    def _estimate_co2_from_energy(self, energy_kwh, fuel_liters, renewable_pct):
        """Estimate CO2 from energy and fuel consumption"""
        if energy_kwh <= 0 and fuel_liters <= 0:
            return 0

        # Grid electricity emission factor: 0.233 kg CO2/kWh (global average)
        grid_factor = 0.000233  # tons per kWh
        non_renewable_energy = energy_kwh * (1 - renewable_pct / 100)
        co2_from_energy = non_renewable_energy * grid_factor

        # Diesel: 2.68 kg CO2/liter
        co2_from_fuel = fuel_liters * 0.00268  # tons

        return co2_from_energy + co2_from_fuel

    def _estimate_co2_from_production(self, production_volume, emission_factor):
        """Estimate CO2 from production volume"""
        if production_volume <= 0:
            return 0
        return production_volume * emission_factor

    def _detect_anomalies(self, submission, results):
        """Detect suspicious patterns"""
        # Check if renewable % is unusually high
        if submission.renewable_energy_percentage > 95:
            results['notes'].append(
                "NOTE: Claimed renewable energy >95% is unusually high; manual verification recommended."
            )
            results['confidence_score'] *= 0.9

        # Check for zero values that shouldn't be zero
        if submission.energy_consumption == 0 and submission.total_co2_emissions > 100:
            results['fraud_flag'] = True
            results['notes'].append(
                "ALERT: Zero energy consumption reported despite high CO2 emissions."
            )

        # Check negative waste or water values
        if submission.waste_generated < 0 or submission.water_usage < 0:
            results['fraud_flag'] = True
            results['notes'].append("ALERT: Negative values detected in submission data.")

    def _calculate_score(self, submission, verified_emissions):
        """Calculate carbon credit score (0-100)"""
        permitted = submission.company.permitted_emission_limit
        if permitted <= 0:
            return 50.0  # Default score if no limit set yet

        ratio = verified_emissions / permitted

        if ratio <= 0.5:
            base_score = 90
        elif ratio <= 0.7:
            base_score = 80
        elif ratio <= 0.9:
            base_score = 65
        elif ratio <= 1.0:
            base_score = 50
        elif ratio <= 1.2:
            base_score = 35
        elif ratio <= 1.5:
            base_score = 20
        else:
            base_score = 10

        # Bonus for renewables
        renewable_bonus = min(10, submission.renewable_energy_percentage * 0.1)
        # Sustainability initiative bonus
        if submission.company.sustainability_initiatives:
            renewable_bonus += 5

        return min(100, round(base_score + renewable_bonus, 2))

    def _recommend_credits(self, submission, verified_emissions):
        """Recommend credit allocation"""
        permitted = submission.company.permitted_emission_limit
        if permitted <= 0:
            return 10  # Default

        difference = permitted - verified_emissions
        if difference > 0:
            return max(0, int(difference / 10))  # 1 credit per 10 tons saved
        return 0

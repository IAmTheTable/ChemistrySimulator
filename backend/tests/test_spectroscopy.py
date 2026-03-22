"""Tests for the spectroscopy engine and API endpoints."""

import pytest

from app.engine.spectroscopy import SpectroscopyEngine


# ---------------------------------------------------------------------------
# Engine unit tests
# ---------------------------------------------------------------------------

class TestIRSpectrum:
    def setup_method(self):
        self.engine = SpectroscopyEngine(seed=42)

    def test_returns_x_y_arrays(self):
        result = self.engine.generate_ir_spectrum("C2H5OH")
        assert "x" in result
        assert "y" in result
        assert len(result["x"]) == len(result["y"])
        assert len(result["x"]) > 100

    def test_returns_peaks(self):
        result = self.engine.generate_ir_spectrum("C2H5OH")
        assert "peaks" in result
        assert len(result["peaks"]) > 0
        for peak in result["peaks"]:
            assert "position" in peak
            assert "label" in peak

    def test_transmittance_range(self):
        result = self.engine.generate_ir_spectrum("CH4")
        for v in result["y"]:
            assert 0.0 <= v <= 1.0

    def test_wavenumber_range(self):
        result = self.engine.generate_ir_spectrum("H2O")
        assert max(result["x"]) == 4000
        assert min(result["x"]) > 300

    def test_oh_peak_detected_for_water(self):
        result = self.engine.generate_ir_spectrum("H2O")
        labels = [p["label"] for p in result["peaks"]]
        assert any("O-H" in label for label in labels)

    def test_ch_peak_detected_for_methane(self):
        result = self.engine.generate_ir_spectrum("CH4")
        labels = [p["label"] for p in result["peaks"]]
        assert any("C-H" in label for label in labels)

    def test_carbonyl_peak_for_formaldehyde(self):
        result = self.engine.generate_ir_spectrum("CH2O")
        labels = [p["label"] for p in result["peaks"]]
        assert any("C=O" in label for label in labels)

    def test_axis_labels(self):
        result = self.engine.generate_ir_spectrum("H2O")
        assert "x_label" in result
        assert "y_label" in result


class TestUVVisSpectrum:
    def setup_method(self):
        self.engine = SpectroscopyEngine(seed=42)

    def test_returns_x_y_arrays(self):
        result = self.engine.generate_uv_vis_spectrum("C6H6")
        assert "x" in result
        assert "y" in result
        assert len(result["x"]) == len(result["y"])

    def test_returns_lambda_max(self):
        result = self.engine.generate_uv_vis_spectrum("C6H6")
        assert "lambda_max" in result
        assert isinstance(result["lambda_max"], (int, float))
        assert 190 <= result["lambda_max"] <= 800

    def test_wavelength_range(self):
        result = self.engine.generate_uv_vis_spectrum("H2O")
        assert min(result["x"]) == 190
        assert max(result["x"]) == 799

    def test_returns_peaks(self):
        result = self.engine.generate_uv_vis_spectrum("C6H6")
        assert "peaks" in result
        assert len(result["peaks"]) > 0

    def test_aromatic_pi_pi_star(self):
        result = self.engine.generate_uv_vis_spectrum("C6H6")
        labels = [p["label"] for p in result["peaks"]]
        assert any("pi->pi*" in label for label in labels)

    def test_axis_labels(self):
        result = self.engine.generate_uv_vis_spectrum("H2O")
        assert "x_label" in result
        assert "y_label" in result


class TestMassSpectrum:
    def setup_method(self):
        self.engine = SpectroscopyEngine(seed=42)

    def test_returns_x_y_arrays(self):
        result = self.engine.generate_mass_spectrum("H2O")
        assert "x" in result
        assert "y" in result
        assert len(result["x"]) == len(result["y"])

    def test_returns_molecular_ion(self):
        result = self.engine.generate_mass_spectrum("H2O")
        assert "molecular_ion" in result
        assert result["molecular_ion"] == 18  # MW of water

    def test_molecular_ion_peak_present(self):
        result = self.engine.generate_mass_spectrum("H2O")
        mw = result["molecular_ion"]
        assert result["y"][mw] > 0

    def test_ethanol_molecular_ion(self):
        result = self.engine.generate_mass_spectrum("C2H6O")
        assert result["molecular_ion"] == 46

    def test_fragment_peaks(self):
        result = self.engine.generate_mass_spectrum("C2H6O")
        assert "peaks" in result
        assert len(result["peaks"]) > 1  # M+ and fragments

    def test_base_peak_is_100(self):
        result = self.engine.generate_mass_spectrum("C2H6O")
        assert max(result["y"]) == pytest.approx(100.0, abs=0.1)

    def test_axis_labels(self):
        result = self.engine.generate_mass_spectrum("H2O")
        assert "x_label" in result
        assert "y_label" in result

    def test_returns_peak_labels(self):
        result = self.engine.generate_mass_spectrum("C2H6O")
        labels = [p["label"] for p in result["peaks"]]
        assert any("M+" in label for label in labels)


# ---------------------------------------------------------------------------
# API integration tests
# ---------------------------------------------------------------------------

def test_ir_api(client):
    response = client.get("/api/spectroscopy/ir/H2O")
    assert response.status_code == 200
    data = response.json()
    assert "x" in data
    assert "y" in data
    assert "peaks" in data


def test_uv_vis_api(client):
    response = client.get("/api/spectroscopy/uv-vis/C6H6")
    assert response.status_code == 200
    data = response.json()
    assert "x" in data
    assert "y" in data
    assert "lambda_max" in data


def test_mass_spec_api(client):
    response = client.get("/api/spectroscopy/mass-spec/C2H6O")
    assert response.status_code == 200
    data = response.json()
    assert "x" in data
    assert "y" in data
    assert "molecular_ion" in data

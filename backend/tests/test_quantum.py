"""Tests for quantum chemistry endpoints and engines."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.engine.geometry_optimizer import GeometryOptimizer
from app.engine.electron_density import ElectronDensityCalculator


@pytest.fixture
def client():
    return TestClient(app)


# ---------------------------------------------------------------------------
# Geometry Optimizer unit tests
# ---------------------------------------------------------------------------


class TestGeometryOptimizer:
    def setup_method(self):
        self.optimizer = GeometryOptimizer()

    def test_optimize_water_returns_bond_lengths(self):
        result = self.optimizer.optimize("O")  # water
        assert "bond_lengths" in result
        assert len(result["bond_lengths"]) > 0
        bl = result["bond_lengths"][0]
        assert "length_angstrom" in bl
        assert isinstance(bl["length_angstrom"], float)
        assert bl["length_angstrom"] > 0

    def test_optimize_water_returns_bond_angles(self):
        result = self.optimizer.optimize("O")
        assert "bond_angles" in result
        assert len(result["bond_angles"]) > 0
        ba = result["bond_angles"][0]
        assert "angle_degrees" in ba
        assert isinstance(ba["angle_degrees"], float)

    def test_optimize_returns_geometry_type(self):
        result = self.optimizer.optimize("O")
        assert "geometry" in result
        assert isinstance(result["geometry"], str)
        assert result["geometry"] != ""

    def test_optimize_returns_energy(self):
        result = self.optimizer.optimize("O")
        assert "energy" in result
        assert isinstance(result["energy"], float)

    def test_optimize_methane(self):
        result = self.optimizer.optimize("C")  # methane
        assert len(result["bond_lengths"]) == 4  # 4 C-H bonds
        assert result["geometry"] == "tetrahedral"

    def test_optimize_invalid_smiles_raises(self):
        with pytest.raises(ValueError):
            self.optimizer.optimize("INVALID_XYZ")

    def test_optimize_from_formula(self):
        result = self.optimizer.optimize_from_formula("H2O")
        assert "bond_lengths" in result
        assert len(result["bond_lengths"]) > 0

    def test_optimize_from_unknown_formula_raises(self):
        with pytest.raises(ValueError):
            self.optimizer.optimize_from_formula("XyZ123")


# ---------------------------------------------------------------------------
# Electron Density Calculator unit tests
# ---------------------------------------------------------------------------


class TestElectronDensityCalculator:
    def setup_method(self):
        self.calc = ElectronDensityCalculator()

    def test_calculate_water_returns_atoms(self):
        result = self.calc.calculate("H2O")
        assert "atoms" in result
        assert len(result["atoms"]) == 3  # O + 2H
        for atom in result["atoms"]:
            assert "symbol" in atom
            assert "x" in atom
            assert "y" in atom
            assert "z" in atom
            assert "partial_charge" in atom
            assert isinstance(atom["partial_charge"], float)

    def test_charges_have_correct_signs_for_water(self):
        result = self.calc.calculate("H2O")
        o_atom = next(a for a in result["atoms"] if a["symbol"] == "O")
        h_atoms = [a for a in result["atoms"] if a["symbol"] == "H"]
        # Oxygen should be negative, hydrogens positive
        assert o_atom["partial_charge"] < 0
        for h in h_atoms:
            assert h["partial_charge"] > 0

    def test_calculate_unknown_formula_raises(self):
        with pytest.raises(ValueError):
            self.calc.calculate("XyZ123")

    def test_molecular_energy_returns_numeric(self):
        result = self.calc.get_molecular_energy("H2O")
        assert "energy" in result
        assert isinstance(result["energy"], float)
        assert "unit" in result
        assert result["unit"] == "kcal/mol"

    def test_molecular_energy_unknown_formula_raises(self):
        with pytest.raises(ValueError):
            self.calc.get_molecular_energy("XyZ123")


# ---------------------------------------------------------------------------
# API endpoint tests
# ---------------------------------------------------------------------------


class TestQuantumAPI:
    def test_optimize_endpoint(self, client):
        response = client.post("/api/quantum/optimize", json={"smiles": "O"})
        assert response.status_code == 200
        data = response.json()
        assert "bond_lengths" in data
        assert "bond_angles" in data
        assert "geometry" in data
        assert "energy" in data

    def test_optimize_invalid_smiles(self, client):
        response = client.post("/api/quantum/optimize", json={"smiles": "INVALID_XYZ"})
        assert response.status_code == 400

    def test_charges_endpoint(self, client):
        response = client.get("/api/quantum/charges/H2O")
        assert response.status_code == 200
        data = response.json()
        assert "atoms" in data
        assert len(data["atoms"]) == 3
        assert all("partial_charge" in a for a in data["atoms"])

    def test_charges_unknown_formula(self, client):
        response = client.get("/api/quantum/charges/XyZ123")
        assert response.status_code == 404

    def test_energy_endpoint(self, client):
        response = client.get("/api/quantum/energy/H2O")
        assert response.status_code == 200
        data = response.json()
        assert "energy" in data
        assert isinstance(data["energy"], (int, float))
        assert "unit" in data

    def test_energy_unknown_formula(self, client):
        response = client.get("/api/quantum/energy/XyZ123")
        assert response.status_code == 404

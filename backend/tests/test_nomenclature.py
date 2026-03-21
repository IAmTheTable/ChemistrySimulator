"""Tests for the chemical nomenclature engine."""

from app.engine.nomenclature import name_compound


# --- Elements ---

def test_name_element_sodium():
    assert name_compound("Na") == "Sodium"


def test_name_element_iron():
    assert name_compound("Fe") == "Iron"


def test_name_element_diatomic_oxygen():
    assert name_compound("O2") == "Oxygen"


def test_name_element_diatomic_hydrogen():
    assert name_compound("H2") == "Hydrogen"


def test_name_element_diatomic_nitrogen():
    assert name_compound("N2") == "Nitrogen"


# --- Binary Ionic Compounds ---

def test_name_binary_ionic_nacl():
    assert name_compound("NaCl") == "Sodium Chloride"


def test_name_binary_ionic_mgo():
    assert name_compound("MgO") == "Magnesium Oxide"


def test_name_binary_ionic_caf2():
    assert name_compound("CaF2") == "Calcium Fluoride"


def test_name_binary_ionic_al2o3():
    assert name_compound("Al2O3") == "Aluminum Oxide"


# --- Transition Metals (Roman Numerals) ---

def test_name_transition_fecl3():
    assert name_compound("FeCl3") == "Iron(III) Chloride"


def test_name_transition_fecl2():
    assert name_compound("FeCl2") == "Iron(II) Chloride"


def test_name_transition_cuo():
    assert name_compound("CuO") == "Copper(II) Oxide"


def test_name_transition_cu2o():
    assert name_compound("Cu2O") == "Copper(I) Oxide"


# --- Polyatomic Ions ---

def test_name_polyatomic_naoh():
    assert name_compound("NaOH") == "Sodium Hydroxide"


def test_name_polyatomic_caco3():
    assert name_compound("CaCO3") == "Calcium Carbonate"


def test_name_polyatomic_agno3():
    assert name_compound("AgNO3") == "Silver Nitrate"


def test_name_polyatomic_na2so4():
    assert name_compound("Na2SO4") == "Sodium Sulfate"


def test_name_polyatomic_kmno4():
    assert name_compound("KMnO4") == "Potassium Permanganate"


# --- Acids ---

def test_name_acid_hcl():
    assert name_compound("HCl") == "Hydrochloric Acid"


def test_name_acid_h2so4():
    assert name_compound("H2SO4") == "Sulfuric Acid"


def test_name_acid_hno3():
    assert name_compound("HNO3") == "Nitric Acid"


def test_name_acid_h3po4():
    assert name_compound("H3PO4") == "Phosphoric Acid"


def test_name_acid_hf():
    assert name_compound("HF") == "Hydrofluoric Acid"


def test_name_acid_acetic():
    assert name_compound("CH3COOH") == "Acetic Acid"


# --- Binary Covalent Compounds ---

def test_name_covalent_co2():
    assert name_compound("CO2") == "Carbon Dioxide"


def test_name_covalent_co():
    assert name_compound("CO") == "Carbon Monoxide"


def test_name_covalent_n2o():
    assert name_compound("N2O") == "Dinitrogen Monoxide"


def test_name_covalent_so3():
    assert name_compound("SO3") == "Sulfur Trioxide"


def test_name_covalent_pcl5():
    assert name_compound("PCl5") == "Phosphorus Pentachloride"


# --- Common Names ---

def test_name_common_water():
    assert name_compound("H2O") == "Water"


def test_name_common_ammonia():
    assert name_compound("NH3") == "Ammonia"


def test_name_common_methane():
    assert name_compound("CH4") == "Methane"


def test_name_common_ethanol():
    assert name_compound("C2H5OH") == "Ethanol"


def test_name_common_h2o2():
    assert name_compound("H2O2") == "Hydrogen Peroxide"


# --- Hydroxides/Bases ---

def test_name_base_caoh2():
    assert name_compound("Ca(OH)2") == "Calcium Hydroxide"


def test_name_base_koh():
    assert name_compound("KOH") == "Potassium Hydroxide"


# --- API Endpoint ---

def test_nomenclature_api(client):
    response = client.get("/api/nomenclature/name", params={"formula": "NaCl"})
    assert response.status_code == 200
    data = response.json()
    assert data["formula"] == "NaCl"
    assert data["name"] == "Sodium Chloride"


def test_nomenclature_api_common(client):
    response = client.get("/api/nomenclature/name", params={"formula": "H2O"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Water"


def test_nomenclature_api_missing_formula(client):
    response = client.get("/api/nomenclature/name")
    assert response.status_code == 422

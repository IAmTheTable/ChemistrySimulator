"""Tests for /api/reactions and /api/substances endpoints."""


def test_run_reaction(client):
    response = client.post("/api/reactions/run", json={
        "reactants": [
            {"formula": "Na", "amount_g": 2.3, "phase": "s"},
            {"formula": "H2O", "amount_ml": 50.0, "phase": "l"},
        ],
        "conditions": {"temperature": 25, "pressure": 1, "catalyst": None},
    })
    assert response.status_code == 200
    data = response.json()
    assert "equation" in data
    assert "effects" in data


def test_run_no_reaction(client):
    response = client.post("/api/reactions/run", json={
        "reactants": [
            {"formula": "Au", "amount_g": 1.0, "phase": "s"},
            {"formula": "H2O", "amount_ml": 50.0, "phase": "l"},
        ],
        "conditions": {"temperature": 25, "pressure": 1, "catalyst": None},
    })
    assert response.status_code == 200
    data = response.json()
    assert data["reaction_type"] == "none"


def test_get_common_substances(client):
    response = client.get("/api/substances/common")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 15
    assert any(s["formula"] == "HCl" for s in data)

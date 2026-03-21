def test_generate_structure(client):
    response = client.post("/api/structures/generate", json={"input": "O", "input_type": "smiles"})
    assert response.status_code == 200
    data = response.json()
    assert "atoms" in data
    assert "bonds" in data
    assert len(data["atoms"]) == 3


def test_get_common_structure(client):
    response = client.get("/api/structures/common/H2O")
    assert response.status_code == 200
    data = response.json()
    assert data["formula"] == "H2O"


def test_common_structure_not_found(client):
    response = client.get("/api/structures/common/XYZ999")
    assert response.status_code == 404


def test_get_orbitals(client):
    response = client.get("/api/structures/orbitals/6")
    assert response.status_code == 200
    data = response.json()
    assert data["element"] == "Carbon"
    assert len(data["orbitals"]) >= 3


def test_orbitals_not_found(client):
    response = client.get("/api/structures/orbitals/999")
    assert response.status_code == 404

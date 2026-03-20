def test_get_all_elements(client):
    response = client.get("/api/elements")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 118
    assert data[0]["symbol"] == "H"
    assert data[117]["symbol"] == "Og"


def test_get_element_by_number(client):
    response = client.get("/api/elements/6")
    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "C"
    assert data["name"] == "Carbon"
    assert data["atomic_number"] == 6


def test_get_element_not_found(client):
    response = client.get("/api/elements/999")
    assert response.status_code == 404


def test_get_element_by_symbol(client):
    response = client.get("/api/elements/search", params={"symbol": "Fe"})
    assert response.status_code == 200
    data = response.json()
    assert data["atomic_number"] == 26
    assert data["name"] == "Iron"


def test_search_element_not_found(client):
    response = client.get("/api/elements/search", params={"symbol": "Xx"})
    assert response.status_code == 404

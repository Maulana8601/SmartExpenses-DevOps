from fastapi.testclient import TestClient

import main


# Matikan koneksi database asli selama automated test.
main.database.init_db = lambda: None

client = TestClient(main.app)


def test_list_transactions():
    main.database.get_all_transactions = lambda **kwargs: [
        {
            "id": 1,
            "title": "Test Transaction",
            "amount": 50000.0,
            "type": "expense",
            "category": "Testing",
            "date": "2026-08-28",
            "notes": "Testing CI",
            "created_at": "2026-08-28T10:00:00"
        }
    ]

    response = client.get("/api/transactions")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["id"] == 1
    assert data[0]["title"] == "Test Transaction"


def test_get_transaction():
    main.database.get_transaction_by_id = lambda transaction_id: {
        "id": transaction_id,
        "title": "Belajar DevOps",
        "amount": 75000.0,
        "type": "expense",
        "category": "pendidikan",
        "date": "2026-08-28",
        "notes": "Testing GET",
        "created_at": "2026-08-28T10:00:00"
    }

    response = client.get("/api/transactions/8")

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == 8
    assert data["title"] == "Belajar DevOps"


def test_get_transaction_not_found():
    main.database.get_transaction_by_id = lambda transaction_id: None

    response = client.get("/api/transactions/999")

    assert response.status_code == 404


def test_create_transaction():
    main.database.create_transaction = lambda data: {
        "id": 100,
        "title": data["title"],
        "amount": data["amount"],
        "type": data["type"],
        "category": data["category"],
        "date": data["date"],
        "notes": data["notes"],
        "created_at": "2026-08-28T10:00:00"
    }

    response = client.post(
        "/api/transactions",
        json={
            "title": "Belajar Terraform",
            "amount": 75000,
            "type": "expense",
            "category": "pendidikan",
            "date": "2026-08-28",
            "notes": "Testing POST"
        }
    )

    assert response.status_code == 201

    data = response.json()

    assert data["id"] == 100
    assert data["title"] == "Belajar Terraform"
    assert data["amount"] == 75000.0

import mysql.connector
from typing import List, Optional, Dict, Any
from datetime import date


def get_db_connection():
    return mysql.connector.connect(
        host="mysql-container",
        port=3306,
        user="expenses_user",
        password="expenses_pass",
        database="expenses_db"
    )

def serialize_transaction(row):
    if row is None:
        return None

    row = dict(row)

    if row.get("date") is not None:
        row["date"] = row["date"].isoformat()

    if row.get("created_at") is not None:
        row["created_at"] = row["created_at"].isoformat()

    return row

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(100) NOT NULL,
            amount DECIMAL(15, 2) NOT NULL,
            type VARCHAR(20) NOT NULL,
            category VARCHAR(50) NOT NULL,
            date DATE NOT NULL,
            notes VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Check if empty to populate sample data
    cursor.execute("SELECT COUNT(*) AS count FROM transactions")
    count = cursor.fetchone()["count"]
    
    if count == 0:
        today = date.today().strftime("%Y-%m-%d")
        sample_transactions = [
            ("Gaji Utama", 8500000.0, "income", "Gaji", today, "Gaji bulanan kantor"),
            ("Proyek Freelance UI/UX", 2500000.0, "income", "Freelance", today, "DP Proyek Redesign App"),
            ("Belanja Bulanan Supermarket", 1250000.0, "expense", "Belanja", today, "Bahan makanan & kebutuhan rumah"),
            ("Tagihan Listrik & Internet", 650000.0, "expense", "Tagihan", today, "Wifi Indihome & Listrik PLN"),
            ("Makan Siang & Kopi", 75000.0, "expense", "Makanan", today, "Kafe & Resto"),
            ("Investasi Reksadana", 1000000.0, "expense", "Investasi", today, "Alokasi tabungan bulanan")
        ]
        
        cursor.executemany("""
            INSERT INTO transactions (title, amount, type, category, date, notes)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, sample_transactions)
        
    conn.commit()
    cursor.close()
    conn.close()

def get_all_transactions(
    transaction_type: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None
) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = "SELECT * FROM transactions WHERE 1=1"
    params = []
    
    if transaction_type and transaction_type != "all":
        query += " AND type = %s"
        params.append(transaction_type)
        
    if category and category != "all":
        query += " AND category = %s"
        params.append(category)
        
    if search:
        query += " AND (title LIKE %s OR notes LIKE %s OR category LIKE %s)"
        search_pattern = f"%{search}%"
        params.extend([search_pattern, search_pattern, search_pattern])
        
    query += " ORDER BY date DESC, id DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [serialize_transaction(row) for row in rows]

def get_transaction_by_id(transaction_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM transactions WHERE id = %s", (transaction_id,))
    row = cursor.fetchone()
    conn.close()
    return serialize_transaction(row)

def create_transaction(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        INSERT INTO transactions (title, amount, type, category, date, notes)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        data["title"],
        data["amount"],
        data["type"],
        data["category"],
        data["date"],
        data.get("notes")
    ))
    
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return get_transaction_by_id(new_id)

def update_transaction(transaction_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    fields = []
    params = []
    
    for key, value in data.items():
        if value is not None:
            fields.append(f"{key} = %s")
            params.append(value)
            
    if not fields:
        conn.close()
        return get_transaction_by_id(transaction_id)
        
    params.append(transaction_id)
    query = f"UPDATE transactions SET {', '.join(fields)} WHERE id = %s"
    
    cursor.execute(query, params)
    conn.commit()
    conn.close()
    
    return get_transaction_by_id(transaction_id)

def delete_transaction(transaction_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("DELETE FROM transactions WHERE id = %s", (transaction_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

def get_financial_summary() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Calculate Total Income
    cursor.execute("SELECT SUM(amount) AS total_income FROM transactions WHERE type = 'income'")
    total_income = cursor.fetchone()["total_income"] or 0.0
    
    # Calculate Total Expense
    cursor.execute("SELECT SUM(amount) AS total_expense FROM transactions WHERE type = 'expense'")
    total_expense = cursor.fetchone()["total_expense"] or 0.0
    
    # Balance
    balance = total_income - total_expense
    
    # Category Breakdown
    cursor.execute("""
        SELECT category, type, SUM(amount) as total
        FROM transactions
        GROUP BY category, type
        ORDER BY total DESC
    """)
    category_rows = cursor.fetchall()
    
    categories = [dict(row) for row in category_rows]
    
    # Total Transaction count
    cursor.execute("SELECT COUNT(*) AS total_count FROM transactions")
    total_count = cursor.fetchone()["total_count"]
    
    conn.close()
    
    return {
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "balance": round(balance, 2),
        "total_transactions": total_count,
        "categories": categories
    }

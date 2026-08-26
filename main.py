from fastapi import FastAPI, HTTPException, Query, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import List, Optional
import os

from backend.models import TransactionCreate, TransactionUpdate, TransactionResponse
from backend import database

app = FastAPI(
    title="SmartExpense - Financial & Expense Manager API",
    description="Backend API dibangun dengan Python FastAPI & SQLite",
    version="1.0.0"
)

# Initialize Database on Startup
@app.on_event("startup")
def startup_event():
    database.init_db()

# --- REST API ENDPOINTS ---

@app.get("/api/summary", tags=["Financial Summary"])
def get_summary():
    """Mendapatkan ringkasan saldo, total pemasukan, pengeluaran & statistik kategori."""
    return database.get_financial_summary()

@app.get("/api/transactions", response_model=List[TransactionResponse], tags=["Transactions"])
def list_transactions(
    type: Optional[str] = Query(None, description="Filter tipe: income / expense / all"),
    category: Optional[str] = Query(None, description="Filter kategori"),
    search: Optional[str] = Query(None, description="Pencarian berdasarkan judul/catatan")
):
    """Mendapatkan daftar seluruh transaksi dengan filter opsional."""
    return database.get_all_transactions(transaction_type=type, category=category, search=search)

@app.get("/api/transactions/{transaction_id}", response_model=TransactionResponse, tags=["Transactions"])
def get_transaction(transaction_id: int):
    """Mendapatkan detail transaksi berdasarkan ID."""
    item = database.get_transaction_by_id(transaction_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaksi tidak ditemukan")
    return item

@app.post("/api/transactions", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED, tags=["Transactions"])
def create_transaction(transaction: TransactionCreate):
    """Menambahkan transaksi baru (pemasukan / pengeluaran)."""
    data = transaction.model_dump()
    new_item = database.create_transaction(data)
    return new_item

@app.put("/api/transactions/{transaction_id}", response_model=TransactionResponse, tags=["Transactions"])
def update_transaction(transaction_id: int, transaction: TransactionUpdate):
    """Memperbarui transaksi yang sudah ada."""
    existing = database.get_transaction_by_id(transaction_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaksi tidak ditemukan")
    
    update_data = transaction.model_dump(exclude_unset=True)
    updated_item = database.update_transaction(transaction_id, update_data)
    return updated_item

@app.delete("/api/transactions/{transaction_id}", status_code=status.HTTP_200_OK, tags=["Transactions"])
def delete_transaction(transaction_id: int):
    """Menghapus transaksi berdasarkan ID."""
    success = database.delete_transaction(transaction_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaksi tidak ditemukan")
    return {"message": "Transaksi berhasil dihapus", "id": transaction_id}


# --- FRONTEND STATIC FILES ---

# Ensure static directory exists
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/", include_in_schema=False)
def serve_index():
    index_file = os.path.join(static_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Server FastAPI Berjalan. Silakan masukkan file static/index.html"}


if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("🚀 Server SmartExpense (Python Backend + Web Frontend) Aktif!")
    print("📍 Buka aplikasi di Browser: http://127.0.0.1:8000")
    print("📚 API Documentation: http://127.0.0.1:8000/docs")
    print("=" * 60)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

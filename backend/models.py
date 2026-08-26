from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"

class TransactionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="Judul transaksi")
    amount: float = Field(..., gt=0, description="Jumlah uang (harus lebih dari 0)")
    type: TransactionType = Field(..., description="Jenis transaksi: income / expense")
    category: str = Field(..., min_length=1, max_length=50, description="Kategori transaksi")
    date: str = Field(..., description="Tanggal transaksi (YYYY-MM-DD)")
    notes: Optional[str] = Field(None, max_length=255, description="Catatan tambahan")

class TransactionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    amount: Optional[float] = Field(None, gt=0)
    type: Optional[TransactionType] = None
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    date: Optional[str] = None
    notes: Optional[str] = None

class TransactionResponse(BaseModel):
    id: int
    title: str
    amount: float
    type: TransactionType
    category: str
    date: str
    notes: Optional[str] = None
    created_at: str

# SmartExpense - Full-Stack Python Financial Manager

Aplikasi Manajemen Keuangan & Pengeluaran Pribadi *full-stack* berbasis **Python (FastAPI + SQLite)** di bagian **Backend** dan **HTML5, Modern Glassmorphic Vanilla CSS, dan JavaScript (ES6)** di bagian **Frontend**.

---

## 🌟 Fitur Utama

- **Backend (Python)**:
  - Framework **FastAPI** yang sangat cepat dan mendukung asinkron secara native.
  - Basis Data **SQLite** bawaan Python (`expenses.db`), tidak memerlukan instalasi database tambahan.
  - RESTful API endpoints lengkap (`/api/transactions`, `/api/summary`) untuk operasi CRUD (Create, Read, Update, Delete).
  - Otomatisasi validasi data menggunakan **Pydantic**.
  - Dokumentasi API Swagger interaktif otomatis di `http://127.0.0.1:8000/docs`.

- **Frontend (Web UI)**:
  - Desain modern **Dark Glassmorphism UI** dengan warna aksen yang kontras dan responsif.
  - Ringkasan Saldo Bersih, Total Pemasukan, dan Total Pengeluaran secara *real-time*.
  - Indikator Rasio Pengeluaran terhadap Pemasukan (Kondisi Keuangan).
  - Pencarian kata kunci cepat (*live search*) & filter berdasarkan Tipe (Pemasukan/Pengeluaran) serta Kategori.
  - Form Modal untuk Tambah dan Edit Transaksi tanpa *page reload*.
  - Sistem notifikasi Toast untuk umpan balik aksi pengguna.

---

## 📁 Struktur Direktori

```text
appy/
├── backend/
│   ├── __init__.py        # Backend package init
│   ├── database.py        # Pengelola koneksi SQLite, inisialisasi tabel, & fungsi CRUD
│   └── models.py          # Model Pydantic untuk validasi skema input/output API
├── static/
│   ├── index.html         # Struktur UI Utama (Single Page Application)
│   ├── styles.css         # Styling Vanilla CSS (Glassmorphism Dark Theme & Animasi)
│   └── app.js             # Logika Frontend JavaScript & Integrasi REST API (Fetch)
├── main.py                # Server Utama FastAPI & Static File Server
├── requirements.txt       # Daftar dependensi Python (fastapi, uvicorn)
└── README.md              # Dokumentasi Proyek
```

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Persyaratan Sistem
Pastikan **Python 3.10+** sudah terpasang di komputer Anda.

### 2. Jalankan Server FastAPI

Cukup jalankan perintah berikut di terminal:

```bash
python3 main.py
```

Server akan otomatis menginisialisasi basis data SQLite dan berjalan di:
- **Aplikasi Web**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Dokumentasi API Swagger**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/summary` | Mendapatkan total saldo, pemasukan, pengeluaran, & rincian kategori |
| `GET` | `/api/transactions` | Mendapatkan daftar transaksi (dukungan filter `type`, `category`, `search`) |
| `GET` | `/api/transactions/{id}` | Mendapatkan detail transaksi berdasarkan ID |
| `POST` | `/api/transactions` | Menambahkan transaksi baru (pemasukan/pengeluaran) |
| `PUT` | `/api/transactions/{id}` | Memperbarui data transaksi yang sudah ada |
| `DELETE` | `/api/transactions/{id}` | Menghapus transaksi berdasarkan ID |

---

## 🛠 Tech Stack

- **Language**: Python 3.14
- **Backend Framework**: FastAPI
- **Web Server**: Uvicorn
- **Database**: SQLite3
- **Frontend Stack**: HTML5, Vanilla CSS3, Modern JavaScript (ES6 Fetch API)
- **Icons**: Lucide Icons

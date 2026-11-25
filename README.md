# Kalkulator Numerik: Metode Secant

Aplikasi web untuk menghitung pendekatan akar persamaan menggunakan metode Secant. Proyek ini dibuat untuk **Tugas Praktikum RET103 - Matematika Teknik & Statistika**.

Algoritma perhitungan dijalankan oleh Python dan Flask. Antarmuka web menyediakan tabel iterasi, grafik konvergensi, pilihan tema, serta ekspor hasil ke CSV.

## Fitur

- Menghitung akar persamaan dengan metode Secant.
- Mengubah persamaan menggunakan `x`, angka, `pi`, `e`, operator `+`, `-`, `*`, `/`, `^`, serta fungsi `sin`, `cos`, `tan`, `exp`, `log`, `sqrt`, dan `abs`.
- Melihat ringkasan hasil, tabel iterasi, dan grafik nilai pendekatan serta error.
- Mengekspor tabel iterasi ke format CSV.
- Memilih tema Sistem, Terang, atau Gelap.
- Menggunakan layout responsif untuk ponsel, tablet, dan desktop.

Persamaan awal: `f(x) = 2x^3 - x - exp(-x)`. Error konvergensi dihitung sebagai `|f(xᵢ₊₁)|`.

## Teknologi

- Python dan Flask
- HTML dan JavaScript vanilla
- Tailwind CSS CLI
- Chart.js

## Menjalankan aplikasi

### Linux atau macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python app.py
```

### Windows PowerShell

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
py app.py
```

Buka <http://127.0.0.1:5000> di browser. Hentikan server dengan `Ctrl+C` di terminal.

CSS hasil build sudah disertakan, jadi Node.js tidak diperlukan untuk menjalankan aplikasi. Untuk membangun ulang CSS setelah mengubah utility Tailwind atau token tema, pasang [Node.js](https://nodejs.org/) dan jalankan:

```bash
npm install
npm run build:css
```

> Chart.js dan font Roboto/Material Symbols dimuat dari CDN, sehingga aplikasi memerlukan koneksi internet untuk menampilkan grafik dan font tersebut.

## Struktur proyek

```text
ret103-metode-secant/
├── README.md
├── app.py
├── secant.py
├── requirements.txt
├── package.json
├── tailwind.config.js
├── static/
│   ├── css/
│   │   └── input.css
│   ├── dist/
│   │   └── app.css
│   └── js/
│       └── app.js
└── templates/
    └── index.html
```

Folder virtual environment (`.venv`), cache Python (`__pycache__`), dan folder dependency npm (`node_modules`) tidak disertakan dalam struktur utama.

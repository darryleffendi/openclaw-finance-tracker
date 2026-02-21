---
name: finance-bulk-import
description: Import multiple transactions at once from an Excel/CSV file or an image (screenshot, photo of a statement). Use this skill when the user wants to do a bulk upload, batch import, or sends a file with multiple transactions.
---

# Finance Bulk Import

## Overview

Two import modes:
- **Excel / CSV** — write or reuse a cached parser script; regenerate only if column format changed
- **Image** — read the image to extract structured data, then insert each transaction via CLI

## Paths

- Project root: `~/codespace/personal-finance-tracker/`
- CLI: `~/codespace/personal-finance-tracker/cli.py`
- Parser cache dir: `~/codespace/personal-finance-tracker/bulk_parsers/`
- Cached Excel parser: `~/codespace/personal-finance-tracker/bulk_parsers/excel_parser.py`
- Cached column signature: `~/codespace/personal-finance-tracker/bulk_parsers/excel_columns.json`

---

## Flow A: Excel / CSV File

### A1 — Ensure parser directory exists

```bash
mkdir -p ~/codespace/personal-finance-tracker/bulk_parsers
```

### A2 — Read column headers from the file

For `.xlsx` / `.xls`:
```bash
python3 -c "
import openpyxl, json
wb = openpyxl.load_workbook('FILE_PATH', read_only=True, data_only=True)
ws = wb.active
headers = [str(c.value).strip() for c in next(ws.iter_rows(min_row=1, max_row=1))]
print(json.dumps(headers))
"
```

For `.csv`:
```bash
python3 -c "
import csv, json
with open('FILE_PATH') as f:
    headers = next(csv.reader(f))
print(json.dumps(headers))
"
```

If `openpyxl` is missing:
```bash
sudo apt install -y python3-openpyxl
```

### A3 — Check for existing parser

Check if **both** of these exist:
- `bulk_parsers/excel_parser.py`
- `bulk_parsers/excel_columns.json`

If both exist, read the stored columns:
```bash
cat ~/codespace/personal-finance-tracker/bulk_parsers/excel_columns.json
```

**Compare stored columns vs current file columns (order-insensitive set comparison):**

- **Columns match exactly** → skip to A5 (reuse parser, zero tokens wasted)
- **Columns differ** → go to A4 (replace parser)
- **Files don't exist** → go to A4 (create parser)

### A4 — Write new parser (replace if outdated)

If replacing, delete old files first:
```bash
rm -f ~/codespace/personal-finance-tracker/bulk_parsers/excel_parser.py \
      ~/codespace/personal-finance-tracker/bulk_parsers/excel_columns.json
```

Then write `bulk_parsers/excel_parser.py` based on the actual columns found. The script must:
1. Accept the file path as `sys.argv[1]`
2. Read all data rows (skip header row)
3. Map columns to CLI args using the rules below
4. For each row, call `cli.py insert` via subprocess from the project root
5. Skip rows where amount is missing/empty
6. Print a summary at the end

**Column mapping rules** (case-insensitive matching):

| Maps to CLI arg | Accepted column names |
|---|---|
| `--amount` | amount, nominal, nilai, value, jumlah |
| `--type` | type, jenis, tipe |
| `--category` | category, kategori, cat |
| `--subcategory` | subcategory, subkategori, sub |
| `--note` | note, notes, keterangan, catatan, description, deskripsi |
| `--date` | date, tanggal, tgl |

**Type normalization:** map `pengeluaran/keluar/debit/out` → `expense`, `pemasukan/masuk/credit/in` → `income`

**Date normalization:** ensure output is `YYYY-MM-DD`; if no date column, omit `--date` (CLI defaults to today)

**Parser script template:**
```python
#!/usr/bin/env python3
import sys, subprocess, openpyxl  # or csv

PROJECT = "/home/ubuntu/codespace/personal-finance-tracker"
FILE = sys.argv[1]

# --- load rows ---
# (adapt for xlsx vs csv)

inserted = 0
errors = 0
for i, row in enumerate(rows, start=2):  # row number for error reporting
    try:
        amount = ...   # required
        txn_type = ... # required, normalize to income/expense
        category = ... # required
        subcategory = ...
        note = ...
        date = ...

        if not amount:
            continue

        cmd = [
            "python3", f"{PROJECT}/cli.py", "insert",
            "--amount", str(float(amount)),
            "--type", txn_type,
            "--category", category,
        ]
        if subcategory:
            cmd += ["--subcategory", subcategory]
        if note:
            cmd += ["--note", str(note)]
        if date:
            cmd += ["--date", str(date)]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            inserted += 1
        else:
            print(f"Row {i} error: {result.stderr.strip()}")
            errors += 1
    except Exception as e:
        print(f"Row {i} exception: {e}")
        errors += 1

print(f"\nDone: {inserted} inserted, {errors} errors.")
```

After writing the parser, also save the column signature:
```json
{"columns": ["col1", "col2", ...]}
```
Write this to `bulk_parsers/excel_columns.json`.

### A5 — Run the parser

```bash
cd ~/codespace/personal-finance-tracker && python3 bulk_parsers/excel_parser.py /path/to/file.xlsx
```

Report results to the user: rows inserted, any errors, and a quick balance summary using:
```bash
cd ~/codespace/personal-finance-tracker && python3 cli.py query --period this-month --summary
```

---

## Flow B: Image File

### B1 — Analyze the image

Read every visible transaction. For each one, extract:

| Field | Notes |
|---|---|
| `date` | YYYY-MM-DD; if year missing, use current year |
| `amount` | Numeric IDR value, no formatting |
| `type` | `income` or `expense` |
| `category` | Match to: food, groceries, transport, salary, freelance, bills, health, entertainment, shopping, savings, other |
| `subcategory` | Optional |
| `note` | Description/merchant name, optional |

Output the extracted list as JSON before doing anything else, so the user can verify it.

### B2 — Write and run a one-shot insert script

Write a temporary script `bulk_parsers/image_import_tmp.py` with the transactions hardcoded as a list, then run it:

```python
#!/usr/bin/env python3
import subprocess

PROJECT = "/home/ubuntu/codespace/personal-finance-tracker"

transactions = [
    # {"date": "2026-02-01", "amount": 50000, "type": "expense", "category": "food", "subcategory": "gofood", "note": "lunch"},
    # ... one dict per transaction
]

inserted = 0
for t in transactions:
    cmd = ["python3", f"{PROJECT}/cli.py", "insert",
           "--amount", str(t["amount"]),
           "--type", t["type"],
           "--category", t["category"]]
    if t.get("subcategory"):
        cmd += ["--subcategory", t["subcategory"]]
    if t.get("note"):
        cmd += ["--note", t["note"]]
    if t.get("date"):
        cmd += ["--date", t["date"]]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        inserted += 1
    else:
        print(f"Error: {result.stderr.strip()}")

print(f"Inserted {inserted}/{len(transactions)} transactions.")
```

Run it:
```bash
cd ~/codespace/personal-finance-tracker && python3 bulk_parsers/image_import_tmp.py
```

### B3 — Cleanup

Delete the one-shot script after running (images always differ, no caching):
```bash
rm ~/codespace/personal-finance-tracker/bulk_parsers/image_import_tmp.py
```

Then show a summary:
```bash
cd ~/codespace/personal-finance-tracker && python3 cli.py query --period this-month --summary
```

---

## Category Reference

| Category | Subcategories |
|---|---|
| food | dine, gofood, grabfood, snack |
| transport | gojek, grab, flazz, krl, parkir |
| bills | electricity, internet, phone, water |
| health | medicine, doctor, gym |
| entertainment | netflix, spotify, games, cinema |
| shopping | clothes, electronics, tokopedia, shopee |
| groceries, salary, freelance, savings, other | *(none)* |

## Response Format

After import, always report:
- Transactions inserted (count)
- Any failures with row info
- This-month summary (income / expense / balance)

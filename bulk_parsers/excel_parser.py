#!/usr/bin/env python3
import sys, subprocess, xlrd

PROJECT = "/home/ubuntu/codespace/personal-finance-tracker"
FILE = sys.argv[1]

# Load workbook
wb = xlrd.open_workbook(FILE)
sheet = wb.sheet_by_index(0)

# Get column indices
headers = [str(sheet.cell_value(0, col)).strip().lower() for col in range(sheet.ncols)]
date_col = headers.index('date') if 'date' in headers else None
amount_col = headers.index('idr') if 'idr' in headers else (headers.index('amount') if 'amount' in headers else None)
type_col = headers.index('income/expense') if 'income/expense' in headers else None
category_col = headers.index('category') if 'category' in headers else None
subcategory_col = headers.index('subcategory') if 'subcategory' in headers else None
note_col = headers.index('note') if 'note' in headers else (headers.index('description') if 'description' in headers else None)

inserted = 0
errors = 0

for row in range(1, sheet.nrows):
    try:
        # Get amount - required
        amount = sheet.cell_value(row, amount_col) if amount_col is not None else None
        if not amount or amount == '':
            continue
        
        # Get type - required, normalize
        txn_type_raw = str(sheet.cell_value(row, type_col)).strip().lower() if type_col is not None else ''
        if txn_type_raw in ['pengeluaran', 'keluar', 'debit', 'out', 'expense']:
            txn_type = 'expense'
        elif txn_type_raw in ['pemasukan', 'masuk', 'credit', 'in', 'income']:
            txn_type = 'income'
        else:
            print(f"Row {row+1} error: invalid type '{txn_type_raw}'")
            errors += 1
            continue
        
        # Get category - required
        category = str(sheet.cell_value(row, category_col)).strip() if category_col is not None else ''
        if not category:
            print(f"Row {row+1} error: category is required")
            errors += 1
            continue
        
        # Get optional fields
        subcategory = str(sheet.cell_value(row, subcategory_col)).strip() if subcategory_col is not None and sheet.cell_value(row, subcategory_col) else ''
        note = str(sheet.cell_value(row, note_col)).strip() if note_col is not None and sheet.cell_value(row, note_col) else ''
        
        # Get date if available
        date = None
        if date_col is not None:
            date_val = sheet.cell_value(row, date_col)
            if date_val:
                # Handle date as Excel serial number or string
                if isinstance(date_val, float):
                    from datetime import datetime, timedelta
                    base_date = datetime(1899, 12, 30)
                    date_obj = base_date + timedelta(days=date_val)
                    date = date_obj.strftime('%Y-%m-%d')
                else:
                    date = str(date_val).strip()
        
        # Build CLI command
        cmd = [
            "python3", f"{PROJECT}/cli.py", "insert",
            "--amount", str(float(amount)),
            "--type", txn_type,
            "--category", category,
        ]
        if subcategory:
            cmd += ["--subcategory", subcategory]
        if note:
            cmd += ["--note", note]
        if date:
            cmd += ["--date", date]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            inserted += 1
        else:
            print(f"Row {row+1} error: {result.stderr.strip()}")
            errors += 1
    except Exception as e:
        print(f"Row {row+1} exception: {e}")
        errors += 1

print(f"\nDone: {inserted} inserted, {errors} errors.")

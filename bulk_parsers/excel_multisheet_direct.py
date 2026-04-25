#!/usr/bin/env python3
import sys, openpyxl, sqlite3
from datetime import datetime

PROJECT = "/home/ubuntu/codespace/personal-finance-tracker"
DB_PATH = f"{PROJECT}/finance.db"
FILE = sys.argv[1]

# Category mapping
CATEGORY_MAP = {
    'salary': 'salary',
    'allowance': 'allowance',
    'recurring expenses': 'bills',
    'food': 'food',
    'transport': 'transport',
    'entertainment': 'entertainment',
    'shopping': 'shopping',
    'health': 'health',
    'other revenue': 'freelance',
    'other expenses': 'other',
    'groceries': 'groceries',
}

def map_category(account):
    account_lower = account.lower().strip()
    for key, value in CATEGORY_MAP.items():
        if key in account_lower:
            return value
    return 'other'

# Load workbook
wb = openpyxl.load_workbook(FILE, read_only=True, data_only=True)

# Connect to database
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

inserted = 0
errors = 0
skipped = 0

# Process each sheet
for sheet_name in wb.sheetnames:
    print(f"\nProcessing sheet: {sheet_name}")
    ws = wb[sheet_name]
    
    # Find Journal Entries column
    journal_col_start = None
    for col_idx, cell in enumerate(ws[2], start=1):
        if cell.value and 'journal entries' in str(cell.value).lower():
            journal_col_start = col_idx
            break
    
    if not journal_col_start:
        print(f"  No Journal Entries found, skipping")
        continue
    
    date_col = journal_col_start
    account_col = journal_col_start + 1
    debit_col = journal_col_start + 2
    credit_col = journal_col_start + 3
    description_col = journal_col_start + 4
    
    last_date = None
    
    for row_idx in range(4, ws.max_row + 1):
        try:
            date_val = ws.cell(row_idx, date_col).value
            account = ws.cell(row_idx, account_col).value
            debit = ws.cell(row_idx, debit_col).value
            credit = ws.cell(row_idx, credit_col).value
            description = ws.cell(row_idx, description_col).value
            
            if not account and not debit and not credit:
                continue
            
            if date_val:
                if isinstance(date_val, datetime):
                    last_date = date_val.strftime('%Y-%m-%d')
                else:
                    try:
                        date_obj = datetime.strptime(str(date_val).split()[0], '%Y-%m-%d')
                        last_date = date_obj.strftime('%Y-%m-%d')
                    except:
                        pass
            
            if not last_date:
                skipped += 1
                continue
            
            if account and 'cash' in str(account).lower():
                continue
            
            amount = None
            txn_type = None
            if debit and float(debit) > 0:
                amount = float(debit)
                txn_type = 'expense'
            elif credit and float(credit) > 0:
                amount = float(credit)
                txn_type = 'income'
            else:
                skipped += 1
                continue
            
            category = map_category(str(account)) if account else 'other'
            note = str(description).strip() if description else ''
            subcategory = ''
            
            # Insert into database
            cursor.execute('''
                INSERT INTO transactions (date, type, category, subcategory, amount, note)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (last_date, txn_type, category, subcategory, amount, note))
            
            inserted += 1
            
        except Exception as e:
            print(f"  Row {row_idx} error: {e}")
            errors += 1

conn.commit()
conn.close()

print(f"\n=== Summary ===")
print(f"Inserted: {inserted}")
print(f"Errors: {errors}")
print(f"Skipped: {skipped}")

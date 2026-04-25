#!/usr/bin/env python3
import sys, subprocess, openpyxl
from datetime import datetime

PROJECT = "/home/ubuntu/codespace/personal-finance-tracker"
FILE = sys.argv[1]

# Load workbook
wb = openpyxl.load_workbook(FILE, read_only=True, data_only=True)

# Category mapping from accounting accounts to personal finance categories
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
    """Map accounting account to personal finance category"""
    account_lower = account.lower().strip()
    for key, value in CATEGORY_MAP.items():
        if key in account_lower:
            return value
    return 'other'

inserted = 0
errors = 0
skipped = 0

# Process each sheet (each month)
for sheet_name in wb.sheetnames:
    print(f"\nProcessing sheet: {sheet_name}")
    ws = wb[sheet_name]
    
    # Find "Journal Entries" section - look for it in row 2
    journal_col_start = None
    for col_idx, cell in enumerate(ws[2], start=1):
        if cell.value and 'journal entries' in str(cell.value).lower():
            journal_col_start = col_idx
            break
    
    if not journal_col_start:
        print(f"  Warning: No 'Journal Entries' section found in {sheet_name}, skipping")
        continue
    
    # Headers should be in row 3 (Date, Account, Debit, Credit, Description)
    date_col = journal_col_start
    account_col = journal_col_start + 1
    debit_col = journal_col_start + 2
    credit_col = journal_col_start + 3
    description_col = journal_col_start + 4
    
    # Track last seen date for multi-line journal entries
    last_date = None
    
    # Process rows starting from row 4
    for row_idx in range(4, ws.max_row + 1):
        try:
            date_val = ws.cell(row_idx, date_col).value
            account = ws.cell(row_idx, account_col).value
            debit = ws.cell(row_idx, debit_col).value
            credit = ws.cell(row_idx, credit_col).value
            description = ws.cell(row_idx, description_col).value
            
            # Skip empty rows
            if not account and not debit and not credit:
                continue
            
            # Update last_date if this row has a date
            if date_val:
                if isinstance(date_val, datetime):
                    last_date = date_val.strftime('%Y-%m-%d')
                else:
                    try:
                        date_obj = datetime.strptime(str(date_val).split()[0], '%Y-%m-%d')
                        last_date = date_obj.strftime('%Y-%m-%d')
                    except:
                        pass
            
            # Skip if no date available yet
            if not last_date:
                skipped += 1
                continue
            
            # Skip Cash/Bank entries (these are offsetting entries)
            if account and 'cash' in str(account).lower():
                continue
            
            # Determine amount and type
            amount = None
            txn_type = None
            if debit and float(debit) > 0:
                amount = float(debit)
                txn_type = 'expense'
            elif credit and float(credit) > 0:
                amount = float(credit)
                txn_type = 'income'
            else:
                # No amount, skip
                skipped += 1
                continue
            
            # Get category from account
            if not account:
                category = 'other'
            else:
                category = map_category(str(account))
            
            # Get note from description
            note = str(description).strip() if description else ''
            
            # Build CLI command
            cmd = [
                "python3", f"{PROJECT}/cli.py", "insert",
                "--amount", str(amount),
                "--type", txn_type,
                "--category", category,
                "--date", last_date,
            ]
            if note:
                cmd += ["--note", note]
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=PROJECT)
            if result.returncode == 0:
                inserted += 1
            else:
                print(f"  Row {row_idx} error: {result.stderr.strip()}")
                errors += 1
        except Exception as e:
            print(f"  Row {row_idx} exception: {e}")
            errors += 1

print(f"\n=== Summary ===")
print(f"Inserted: {inserted}")
print(f"Errors: {errors}")
print(f"Skipped: {skipped}")

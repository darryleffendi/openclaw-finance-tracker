# Seed data — used only by db.init_db() to populate the accounts table on first run.
# After seeding, the DB is the source of truth. Do not use this file at runtime.
#
# `daily_budget_enabled` flag controls whether this account contributes to the
# "today's allowance" computation (typically true for daily-spend categories
# like food/groceries/transport; false for fixed bills, savings, and income).

ACCOUNTS = [
    {
        "slug": "salary",
        "display_name": "Salary",
        "type": "income",
        "monthly_budget": 0,
        "daily_budget_enabled": 0,
        "subcategories": [],
        "sort_order": 1,
    },
    {
        "slug": "freelance",
        "display_name": "Freelance",
        "type": "holding",
        "monthly_budget": 0,
        "daily_budget_enabled": 0,
        "subcategories": [],
        "sort_order": 2,
    },
    {
        "slug": "fixed",
        "display_name": "Fixed Obligations",
        "type": "expense",
        "monthly_budget": 3_460_000,
        "daily_budget_enabled": 0,
        "subcategories": ["rent", "electricity", "internet", "phone", "water", "gym", "subscriptions"],
        "sort_order": 3,
    },
    {
        "slug": "food",
        "display_name": "Food",
        "type": "expense",
        "monthly_budget": 2_100_000,
        "daily_budget_enabled": 1,
        "subcategories": ["dine", "gofood", "grabfood", "snack"],
        "sort_order": 4,
    },
    {
        "slug": "groceries",
        "display_name": "Groceries & Personal Care",
        "type": "expense",
        "monthly_budget": 281_000,
        "daily_budget_enabled": 1,
        "subcategories": [],
        "sort_order": 5,
    },
    {
        "slug": "transport",
        "display_name": "Transport",
        "type": "expense",
        "monthly_budget": 300_000,
        "daily_budget_enabled": 1,
        "subcategories": ["gopay", "ovo", "flazz"],
        "sort_order": 6,
    },
    {
        "slug": "wellness",
        "display_name": "Wellness & Personal",
        "type": "expense",
        "monthly_budget": 338_000,
        "daily_budget_enabled": 0,
        "subcategories": ["haircut", "medicine", "nutrition"],
        "sort_order": 7,
    },
    {
        "slug": "entertainment",
        "display_name": "Social & Entertainment",
        "type": "expense",
        "monthly_budget": 850_000,
        "daily_budget_enabled": 0,
        "subcategories": ["hobbies", "social", "shopping"],
        "sort_order": 8,
    },
    {
        "slug": "savings",
        "display_name": "Savings",
        "type": "savings",
        "monthly_budget": 0,
        "daily_budget_enabled": 0,
        "subcategories": [],
        "sort_order": 9,
    },
    {
        "slug": "investments",
        "display_name": "Investments",
        "type": "savings",
        "monthly_budget": 12_000_000,
        "daily_budget_enabled": 0,
        "subcategories": [],
        "sort_order": 10,
    },
]

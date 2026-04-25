import json

ACCOUNTS = [
    {
        "slug": "salary",
        "display_name": "Salary",
        "type": "income",
        "monthly_budget": 0,
        "subcategories": [],
        "sort_order": 1,
    },
    {
        "slug": "freelance",
        "display_name": "Freelance",
        "type": "holding",
        "monthly_budget": 0,
        "subcategories": [],
        "sort_order": 2,
    },
    {
        "slug": "fixed",
        "display_name": "Fixed Obligations",
        "type": "expense",
        "monthly_budget": 3_460_000,
        "subcategories": ["rent", "electricity", "internet", "phone", "water", "gym", "subscriptions"],
        "sort_order": 3,
    },
    {
        "slug": "food",
        "display_name": "Food & Nutrition",
        "type": "expense",
        "monthly_budget": 2_343_000,
        "subcategories": ["dine", "gofood", "grabfood", "snack", "supplements"],
        "sort_order": 4,
    },
    {
        "slug": "groceries",
        "display_name": "Groceries & Personal Care",
        "type": "expense",
        "monthly_budget": 281_000,
        "subcategories": [],
        "sort_order": 5,
    },
    {
        "slug": "transport",
        "display_name": "Transport",
        "type": "expense",
        "monthly_budget": 300_000,
        "subcategories": ["gojek", "grab", "flazz", "krl", "parkir"],
        "sort_order": 6,
    },
    {
        "slug": "wellness",
        "display_name": "Wellness & Personal",
        "type": "expense",
        "monthly_budget": 95_000,
        "subcategories": ["haircut", "medicine", "doctor"],
        "sort_order": 7,
    },
    {
        "slug": "entertainment",
        "display_name": "Social & Entertainment",
        "type": "expense",
        "monthly_budget": 850_000,
        "subcategories": ["netflix", "spotify", "games", "cinema", "clothes", "electronics", "tokopedia", "shopee"],
        "sort_order": 8,
    },
    {
        "slug": "savings",
        "display_name": "Savings / Investment",
        "type": "savings",
        "monthly_budget": 0,
        "subcategories": [],
        "sort_order": 9,
    },
]

# Flat list of valid slugs (for CLI validation)
VALID_CATEGORIES = [a["slug"] for a in ACCOUNTS]

# Map slug -> subcategories for quick lookup
SUBCATEGORY_MAP = {a["slug"]: a["subcategories"] for a in ACCOUNTS}

# Legacy alias used by some bulk parsers
CATEGORIES = [{"category": a["slug"], "subcategories": a["subcategories"]} for a in ACCOUNTS]

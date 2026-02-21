# SCHEMA

## Database Schema:

CREATE TABLE transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    date        TEXT NOT NULL,                          -- YYYY-MM-DD
    amount      REAL NOT NULL,
    type        TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    category    TEXT NOT NULL,
    subcategory TEXT,                                   -- optional, e.g. category=food, subcategory=groceries
    note        TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
);

## Constants

Have a json / py / md constants file to store categories and subcategory.
Example: 
{
  category: "food",
  subcategory: [
    "dine", "gofood"
  ]
},
{
  category: "groceries",
  subcategory: []
},
{
  category: "transport",
  subcategory: [
    "gojek", "flazz"
  ]
}

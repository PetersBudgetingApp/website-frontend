# Planned Backend Budget Contract

This frontend ships with a local budget adapter in V1 and is ready to migrate to API-backed persistence using this contract.

## Endpoints

- `GET /api/v1/budgets?month=YYYY-MM`
- `PUT /api/v1/budgets/{month}`
- `DELETE /api/v1/budgets/{month}/categories/{categoryId}`

## DTOs

### `BudgetMonthDto`

```json
{
  "month": "2026-02",
  "currency": "USD",
  "targets": [
    {
      "categoryId": 123,
      "targetAmount": 500,
      "notes": "Groceries + dining"
    }
  ]
}
```

### `BudgetTargetDto`

```json
{
  "categoryId": 123,
  "targetAmount": 500,
  "notes": "Optional"
}
```

## Behavior Rules

- Budget targets are scoped by authenticated user + month.
- Category eligibility is `EXPENSE` only.
- `targetAmount` is non-negative decimal.
- Deleting category target only removes that category entry for the requested month.

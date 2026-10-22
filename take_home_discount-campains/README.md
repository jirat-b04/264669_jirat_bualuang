# Discount Campaigns – Playtorium Take-Home Assignment

A discount module that calculates an order's final price from a cart and a list of discount campaigns. It comes with an interactive React UI and a JSON input option.

- **Stack:** React 19 + TypeScript + Vite, tested with Vitest
- **Core logic:** `src/domain` is plain TypeScript with no React dependency, so it can be reused on a server or in a CLI.

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev        # start the UI at http://localhost:5173
npm test           # run the unit tests
npm run build      # type-check and build for production
npm run lint
```

## Using the UI

The UI is laid out like a marketplace shopping cart:

1. **Products:** browse the mock catalog, filter by category or search, and click **+ Add**.
2. **Shopping Cart:** change quantities or remove items.
3. **Order Summary:** pinned on the right, next to **Place order**. It has one voucher dropdown per group (Coupon / On Top / Seasonal), so only one per group can be picked. Each dropdown lists preset vouchers from `vouchers.json` plus custom options, such as "Enter amount" or "Use my points", that let you type in the parameters. Below that it shows the subtotal, each discount with notes such as "Capped at 20%", how much you save, and the final total. Invalid parameters show an error list instead of a wrong price.

The examples from the brief are covered by the unit tests (`src/domain/__tests__/scenarios.json`).

## Using the module in code

```ts
import { calculateDiscount, DiscountValidationError } from './src/domain'

try {
  const result = calculateDiscount(cart, campaigns)
  // { subtotal, totalDiscount, finalPrice, steps: [{ label, priceBefore, discount, priceAfter, note }] }
} catch (error) {
  if (error instanceof DiscountValidationError) console.error(error.issues)
}
```

`calculateDiscount` takes `unknown` input and validates it, so raw JSON (e.g. from an API or a file) can be passed straight in.

### Campaigns

| `type`                | Group    | Parameters                      | Rule |
| --------------------- | -------- | ------------------------------- | ---- |
| `FIXED_AMOUNT`        | Coupon   | `amount` (THB, > 0)             | Subtract `amount` from the price |
| `PERCENTAGE`          | Coupon   | `percentage` (0 < p ≤ 100)      | Subtract `percentage`% of the price |
| `CATEGORY_PERCENTAGE` | On Top   | `category`, `percentage`        | Subtract `percentage`% of that category's price |
| `POINTS`              | On Top   | `points` (whole number ≥ 0)     | 1 point = 1 THB, capped at 20% of the price |
| `SEASONAL`            | Seasonal | `every` (THB > 0), `discount` (THB > 0) | Subtract `discount` for every full `every` THB |

## Project structure

```
src/
├── domain/                     # Business logic (framework-free)
│   ├── campaigns/              # One file per campaign type + registry
│   │   ├── definition.ts       # CampaignDefinition interface
│   │   ├── checks.ts           # Shared parameter validators
│   │   ├── fixedAmount.ts  percentage.ts  categoryPercentage.ts  points.ts  seasonal.ts
│   │   └── index.ts            # campaignRegistry
│   ├── calculateDiscount.ts    # Engine: validate → order → apply
│   ├── validation.ts           # Parses untrusted input into typed data
│   ├── money.ts                # THB ⇄ satang helpers, formatting
│   ├── errors.ts               # DiscountValidationError
│   ├── types.ts
│   └── __tests__/              # Vitest unit tests + scenarios.json (examples from the brief)
├── data/                       # Mock JSON data (in place of an API)
│   ├── products.json           # Product catalog
│   ├── vouchers.json           # Preset vouchers shown in the dropdowns
│   └── campaignDefaults.json   # Starting values for custom vouchers
├── hooks/useDiscountCalculator.ts   # UI state (cart, selected vouchers)
├── components/                 # Header, ProductGrid, CartList, VoucherPicker,
│                               # CampaignFields, OrderSummary
└── App.tsx
```

**Adding a new campaign** means writing one `CampaignDefinition` file (group, validate, apply), adding it to the registry and to the `Campaign` union type. The engine itself doesn't change.

## Design decisions

- **Integer money.** All arithmetic uses satang (THB × 100), so values like 2,382.50 are exact and never drift because of floating point.
- **Validation at the boundary.** Every problem in the input is collected and thrown together in one `DiscountValidationError`, instead of failing on the first one. Unknown fields are dropped.
- **Strategy + registry.** Each campaign type knows its own group, validation and calculation. The engine only handles ordering, clamping and recording steps.
- **Explainable result.** Each applied campaign returns a step with the price before and after it, which the UI shows as the price breakdown.

## Assumptions

1. **Sequential application.** Campaigns apply in the order Coupon → On Top → Seasonal, whatever order they arrive in. Each one works on the price left by the one before it.
2. **One campaign per group.** Sending two campaigns from the same group (e.g. `FIXED_AMOUNT` + `PERCENTAGE`, or `CATEGORY_PERCENTAGE` + `POINTS`) is rejected as an error. The engine never picks one silently.
3. **Category discount after a coupon.** A coupon is treated as reducing every item proportionally. So the category's share of the price is `categorySubtotal × currentPrice / subtotal` before the percentage is applied.
4. **The category campaign's "Amount" parameter is a percentage.** The brief calls it "Amount", but its example ("15% Off on Clothing") uses it as a percentage.
5. **The points cap uses the current price.** The 20% cap is taken from the price after the coupon, not the original subtotal. If the customer offers more points than the cap allows, only the capped amount is used.
6. **Seasonal counts full steps only.** `floor(price / every) × discount`, using the price after Coupon and On Top.
7. **The price never goes below 0.** Each discount is limited to the remaining price.
8. **Rounding.** Results are rounded to the nearest satang. The points cap is rounded down, so it never goes over 20%.
9. **Input rules.** A cart item needs a name, a category (`Clothing`, `Accessories` or `Electronics`), a price between 0 and 1,000,000,000 THB, and a whole-number quantity from 1 to 10,000. Quantity defaults to 1 when it's missing. Numbers sent as strings (`"350"`) are rejected rather than converted.
10. **Empty cart.** Its final price is 0; it is not an error.
11. **Out of scope.** Inventory, stock, tax and shipping, as the brief says.

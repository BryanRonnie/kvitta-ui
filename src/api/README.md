# API Layer Documentation

## Structure

```
src/
├── api/
│   ├── axios.ts              # Base HTTP client with interceptors
│   ├── user.api.ts           # User API endpoints
│   ├── receipt.api.ts        # Receipt API endpoints
│   ├── ledger.api.ts         # Ledger API endpoints
│   ├── folder.api.ts         # Folder API endpoints
│   └── index.ts              # Barrel export for clean imports
├── types/
│   ├── user.ts               # User TypeScript interfaces
│   ├── receipt.ts            # Receipt TypeScript interfaces
│   ├── ledger.ts             # Ledger TypeScript interfaces
│   └── folder.ts             # Folder TypeScript interfaces
├── hooks/
│   └── useReceiptUpdate.ts   # Receipt update with auto-retry
└── components/
    ├── UserExample.tsx       # User API example
    ├── ReceiptExample.tsx    # Receipt API example
    └── LedgerExample.tsx     # Ledger API example
```

## Architecture

### 1. **Transport Layer** (`axios.ts`)
- Single axios instance configured for your API
- Request interceptor: Automatically adds auth token from localStorage
- Response interceptor: Handles 401 responses (token expiration)
- Base URL configurable via `NEXT_PUBLIC_API_URL` env variable

### 2. **Domain Layer** (`user.api.ts`)
- Exposes clean, typed API functions
- No direct axios calls in components
- Each function has clear documentation
- Type-safe request/response handling

### 3. **Type Layer** (`types/user.ts`)
- Defines all TypeScript interfaces
- Single source of truth for data structures
- Exported types used throughout the app

## Usage

### User API

```typescript
import { createUser, getUserById, updateUser, deleteUser } from "@/api";
import { User, UserCreate } from "@/types/user";

// Create user
const newUser = await createUser({
  name: "John",
  email: "john@example.com",
  password: "secret123"
});

// Get user
const user = await getUserById("user_id");

// Update user
const updated = await updateUser("user_id", {
  name: "Updated Name"
});

// Delete user
const success = await deleteUser("user_id");
```

### Receipt API

```typescript
import {
  createReceipt,
  listReceipts,
  getReceipt,
  updateReceipt,
  addMember,
  getMembers,
  finalizeReceipt,
} from "@/api";
import { ReceiptCreate, ReceiptUpdate, ReceiptVersionConflictError } from "@/types/receipt";

// Create receipt
const receipt = await createReceipt({
  title: "Dinner",
  description: "Group dinner"
});

// List receipts
const receipts = await listReceipts();

// Get single receipt
const fetched = await getReceipt(receipt._id);

// Update (with version conflict handling)
try {
  const updated = await updateReceipt(receipt._id, {
    version: receipt.version,  // Required for optimistic locking
    title: "Updated Title"
  } as ReceiptUpdate);
} catch (err) {
  if (err instanceof ReceiptVersionConflictError) {
    // Version conflict: another client modified this receipt
    // Refetch and retry with new version
    const latest = await getReceipt(receipt._id);
    const retried = await updateReceipt(latest._id, {
      version: latest.version,
      title: "Updated Title"
    } as ReceiptUpdate);
  }
}

// Add member
await addMember(receipt._id, "user_id");

// Get members
const members = await getMembers(receipt._id);

// Finalize receipt (locks it to finalized state)
const { receipt: finalized, ledger_entries } = await finalizeReceipt(receipt._id);
```

### Ledger API

The Ledger API provides read/write access to financial settlement tracking. **All financial calculations are done server-side only.**

```typescript
import {
  getLedgerByReceipt,
  getUserBalance,
  settleLedgerEntry,
  deleteLedgerForReceipt,
} from "@/api";

// Get all ledger entries for a receipt
const entries = await getLedgerByReceipt(receipt._id);
// [
//   {
//     _id: "entry1",
//     debtor_id: "user1",
//     creditor_id: "user2",
//     amount_cents: 2500,
//     settled_amount_cents: 0,
//     status: "pending",
//     ...
//   },
//   ...
// ]

// Get aggregated user balance across all receipts
const balance = await getUserBalance(userId);
// {
//   owes_cents: 5000,      // Total user owes
//   is_owed_cents: 7500,   // Total owed to user
//   net_cents: 2500        // Positive = creditor, Negative = debtor
// }

// Settle a ledger entry (partial or full)
const settled = await settleLedgerEntry(entryId, 1000); // Pay $10
// Updated entry with settled_amount_cents increased

// Delete all entries for a receipt (when unfinalize)
const { deleted_count } = await deleteLedgerForReceipt(receipt._id);
```

### Folder API

```typescript
import {
  createFolder,
  listFolders,
  getFolder,
  updateFolder,
  deleteFolder,
} from "@/api";

// Create a folder (owner derived from auth token)
const folder = await createFolder({
  name: "Trip to Montreal",
  color: "#FF5733",
});

// List folders (owner-scoped)
const folders = await listFolders();

// Get folder by id
const fetched = await getFolder(folder._id);

// Update folder
const updated = await updateFolder(folder._id, {
  name: "Updated Name",
});

// Delete folder (soft delete)
const { success } = await deleteFolder(folder._id);
```

## Environment Variables

Add to `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production, set to your API server URL.

## Optimistic Locking (Receipt Version Conflicts)

The Receipt API uses optimistic locking to handle concurrent modifications. When multiple clients edit the same receipt simultaneously:

### Version Conflict Pattern

1. **Include `version` in updates** - The backend tracks receipt versions for conflict detection
2. **404 becomes 409 on conflict** - Backend returns 409 when your version is stale
3. **Automatic error transformation** - 409 responses throw `ReceiptVersionConflictError`
4. **Refetch and retry** - Fetch the latest receipt, then retry update with new version

### Example: Handling Version Conflicts

```typescript
const handleUpdateReceipt = async (receiptId: string, newTitle: string) => {
  try {
    // Update with current version
    return await updateReceipt(receiptId, {
      version: receipt.version,
      title: newTitle
    } as ReceiptUpdate);
  } catch (err) {
    if (err instanceof ReceiptVersionConflictError) {
      // Conflict detected - refetch and retry
      const latest = await getReceipt(receiptId);
      
      // Retry with new version
      return await updateReceipt(receiptId, {
        version: latest.version,
        title: newTitle
      } as ReceiptUpdate);
    }
    throw err;
  }
};
```

### Using the Auto-Retry Hook

```typescript
import { useReceiptUpdate } from "@/hooks/useReceiptUpdate";

function MyComponent() {
  const { updateWithRetry, loading, error } = useReceiptUpdate({
    maxRetries: 3,
    onConflict: (error) => console.log("Conflict:", error.message)
  });

  const handleUpdate = async () => {
    // Hook automatically handles refetch and retry on 409
    await updateWithRetry(
      () => updateReceipt(id, { version, title: "New" } as ReceiptUpdate),
      () => getReceipt(id)
    );
  };
}

```

## Error Handling

All API functions throw errors on failure. Handle them with try/catch:

```typescript
import { ReceiptVersionConflictError } from "@/types/receipt";

try {
  const receipt = await getReceipt(id);
} catch (error) {
  // Network error, 404, 500, etc.
  if (error instanceof ReceiptVersionConflictError) {
    // Handle version conflict specifically
    console.error("Version conflict:", error.previousVersion, "->", error.currentVersion);
  } else if (error instanceof Error) {
    console.error("API Error:", error.message);
  }
}
```

### HTTP Status Codes

| Status | Meaning | Handling |
|--------|---------|----------|
| 400 | Validation error | Check request data |
| 401 | Unauthorized | Token missing/expired, redirects to /login |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not found | Resource doesn't exist |
| 409 | Version conflict | Refetch and retry for Receipts |
| 500 | Server error | Retry or contact support |

## Authentication

Auth token is automatically read from `localStorage.access_token` and injected into all requests.

To set token after login:
```typescript
localStorage.setItem("access_token", token);
```

Token is automatically removed on 401 responses (expiration or invalid token).

## Best Practices

✅ **Do:**
- Import from `@/api` - use the barrel export
- Use types from `@/types/*`
- Handle errors with try/catch in components
- Add loading states when calling APIs
- Fetch user balance from server for dashboard UI
- Keep financial logic server-side only

❌ **Don't:**
- Import axios directly in components
- Call `api.post`/`api.get` directly
- Create duplicate API wrapper functions
- Mix API logic with component logic
- Calculate balances on frontend
- Perform financial operations without server

## Financial Architecture

### Responsibilities

**Server (FastAPI):**
- Calculate and store ledger entries
- Maintain authoritative balance state
- Enforce transaction rules
- Handle settlement logic

**Frontend (Next.js):**
- Display ledger entries
- Show aggregated balance
- Trigger settlement UI
- Never calculate financial data

### Receipt → Ledger Flow

```
Receipt.finalize()
  ↓
Backend creates LedgerEntry[]
  ↓
Frontend fetches getLedgerByReceipt()
  ↓
Frontend displays entries & settlements
  ↓
User calls settleLedgerEntry()
  ↓
Backend updates settled_amount_cents
  ↓
Frontend refetches balance via getUserBalance()
```

### User Balance Types

```typescript
interface UserBalance {
  owes_cents: number;      // Sum of amounts user is debtor on
  is_owed_cents: number;   // Sum of amounts user is creditor on
  net_cents: number;       // owes - is_owed (+ = creditor, - = debtor)
}
```

Use `net_cents` for dashboard badge/color:
- `> 0` (green): "You are owed $X"
- `< 0` (red): "You owe $X"
- `= 0` (neutral): "All settled"

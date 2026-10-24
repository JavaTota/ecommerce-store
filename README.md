# FakeStore — React + Firebase E-Commerce Demo

A portfolio e-commerce application built with **React, TypeScript, Redux Toolkit, Firebase Authentication, Cloud Firestore, and Firebase Storage**.

The project demonstrates two separate application roles:

- **Customer / general user** — searches and filters the live catalog, opens product detail pages, manages a stock-aware cart, maintains a profile, submits orders, and reviews order history.
- **Administrator** — uses a separate protected admin experience with **Dashboard**, **Inventory**, **Product Management**, and **Order Management**. Admin navigation intentionally does not expose the customer Shop or Cart.

The project started with Fake Store API data and was migrated to Firebase so the catalog, users, and orders are stored in the application's own backend services.

---

## Main Features

### Customer experience

A general user can:

- browse the storefront without administrator controls;
- search products and persist search/filter/sort/page state in the URL;
- filter by category, sort by price/name, and paginate the catalog;
- open dynamic product detail routes (`/products/:productId`);
- see live stock availability before adding a product;
- add products to the Redux-powered cart;
- increase/decrease quantities while respecting available stock;
- register with email/password;
- log in and log out;
- reset a forgotten password;
- view and update their profile and shipping address;
- delete their own account;
- submit an authenticated Firestore transaction that rechecks catalog price and stock before committing;
- view order history and order status after checkout.

### Administrator experience

The administrator uses a separate navigation and does not see the customer Shop or Cart controls. The protected admin area is split across:

```text
/admin/dashboard
/admin/inventory
/admin/products
/admin/orders
```

**Dashboard** summarizes revenue, order counts, catalog size, total stock, low-stock products, and the fulfilment pipeline.

**Inventory** allows the administrator to:

- view the full catalog;
- filter products by category;
- edit individual products, including stock quantities;
- delete individual products;
- select products;
- select all products currently visible under a category filter;
- bulk-delete selected products.

**Product Management** allows the administrator to:

- create products individually with an initial stock quantity;
- enter a product image using an HTTPS URL;
- **or upload an image from the computer**;
- preview the image before saving;
- bulk-import products from Excel or CSV files, with optional `stock` values that default to 25.

**Order Management** allows the administrator to:

- search orders by ID/customer email;
- filter by fulfilment status;
- move orders through `submitted → processing → shipped → delivered`;
- cancel orders and automatically restore their stock;
- reactivate cancelled orders only when sufficient stock is available.

The upload flow is:

```text
Local image
   ↓
Firebase Storage
   ↓
HTTPS download URL
   ↓
Firestore products/{id}.image
   ↓
Storefront
```

The browser never stores a local path such as `C:\Users\...\image.jpg` in Firestore. A local image is uploaded first and the resulting HTTPS URL is stored with the product.

---

# Role-Based Access

The application does **not** decide administrator access by hard-coding an email address in React.

Administrator status is represented by the Firebase Authentication custom claim:

```json
{
  "admin": true
}
```

The role is checked in three places:

1. **AuthContext** reads the Firebase ID token and exposes `isAdmin`.
2. **AdminRoute** prevents non-admin users from rendering protected admin pages.
3. **Firebase security rules** remain the real backend authorization layer for protected writes.

This means hiding the Admin Panel in the navbar is only a UI convenience; backend rules are responsible for preventing unauthorized writes.

---

# How to Access the Admin Panel

## 1. Create the admin user normally

Register the account through the application first so it exists in Firebase Authentication.

## 2. Download a Firebase service-account key

In Firebase Console:

```text
Project Settings
→ Service accounts
→ Generate new private key
```

Keep this JSON file private. Never put it in `src/`, commit it to GitHub, or expose it through Vite environment variables.

The repository `.gitignore` blocks common Firebase Admin service-account filenames.

## 3. Install dependencies

```bash
npm install
```

`firebase-admin` is included as a development dependency.

## 4. Point the Admin SDK at the key

### Git Bash on Windows

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/c/Users/YOUR_USER/Downloads/your-firebase-adminsdk.json"
```

Verify it:

```bash
echo $GOOGLE_APPLICATION_CREDENTIALS
ls "$GOOGLE_APPLICATION_CREDENTIALS"
```

### PowerShell

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\YOUR_USER\Downloads\your-firebase-adminsdk.json"
```

## 5. Grant the claim

```bash
npm run admin:grant -- admin@example.com
```

The script is located at:

```text
scripts/set-admin.mjs
```

It looks up the Firebase Authentication user and merges:

```json
{
  "admin": true
}
```

with any existing custom claims.

## 6. Refresh the user's Firebase token

Log out of the website and log back in.

The navbar will then display:

```text
Admin Panel
```

and the account can access:

```text
/admin/products
```

---

# Firebase Storage Setup

The Admin Panel supports local image uploads through Firebase Storage.

The application exports Storage from:

```text
src/lib/firebase/firebase.ts
```

and image upload logic is isolated in:

```text
src/services/imageService.ts
```

The repository also contains `firestore.rules`, `storage.rules`, and `firebase.json` so the authorization model is visible in the codebase.

The supplied rules are designed so that:

- product images are publicly readable;
- only authenticated users with `admin: true` may upload product images;
- files must be JPEG, PNG, or WebP;
- files must be below 5 MB.

Publish equivalent rules in Firebase Console / Firebase Storage before using uploads. Firebase Storage must also be enabled for the project; billing requirements can depend on the Firebase project configuration and current Firebase plan requirements.

If Storage is not enabled, administrators can still use the **Image URL** option.

---

# Authentication Flow

## Registration

`Register.tsx` performs the following steps:

```text
Validate form
   ↓
Firebase Authentication creates user
   ↓
Firebase displayName is updated
   ↓
Firestore users/{uid} profile is created
   ↓
Navigate to Profile
```

The Firestore profile contains:

```json
{
  "uid": "firebase-auth-uid",
  "name": "Example User",
  "email": "user@example.com",
  "createdAt": "server timestamp"
}
```

The registration code uses `serverTimestamp()` to match the Firestore security rules.

If profile creation fails after the Authentication account has been created, the registration component attempts to delete the newly created Authentication user. This avoids leaving a partially created account.

Firebase error codes are translated into human-readable messages such as:

```text
An account already exists with this email address.
```

instead of exposing raw codes such as:

```text
auth/email-already-in-use
```

## Login

`Login.tsx` uses Firebase email/password authentication and converts common Firebase errors into customer-friendly messages.

It also links to:

- registration;
- password reset.

## Password reset

`ForgotPassword.tsx` uses Firebase's password-reset email flow and is available at:

```text
/forgot-password
```

---

# Firestore Data Model

## `users`

```text
users/{uid}
├── uid
├── name
├── email
├── address        optional
└── createdAt
```

## `products`

```text
products/{productId}
├── title
├── price
├── category
├── description
├── image          HTTPS URL
└── stock          integer >= 0
```

Example:

```json
{
  "title": "Classic Backpack",
  "price": 49.99,
  "category": "accessories",
  "description": "A lightweight everyday backpack.",
  "image": "https://...",
  "stock": 25
}
```

## `orders`

```text
orders/{orderId}
├── userId
├── customerEmail
├── products[]
├── totalItems
├── totalPrice
├── status
└── createdAt
```

Order creation uses `serverTimestamp()` and a Firestore transaction. Checkout re-reads each product from Firestore, verifies the current price and stock, decrements stock, calculates totals from the persisted catalog values, and creates the order atomically. Firestore transactions retry when a read document changes concurrently, so checkout does not rely only on stale React state.

---

# Application Data Flow

## Storefront

```text
Cloud Firestore
     ↓
productService.ts
     ↓
Home.tsx ── search / category / sort / pagination
     ↓
ProductCard.tsx ──→ ProductDetail.tsx
     ↓
Redux cart
     ↓
transactional checkout
     ↓
orders + stock update
```

## Product administration

```text
AdminRoute
    ↓
Products.tsx
    ↓
URL image ───────────────┐
                         ├─→ productService → Firestore
Computer image → Storage ┘
```

## Cart

The cart is application state managed by Redux Toolkit:

```text
ProductCard
    ↓
addToCart()
    ↓
cartSlice.ts
    ↓
Cart.tsx
```

This keeps transient shopping-cart state separate from persistent Firestore data.

---

# Project Structure

```text
.
├── .github/
│   └── workflows/
│       └── main.yml               # CI + Vercel deployment
├── public/
├── scripts/
│   └── set-admin.mjs              # Grants Firebase admin custom claim
├── src/
│   ├── assets/
│   │   └── hero.png
│   ├── components/
│   │   ├── AdminRoute.tsx         # Protects administrator pages
│   │   ├── CustomerRoute.tsx      # Keeps admins out of customer routes
│   │   ├── Navbar.tsx             # Role-aware navigation
│   │   └── ProductCard.tsx        # Stock-aware customer product card
│   ├── context/
│   │   ├── AuthContext.tsx        # Auth provider + admin-claim state
│   │   ├── auth-context.ts        # Context type/default value
│   │   └── useAuth.ts             # Reusable authentication hook
│   ├── lib/
│   │   └── firebase/
│   │       └── firebase.ts        # Auth, Firestore and Storage initialization
│   ├── pages/
│   │   ├── AdminDashboard.tsx     # Operational admin metrics
│   │   ├── AdminOrders.tsx        # Admin fulfilment workflow
│   │   ├── Cart.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── Home.tsx               # Search/filter/sort/pagination
│   │   ├── Inventory.tsx          # Admin stock/edit/selection/bulk delete
│   │   ├── Login.tsx
│   │   ├── Logout.tsx
│   │   ├── Orders.tsx             # Customer order history
│   │   ├── ProductDetail.tsx      # Dynamic product route
│   │   ├── Products.tsx           # Admin creation + spreadsheet import
│   │   ├── Profile.tsx
│   │   └── Register.tsx
│   ├── redux/
│   │   ├── cartSlice.ts
│   │   └── store.ts
│   ├── services/
│   │   ├── imageService.ts        # Storage validation/upload
│   │   ├── orderService.ts        # Transactional checkout + order status
│   │   ├── productImportService.ts
│   │   ├── productService.ts
│   │   └── userService.ts
│   ├── styles/
│   │   ├── auth-styles.css
│   │   ├── dashboard.css
│   │   ├── inventory.css
│   │   ├── orders.css
│   │   ├── products.css
│   │   └── store.css
│   ├── tests/
│   │   ├── cartSlice.test.ts
│   │   └── ...
│   ├── types/
│   │   └── product.ts
│   ├── App.tsx                    # Routes
│   ├── index.css                  # Global theme/tokens
│   └── main.tsx
├── firebase.json
├── firestore.rules
├── storage.rules
├── vercel.json                    # SPA deep-link rewrite
├── package.json
└── README.md
```

---

# Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Customer / guest | Searchable, sortable, paginated storefront |
| `/products/:productId` | Customer / guest | Product detail page |
| `/cart` | Customer / guest | Stock-aware shopping cart and checkout |
| `/orders` | Authenticated customer | Customer order history |
| `/login` | Public | Login |
| `/register` | Public | Create account |
| `/forgot-password` | Public | Password reset |
| `/profile` | Authenticated user | Profile + password change |
| `/logout` | Authenticated user | Logout |
| `/admin/dashboard` | **Admin only** | Revenue/order/stock overview |
| `/admin/inventory` | **Admin only** | Filter, edit stock, select and bulk-delete inventory |
| `/admin/products` | **Admin only** | Create products, image upload, Excel/CSV import |
| `/admin/orders` | **Admin only** | Search/filter orders and update fulfilment status |

Admins who manually visit customer Shop/Cart routes are redirected to `/admin/dashboard`.

---

# Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Do not commit `.env`.

Firebase web configuration identifies the Firebase project; authorization is enforced by Authentication and Firebase security rules. Service-account private keys are different and must never be exposed to the browser.

---

# Run Locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

The GitHub Actions workflow runs tests, linting and the production build on Node 24 before deployment. Vercel uses `vercel.json` to rewrite SPA deep links to `index.html`, so refreshing routes such as `/products/:id` and `/admin/orders` continues to work.

Tests:

```bash
npm run test:run
```

---

# UI Design

The interface uses shared CSS variables for colors, surfaces, shadows and radii. The customer storefront and administrator area are intentionally visually distinct:

- the storefront uses a light hero with background artwork and a product-focused catalog;
- the Admin Panel uses a darker administration header/background;
- destructive actions such as account/product deletion use separate danger styling;
- forms use clear spacing and responsive layouts;
- product image previews make catalog changes visible before saving.

---

# Security Notes

This project treats frontend route protection as a UX layer, not as the security boundary.

Important security decisions include:

- Firebase Authentication for identity;
- custom claims for administrator roles;
- Firestore rules for database authorization;
- Storage rules for administrator-only image uploads;
- service-account keys excluded from source control;
- `.env` excluded from source control;
- no hard-coded administrator email in the React application.

---

# Possible Future Improvements

The next production-hardening step is to move authoritative checkout/inventory mutation from the browser into a trusted backend such as **Firebase Cloud Functions**. The current client transaction is concurrency-safe and validates stock/price atomically, but client-side security rules still cannot provide the same trust boundary as server code.

Other useful extensions:

- Stripe test-mode checkout + webhook-driven payment status;
- Playwright end-to-end tests for customer/admin flows;
- Firebase Emulator Suite tests for Firestore and Storage rules;
- email verification and transactional order emails;
- audit logs for administrator actions;
- automatic cleanup of unused Storage images;
- richer sales charts and date-range analytics.

## Bulk product import

Administrators can add catalog data one product at a time or import a spreadsheet from **Admin Panel → Product Management**.

Supported files:

- `.xlsx` — modern Excel workbooks
- `.xls` — legacy Excel workbooks
- `.csv` — comma-separated values

The importer reads the first worksheet and expects these product fields:

| Column | Required | Rules |
| --- | --- | --- |
| `title` | Yes | 1–150 characters |
| `price` | Yes | USD number from 0.01 to 1,000,000 with at most two decimals |
| `category` | Yes | 1–80 characters |
| `description` | Yes | 1–2,000 characters |
| `image` | Yes | HTTPS image URL |
| `stock` | No | Whole number; defaults to 25 |

Common header variants such as `name`, `product_name`, `desc`, and `image_url` are accepted. The admin UI parses the spreadsheet locally, displays a row-by-row preview, marks invalid rows, and only enables the import button when every row passes validation. A maximum of 200 products can be imported in one file.

The **Download template** button creates a starter CSV with the correct headers and an example product. Bulk-import images use URLs; individual products can still use the separate Firebase Storage image-upload workflow.

Spreadsheet parsing uses SheetJS CE 0.20.3 from the official SheetJS CDN package.

## Recent UX improvements

- Product cards support selecting a quantity from **1 to 99**, capped by current stock, before adding to the cart.
- Product cards link to dedicated dynamic product-detail pages.
- Storefront search, category filter, sorting and pagination are persisted in query parameters.
- Checkout uses a Firestore transaction to validate current price/stock and atomically decrement inventory.
- Customers can review order history and current fulfilment status.
- Admins have a dashboard plus order-management workflow; cancelling an order restores stock.
- Adding a product displays a temporary confirmation toast at the bottom of the storefront.
- Cart quantity controls also respect the 99-unit per-line limit enforced by the order rules.
- Profile includes a secure password-change form that re-authenticates the user with their current password before updating it.
- Inventory deletion uses an in-app confirmation dialog for both single and bulk deletion, followed by a visible success toast after Firestore confirms the deletion.

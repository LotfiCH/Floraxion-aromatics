# Floraxion Aromatics — E-Commerce & B2B Botanical Platform

A production-grade, bilingual (French & Arabic) e-commerce and wholesale quotation platform built for **Floraxion Aromatics**, an Algerian botanical ingredients brand within the **Plantaxion** ecosystem.

---

## 1. Overview & Baseline Catalogue

The platform implements a complete 35-SKU botanical catalogue divided strictly into:
- **28 Essential Oils** (*Huiles Essentielles* / *الزيوت الأساسية*): Pure, natural, and chemotyped extracts (Rosemary Cineole, Lavender True, Eucalyptus Globulus, Atlas Cedarwood, Immortelle Helichrysum, Frankincense, Neroli Petitgrain, Myrtle, and 20 more).
- **5 Vegetable Oils** (*Huiles Végétales* / *الزيوت النباتية*): Virgin first cold-pressed oils (Sweet Almond, Argan, Jojoba, Black Cumin Nigella Sativa, and Prickly Pear Seed).
- **2 Hydrolats** (*Hydrolats* / *مياه الأزهار والمقطرات*): Authentic single-ratio steam distillates (Damask Rose and Neroli Orange Blossom).

---

## 2. Commercial Model (Algeria Only at Launch)

- **Currency**: Algerian Dinar (**DZD**), calculated and tracked as strict integer dinar amounts without floating-point arithmetic errors.
- **Languages & Directionality**: Native **French** (`fr`, `ltr`) and **Arabic** (`ar`, `rtl`) with mirrored typographic layouts and typography using *Cormorant Garamond*, *Amiri*, *Cairo*, and *Plus Jakarta Sans*.
- **Direct Retail Orders**: Instant online ordering for available pack sizes (10 ml, 30 ml, 50 ml, 100 ml, 1 L) with dynamic inventory tracking.
- **B2B Wholesale Quotations**: Dedicated enterprise flow allowing laboratories, soap makers, and cosmetic formulators to request quotes for custom industrial pack sizes (1 kg, 5 kg, 25 kg drums, 200 L carboys).
- **Algerian Logistics & 58 Wilayas**: Built-in delivery calculation across all 58 Algerian Wilayas (Adrar to Béni Abbès), partitioned into 4 geographic shipping zones with automated free shipping above 15,000 DZD.
- **Payment Architecture**:
  - **Bank/Postal Wire (Virement BNA / CCP)**: Generates verified account details (RIB and CCP account) with mandatory order reference tracking.
  - **Cash on Delivery (Paiement à la livraison)**: Supported across eligible wilayas with exact cash preparation instructions for couriers.
  - **Online Payment Gateway**: Provider-neutral adapter with safe demonstration mode. Gated and disabled for live transactions until merchant agreements (SATIM / GIE Monétique) are configured.

---

## 3. Architecture & Codebase Structure

```text
src/
├── types/
│   └── index.ts                 # Strict TypeScript contracts for Products, Orders, Quotes, Wilayas
├── data/
│   ├── catalogue.ts             # 35-SKU botanical baseline with bilingual descriptions & specs
│   └── wilayas.ts               # Complete 58 Algerian Wilayas delivery directory
├── lib/
│   ├── commerce.ts              # Pure decoupled commerce logic, order snapshotting & quote conversion
│   ├── commerce.test.ts         # Fast-feedback unit tests running natively via node:test
│   ├── storage.ts               # Reactive client-side storage service with deterministic seeding
│   └── i18n.ts                  # Bilingual French/Arabic translation dictionary
├── components/
│   ├── layout/
│   │   ├── Header.tsx           # Top Bar Contract (Brand, single-line links, cart, language switcher)
│   │   └── Footer.tsx           # Verified business coordinates, legal links, dynamic copyright
│   ├── ui/
│   │   └── BotanicalIllustration.tsx # Studio botanical apothecary SVG illustrations
│   ├── storefront/
│   │   ├── Hero.tsx             # Editorial botanical campaign hero
│   │   ├── CategoryDiscovery.tsx# 3 discovery cards for Essential Oils, Vegetable Oils, Hydrolats
│   │   ├── ProductCard.tsx      # High-fidelity card obeying anti-pill and typographic hierarchy
│   │   ├── ProductDetail.tsx    # Complete PDP with variant picker, live stock, and specs tabs
│   │   ├── ShopView.tsx         # Catalog with search, category filters, and sorting
│   │   └── AboutAndPolicies.tsx # About Floraxion, Shipping (58 wilayas), Returns, CGV, Legal
│   ├── cart/
│   │   └── CartDrawer.tsx       # Slide-over cart with free delivery gauge and quantity steppers
│   ├── checkout/
│   │   ├── CheckoutView.tsx     # Guest checkout with 58 Wilayas dropdown and payment choice
│   │   └── OrderConfirmationView.tsx # Order confirmation with printable invoice snapshot
│   ├── quote/
│   │   └── B2BQuoteView.tsx     # Wholesale quotation request builder with multi-line items
│   └── admin/
│       └── AdminDashboard.tsx   # Back-office console (KPIs, Orders, Quotes, CSV, Shipping, Audit Log)
├── App.tsx                      # Root application controller and routing
├── main.tsx                     # Entry point
└── index.css                    # Tailwind CSS v4 design tokens and RTL overrides
```

---

## 4. Admin Back-Office Capabilities

Access the admin console via the header's **Administration** link. It includes:
1. **Multi-Role RBAC Simulation**: Switch between *Super Admin*, *Catalogue Manager*, *Order Manager*, *Sales Manager*, and *Read-only Staff*.
2. **Real Database Metrics**: Unpaid orders awaiting verification, pending quotations, and low-stock alerts.
3. **Order Fulfillment & Payment Verification**: Controlled order status transitions (`pending` → `confirmed` → `processing` → `shipped` → `delivered`) and manual payment validation logging the staff actor and timestamp.
4. **B2B Quotation Management & Conversion**: Price quotation lines, specify delivery fees, and click **"Convertir ce devis en commande ferme"** to transform accepted quotes into real orders.
5. **CSV Import / Export**: Instant download of the 35 SKUs as structured CSV, and CSV upload inspection.
6. **58 Wilayas Delivery Rate Manager**: Zone pricing and COD permission editor.
7. **Audit Trail**: Real-time logging of sensitive administrative mutations.

---

## 5. Verification & Testing

### Running Unit Tests
Execute the native Node 22 test suite:
```bash
npm run test
```
*Coverage includes: cart integer totals, Wilaya shipping calculation, order snapshot creation, quote-to-order conversion, and fulfillment transition validation.*

### Building the Project
```bash
npm run build
```

---

## 6. Pre-Launch Regulatory Checklist (Algeria)

Prior to public commercial deployment:
- [ ] **Commercial Registry & Tax Identification**: Verify SARL Floraxion Aromatics NIF, NIS, and RC with official tax certificates.
- [ ] **E-Commerce Compliance (Loi 18-05)**: Review consumer terms, order confirmations, and delivery delay clauses.
- [ ] **Personal Data Protection (Loi 18-07)**: Register customer data processing systems with the national personal data commission.
- [ ] **Payment Processing**: Complete merchant onboarding with SATIM / GIE Monétique for live CIB and Edahabia transactions before disabling test mode.
- [ ] **Carrier SLAs**: Confirm contracted rates and SLA transit times across all 4 zones with Algerian express logistics carriers.

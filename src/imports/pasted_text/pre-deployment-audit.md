# COMPLETE PRE-DEPLOYMENT AUDIT — AUDIT ONLY

Act as a **Senior Full-Stack Engineer, QA Engineer, Security Auditor, Supabase Specialist, and Production Readiness Auditor**.

I have an already-built e-commerce watch store.

### Current Stack

* Frontend: Figma Make AI generated implementation
* Backend/Database: Supabase
* Hosting/Deployment: Hostinger

The store is already designed and functional. I now want a **complete professional pre-deployment audit** before making any further changes.

## CRITICAL INSTRUCTION

**AUDIT ONLY. DO NOT MODIFY ANYTHING.**

Do NOT:

* Change code
* Change UI/UX
* Change design
* Change layout
* Change branding
* Change database
* Change Supabase settings
* Change RLS policies
* Change environment variables
* Add features
* Remove features
* Refactor code
* Rename files/components
* Install unnecessary packages
* Fix bugs

At this stage, your ONLY job is to **inspect, test, identify, and report issues**.

---

# 1. COMPLETE CODEBASE AUDIT

Inspect the entire project and identify:

* Architecture issues
* Broken components
* Broken routes
* Runtime errors
* Console errors/warnings
* Incorrect imports
* Unused/broken dependencies
* State management issues
* API/data-flow issues
* Environment configuration problems
* Build problems
* Potential production failures

---

# 2. FULL FUNCTIONAL AUDIT

Test all existing functionality, including where applicable:

* Homepage
* Navigation
* Product listing
* Product details
* Product images
* Search/filter
* Cart
* Quantity changes
* Add/remove products
* Checkout
* Customer information
* Order creation
* Order confirmation
* Notifications
* Admin panel
* Admin authentication
* Product management
* Order management
* Any other existing functionality

Identify exactly what works and what does not.

---

# 3. SUPABASE AUDIT

Inspect the complete Supabase integration.

Check:

* Database schema
* Tables
* Columns
* Relationships
* Queries
* Inserts
* Updates
* Deletes
* Authentication
* RLS policies
* Storage
* Storage policies
* Frontend ↔ Supabase data flow
* Error handling
* Schema mismatches
* Missing constraints
* Incorrect queries
* Unauthorized access possibilities

Do NOT change anything.

---

# 4. SECURITY AUDIT

Check for:

* Exposed secrets
* Service-role keys
* Unsafe environment variables
* Authentication weaknesses
* Authorization problems
* Broken admin access control
* RLS vulnerabilities
* IDOR
* XSS
* Injection risks
* Unsafe user input
* Client-side-only security
* Sensitive data exposure
* Insecure storage access
* Price/order manipulation possibilities

Classify every security finding by severity.

---

# 5. E-COMMERCE / ORDER AUDIT

Pay special attention to the complete order flow.

Verify:

Customer → Product → Cart → Checkout → Order → Database → Confirmation → Admin

Check:

* Product data
* Quantity
* Price
* Total calculation
* Customer information
* Order creation
* Duplicate orders
* Failed orders
* Cart clearing
* Order status
* Database consistency
* Price manipulation possibilities

---

# 6. RESPONSIVE & UI QA

Audit the existing UI without changing it.

Check:

* Desktop
* Laptop
* Tablet
* Mobile

Look for:

* Overflow
* Broken layouts
* Misaligned elements
* Unusable buttons
* Broken forms
* Text overflow
* Image problems
* Navigation problems
* Checkout problems

Also check common browser compatibility issues.

---

# 7. PERFORMANCE AUDIT

Check for:

* Excessive API calls
* Duplicate requests
* Slow queries
* Unnecessary re-renders
* Memory leaks
* Large assets
* Image problems
* Blocking resources
* Unnecessary dependencies
* Poor loading behavior

Do not optimize anything yet. Only report findings.

---

# 8. HOSTINGER / PRODUCTION AUDIT

Check whether the current implementation is actually ready for Hostinger production.

Inspect:

* Production build
* Environment variables
* Supabase production configuration
* API connectivity
* Routing
* SPA fallback requirements
* Asset paths
* HTTPS compatibility
* CORS issues
* Nested route refresh
* 404 handling
* Production-only errors

Again: **DO NOT CHANGE ANYTHING.**

---

# 9. ISSUE CLASSIFICATION

Classify every finding:

### CRITICAL

Security, data loss, broken checkout/order flow, or issue that can prevent production.

### HIGH

Major functionality or reliability problem.

### MEDIUM

Real bug or production concern that does not completely block the store.

### LOW

Minor issue or non-critical improvement.

Also clearly separate:

* **Actual bugs**
* **Security vulnerabilities**
* **Production risks**
* **Performance issues**
* **Configuration issues**
* **Optional improvements**

Do not report personal design preferences as bugs.

---

# 10. FINAL AUDIT REPORT

At the end, provide a professional report with:

### Overall Status

* Production Ready: YES / NO / BLOCKED
* Overall risk level

### Critical Issues

List all critical issues first.

### High Issues

### Medium Issues

### Low Issues

For every issue provide:

* Issue
* Severity
* Exact location/file/component
* Root cause
* Why it matters
* Recommended fix
* Whether it blocks deployment

### Supabase Audit

* Database
* RLS
* Authentication
* Storage
* Queries
* Security

### Store Functionality

* Products
* Cart
* Checkout
* Orders
* Notifications
* Admin
* Other existing features

### Deployment Audit

* Build
* Environment
* Hostinger
* Routing
* Production configuration

### Final Recommendation

Clearly state:

**READY FOR FIX PHASE**
or
**NOT READY — CRITICAL ISSUES FOUND**

Do NOT fix anything during this audit.

Do NOT make any changes until I explicitly provide a separate instruction to begin the fix phase.

**AUDIT ONLY. NO MODIFICATIONS.**

# Changelog

## [2.0.0] - Updated with Adobe Commerce GraphQL Schema

### 🎉 Major Updates

This update aligns the Auth0 integration with the actual Adobe Commerce GraphQL schema for production-ready implementation.

### ✨ Added

#### New Resolver Fields
- **`customer`** - Access full Commerce Customer object with profile details
- **`wishlist`** - Fetch customer's wishlist with product information
- **`addresses`** - Retrieve all customer shipping and billing addresses
- **`orders`** - Enhanced with proper pagination support (currentPage, pageSize)

#### New Query Examples
- **`fullCustomerProfile.graphql`** - Complete profile with all data sources
- **`customerOrders.graphql`** - Detailed orders with pagination variables
- **`customerWishlist.graphql`** - Wishlist with product details and pricing
- **`customerAddresses.graphql`** - All customer addresses with region info
- **`simpleUserProfile.graphql`** - Minimal query for quick authentication

#### Documentation Enhancements
- Added comprehensive **Query Examples** section in README
- Inline query examples for common use cases
- Updated all curl examples with correct field names
- Enhanced QUICKSTART with additional test queries

### 🔄 Changed

#### Type Definitions
**Before:**
```graphql
type Auth0User {
  orders: [OrderInterface]
}
```

**After:**
```graphql
type Auth0User {
  customer: Customer
  orders: CustomerOrders
  wishlist: Wishlist
  addresses: [CustomerAddress]
}
```

#### Resolver Structure
- **Orders resolver** now returns `CustomerOrders` type with pagination support
- **Added pagination parameters**: `currentPage`, `pageSize` for orders
- **Enhanced error handling** for each resolver
- **Improved null safety** for missing data

#### Query Updates
- **`userWithOrders.graphql`** - Updated to use CustomerOrders pagination
- **`protectedQuery.graphql`** - Now includes customer, wishlist, addresses, and orders
- All queries use correct Commerce field names and structure

### 📊 Schema Changes

#### Auth0User Type Fields

| Field | Type | Description |
|-------|------|-------------|
| `sub` | String! | Auth0 user ID |
| `email` | String | User email address |
| `name` | String | Full name |
| `nickname` | String | Display nickname |
| `picture` | String | Profile picture URL |
| `email_verified` | Boolean | Email verification status |
| `updated_at` | String | Last update timestamp |
| **`customer`** | Customer | **NEW**: Full Commerce customer object |
| **`orders`** | CustomerOrders | **UPDATED**: Paginated orders with items |
| **`wishlist`** | Wishlist | **NEW**: Customer wishlist |
| **`addresses`** | [CustomerAddress] | **NEW**: Shipping/billing addresses |

#### Pagination Support

Orders now support pagination:
```graphql
orders(
  currentPage: Int = 1
  pageSize: Int = 20
): CustomerOrders
```

Returns:
- `items` - Array of CustomerOrder objects
- `page_info` - Pagination metadata
- `total_count` - Total number of orders

### 🛠️ Technical Improvements

#### Resolver Enhancements
1. **Customer Resolver** - Fetches complete customer profile
2. **Orders Resolver** - Supports pagination, includes order items and totals
3. **Wishlist Resolver** - Fetches products with pricing and images
4. **Addresses Resolver** - Returns all addresses with region information

#### Error Handling
- All resolvers have try-catch blocks
- Graceful fallbacks for missing data
- Console logging for debugging
- Returns empty arrays/null instead of throwing errors

### 📝 Documentation Updates

#### README.md
- ✅ Updated query examples section
- ✅ Added 6 inline GraphQL query examples
- ✅ Updated Custom Schema Extensions section
- ✅ Fixed curl command examples
- ✅ Updated example queries list

#### QUICKSTART.md
- ✅ Added 2 new test queries (wishlist, complete profile)
- ✅ Updated existing query examples with correct syntax
- ✅ Renumbered query sections

#### ARCHITECTURE.md
- No changes required (still accurate)

### 🔍 Query Examples

#### Basic Profile
```graphql
query {
  currentUser {
    email
    name
    customer {
      firstname
      lastname
    }
  }
}
```

#### With Orders
```graphql
query {
  currentUser {
    email
    orders(currentPage: 1, pageSize: 10) {
      items {
        number
        status
        total {
          grand_total {
            value
            currency
          }
        }
      }
      total_count
    }
  }
}
```

#### With Wishlist
```graphql
query {
  currentUser {
    email
    wishlist {
      items_count
      items {
        product {
          name
          sku
          price_range {
            minimum_price {
              final_price {
                value
                currency
              }
            }
          }
        }
      }
    }
  }
}
```

### 🔐 Security

No security changes - all existing JWT validation and token management remain the same.

### 🐛 Bug Fixes

- Fixed incorrect field names in query examples
- Corrected type references to match Commerce schema
- Fixed pagination syntax in orders queries

### 📦 Dependencies

No dependency changes - still uses:
- `jsonwebtoken: ^9.0.2`
- `jwks-rsa: ^3.1.0`

### 🚀 Migration Guide

#### If you're upgrading from v1.x:

1. **Update your queries** to use the new pagination syntax:
   ```graphql
   # Old
   orders { id number }
   
   # New
   orders(currentPage: 1, pageSize: 20) {
     items { id number }
     total_count
   }
   ```

2. **Access customer data** through the new `customer` field:
   ```graphql
   # Old
   currentUser { email }
   
   # New
   currentUser {
     email  # Auth0
     customer { email firstname lastname }  # Commerce
   }
   ```

3. **Use new fields** for wishlist and addresses:
   ```graphql
   currentUser {
     wishlist { items_count }
     addresses { city country_code }
   }
   ```

### 📖 Additional Resources

- See `/queries` directory for 8 comprehensive query examples
- Check README.md for inline query patterns
- Review QUICKSTART.md for step-by-step testing

---

## [1.0.0] - Initial Release

Initial Auth0 integration with basic JWT validation and order fetching.


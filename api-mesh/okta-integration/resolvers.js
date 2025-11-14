/*
Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Create JWKS client for Okta token validation
const client = jwksClient({
  jwksUri: `https://${process.env.OKTA_DOMAIN}/oauth2/default/v1/keys`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

/**
 * Get the signing key from Okta JWKS endpoint
 */
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

/**
 * Verify and decode Okta JWT token (OAuth 2.0 / OIDC)
 */
function verifyOktaToken(token) {
  return new Promise((resolve, reject) => {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '');

    jwt.verify(
      cleanToken,
      getKey,
      {
        audience: 'api://default',
        issuer: process.env.OKTA_ISSUER || `https://${process.env.OKTA_DOMAIN}/oauth2/default`,
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      }
    );
  });
}

/**
 * Extract user ID from Okta token in request headers
 */
async function getUserFromToken(context) {
  const authHeader = context.headers.authorization || context.headers.Authorization;
  
  if (!authHeader) {
    throw new Error('No authorization header provided');
  }

  try {
    const decoded = await verifyOktaToken(authHeader);
    return decoded;
  } catch (error) {
    throw new Error(`Invalid token: ${error.message}`);
  }
}

module.exports = {
  resolvers: {
    Query: {
      /**
       * Get current authenticated user information from Okta
       */
      currentUser: {
        resolve: async (root, args, context, info) => {
          try {
            // Verify and decode the token
            const tokenData = await getUserFromToken(context);
            
            // Store user ID in context for other resolvers
            context.oktaUserId = tokenData.sub;
            context.oktaEmail = tokenData.email || tokenData.preferred_username;

            // Fetch full user profile from Okta Users API
            try {
              const userProfile = await context.OktaUsers.Query.getUsersId({
                root,
                args: { userId: tokenData.sub },
                context,
                info,
                selectionSet: `{
                  id
                  status
                  created
                  activated
                  statusChanged
                  lastLogin
                  lastUpdated
                  passwordChanged
                  profile
                }`,
              });

              return {
                id: userProfile.id || tokenData.sub,
                email: userProfile.profile?.email || tokenData.email,
                login: userProfile.profile?.login || tokenData.preferred_username,
                firstName: userProfile.profile?.firstName || tokenData.given_name,
                lastName: userProfile.profile?.lastName || tokenData.family_name,
                status: userProfile.status,
                created: userProfile.created,
                activated: userProfile.activated,
                lastLogin: userProfile.lastLogin,
              };
            } catch (mgmtError) {
              // Fallback to token data if Okta Users API call fails
              console.warn('Okta Users API call failed, using token data:', mgmtError.message);
              return {
                id: tokenData.sub,
                email: tokenData.email || tokenData.preferred_username,
                login: tokenData.preferred_username || tokenData.email,
                firstName: tokenData.given_name || '',
                lastName: tokenData.family_name || '',
                status: 'ACTIVE',
                created: null,
                activated: null,
                lastLogin: null,
              };
            }
          } catch (error) {
            throw new Error(`Authentication failed: ${error.message}`);
          }
        },
      },
    },
    OktaUser: {
      /**
       * Fetch full customer data for the authenticated user from Commerce API
       */
      customer: {
        selectionSet: '{ email }',
        resolve: async (root, args, context, info) => {
          try {
            // Query Commerce API for customer data
            const customerData = await context.CommerceAPI.Query.customer({
              root,
              args: {},
              context,
              info,
              selectionSet: `{ 
                id 
                email 
                firstname 
                lastname 
                date_of_birth 
                created_at 
                default_billing 
                default_shipping 
                gender
              }`,
            });

            return customerData || null;
          } catch (error) {
            console.error('Error fetching customer:', error.message);
            return null;
          }
        },
      },

      /**
       * Fetch orders for the authenticated user from Commerce API
       */
      orders: {
        selectionSet: '{ email }',
        resolve: async (root, args, context, info) => {
          try {
            // Query Commerce API for orders using the customer query
            const customerData = await context.CommerceAPI.Query.customer({
              root,
              args: {},
              context,
              info,
              selectionSet: `{ 
                orders(
                  currentPage: ${args.currentPage || 1}
                  pageSize: ${args.pageSize || 20}
                ) { 
                  items { 
                    id 
                    number 
                    order_date 
                    status 
                    carrier
                    email
                    total { 
                      grand_total { 
                        value 
                        currency 
                      }
                      subtotal {
                        value
                        currency
                      }
                    }
                    items {
                      product_name
                      product_sku
                      quantity_ordered
                      product_sale_price {
                        value
                        currency
                      }
                    }
                  } 
                  page_info {
                    current_page
                    page_size
                    total_pages
                  }
                  total_count
                } 
              }`,
            });

            return customerData?.orders || { items: [], total_count: 0 };
          } catch (error) {
            console.error('Error fetching orders:', error.message);
            return { items: [], total_count: 0 };
          }
        },
      },

      /**
       * Fetch wishlist for the authenticated user from Commerce API
       */
      wishlist: {
        selectionSet: '{ email }',
        resolve: async (root, args, context, info) => {
          try {
            // Query Commerce API for wishlist
            const customerData = await context.CommerceAPI.Query.customer({
              root,
              args: {},
              context,
              info,
              selectionSet: `{ 
                wishlist {
                  id
                  items_count
                  items {
                    id
                    product {
                      uid
                      name
                      sku
                      price_range {
                        minimum_price {
                          regular_price {
                            value
                            currency
                          }
                          final_price {
                            value
                            currency
                          }
                        }
                      }
                    }
                  }
                }
              }`,
            });

            return customerData?.wishlist || null;
          } catch (error) {
            console.error('Error fetching wishlist:', error.message);
            return null;
          }
        },
      },

      /**
       * Fetch addresses for the authenticated user from Commerce API
       */
      addresses: {
        selectionSet: '{ email }',
        resolve: async (root, args, context, info) => {
          try {
            // Query Commerce API for addresses
            const customerData = await context.CommerceAPI.Query.customer({
              root,
              args: {},
              context,
              info,
              selectionSet: `{ 
                addresses {
                  id
                  firstname
                  lastname
                  street
                  city
                  region {
                    region_code
                    region
                  }
                  postcode
                  country_code
                  telephone
                  default_shipping
                  default_billing
                }
              }`,
            });

            return customerData?.addresses || [];
          } catch (error) {
            console.error('Error fetching addresses:', error.message);
            return [];
          }
        },
      },
    },
  },
};


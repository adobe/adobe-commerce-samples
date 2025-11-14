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

// Create JWKS client for Auth0 token validation
const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

/**
 * Get the signing key from Auth0 JWKS endpoint
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
 * Verify and decode Auth0 JWT token
 */
function verifyAuth0Token(token) {
  return new Promise((resolve, reject) => {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '');

    jwt.verify(
      cleanToken,
      getKey,
      {
        audience: process.env.AUTH0_AUDIENCE,
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
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
 * Extract user ID from Auth0 token in request headers
 */
async function getUserFromToken(context) {
  const authHeader = context.headers.authorization || context.headers.Authorization;
  
  if (!authHeader) {
    throw new Error('No authorization header provided');
  }

  try {
    const decoded = await verifyAuth0Token(authHeader);
    return decoded;
  } catch (error) {
    throw new Error(`Invalid token: ${error.message}`);
  }
}

module.exports = {
  resolvers: {
    Query: {
      /**
       * Get current authenticated user information from Auth0
       */
      currentUser: {
        resolve: async (root, args, context, info) => {
          try {
            // Verify and decode the token
            const tokenData = await getUserFromToken(context);
            
            // Store user ID in context for other resolvers
            context.auth0UserId = tokenData.sub;

            // Extract user ID from sub (format: auth0|xxxxx or google-oauth2|xxxxx)
            const userId = tokenData.sub.split('|')[1] || tokenData.sub;

            // Fetch full user profile from Auth0 Management API
            try {
              const userProfile = await context.Auth0Management.Query.getUsersById({
                root,
                args: { id: tokenData.sub },
                context,
                info,
                selectionSet: `{
                  user_id
                  email
                  name
                  nickname
                  picture
                  email_verified
                  updated_at
                }`,
              });

              return {
                sub: tokenData.sub,
                email: userProfile.email || tokenData.email,
                name: userProfile.name || tokenData.name,
                nickname: userProfile.nickname || tokenData.nickname,
                picture: userProfile.picture || tokenData.picture,
                email_verified: userProfile.email_verified,
                updated_at: userProfile.updated_at,
              };
            } catch (mgmtError) {
              // Fallback to token data if Management API call fails
              console.warn('Auth0 Management API call failed, using token data:', mgmtError.message);
              return {
                sub: tokenData.sub,
                email: tokenData.email,
                name: tokenData.name,
                nickname: tokenData.nickname,
                picture: tokenData.picture,
                email_verified: tokenData.email_verified,
                updated_at: tokenData.updated_at,
              };
            }
          } catch (error) {
            throw new Error(`Authentication failed: ${error.message}`);
          }
        },
      },
    },
    Auth0User: {
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


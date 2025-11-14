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

// Create JWKS client for Azure AD token validation
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

/**
 * Get the signing key from Azure AD JWKS endpoint
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
 * Verify and decode Azure AD JWT token (OAuth 2.0 / OIDC)
 */
function verifyAzureADToken(token) {
  return new Promise((resolve, reject) => {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '');

    jwt.verify(
      cleanToken,
      getKey,
      {
        audience: process.env.AZURE_CLIENT_ID,
        issuer: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0`,
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
 * Extract user ID from Azure AD token in request headers
 */
async function getUserFromToken(context) {
  const authHeader = context.headers.authorization || context.headers.Authorization;
  
  if (!authHeader) {
    throw new Error('No authorization header provided');
  }

  try {
    const decoded = await verifyAzureADToken(authHeader);
    return decoded;
  } catch (error) {
    throw new Error(`Invalid token: ${error.message}`);
  }
}

module.exports = {
  resolvers: {
    Query: {
      /**
       * Get current authenticated user information from Azure AD
       */
      currentUser: {
        resolve: async (root, args, context, info) => {
          try {
            // Verify and decode the token
            const tokenData = await getUserFromToken(context);
            
            // Store user ID in context for other resolvers
            context.azureUserId = tokenData.oid || tokenData.sub;
            context.azureEmail = tokenData.email || tokenData.preferred_username || tokenData.upn;

            // Fetch full user profile from Microsoft Graph API
            try {
              const userProfile = await context.MicrosoftGraph.Query.getUsersUserId({
                root,
                args: { userId: tokenData.oid || tokenData.sub },
                context,
                info,
                selectionSet: `{
                  id
                  userPrincipalName
                  mail
                  displayName
                  givenName
                  surname
                  jobTitle
                  officeLocation
                  mobilePhone
                }`,
              });

              return {
                id: userProfile.id || tokenData.oid || tokenData.sub,
                userPrincipalName: userProfile.userPrincipalName || tokenData.preferred_username || tokenData.upn,
                mail: userProfile.mail || tokenData.email || tokenData.preferred_username,
                displayName: userProfile.displayName || tokenData.name,
                givenName: userProfile.givenName || tokenData.given_name,
                surname: userProfile.surname || tokenData.family_name,
                jobTitle: userProfile.jobTitle,
                officeLocation: userProfile.officeLocation,
                mobilePhone: userProfile.mobilePhone,
              };
            } catch (mgmtError) {
              // Fallback to token data if Graph API call fails
              console.warn('Microsoft Graph API call failed, using token data:', mgmtError.message);
              return {
                id: tokenData.oid || tokenData.sub,
                userPrincipalName: tokenData.preferred_username || tokenData.upn,
                mail: tokenData.email || tokenData.preferred_username,
                displayName: tokenData.name,
                givenName: tokenData.given_name || '',
                surname: tokenData.family_name || '',
                jobTitle: null,
                officeLocation: null,
                mobilePhone: null,
              };
            }
          } catch (error) {
            throw new Error(`Authentication failed: ${error.message}`);
          }
        },
      },
    },
    AzureADUser: {
      /**
       * Fetch full customer data for the authenticated user from Commerce API
       */
      customer: {
        selectionSet: '{ mail }',
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
        selectionSet: '{ mail }',
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
        selectionSet: '{ mail }',
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
        selectionSet: '{ mail }',
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


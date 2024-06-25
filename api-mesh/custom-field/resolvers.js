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

module.exports = {
  resolvers: {
    // Selecting the `StoreConfig` type.
    StoreConfig: {
      // Selecting the `announcement` field on the `StoreConfig` type to add a resolver.
      announcement: {
        selectionSet: "{store_code}",
        // This resolver is called when the `announcement` field is requested on the `StoreConfig` type.
        resolve: (root, args, context, info) => {
          // Call the `announcements` query from the `Announcements` source to get the latest announcement.
          return context.Announcements.Query.announcements({
            root,
            args,
            context,
            info,
            selectionSet: "{announcement}", // Selecting the `announcement` field from the response.
          })
            .then((response) => {
              // Return the announcement from the response.
              return response.announcement;
            })
            .catch(() => {
              // Return null if there is an error.
              return null;
            });
        },
      },
    },
  },
};

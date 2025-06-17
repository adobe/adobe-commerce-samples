# Adobe Commerce Admin UI SDK - Custom Menu

This application extends the Adobe Commerce Admin UI by adding a custom menu using the Admin UI SDK’s menu extension point.

## Overview

The Adobe Commerce Admin UI SDK enables App Builder developers to extend the Commerce Admin interface with custom menus and pages. Traditionally, these customizations were implemented in PHP modules, but modern Out-of-Process development practices call for a more scalable and decoupled approach.

## Features

- **Custom Menus**: Add new menu item that redirect to your App Builder application.
- **Custom Sections**: Integrate custom sections into the Commerce Admin panel.

## Prerequisites

- An Adobe Commerce instance with the IMS module installed and enabled.
- Adobe Commerce Admin UI SDK installed and enabled.
- Access to the App Builder developer console for your organization.
- An existing App Builder project.

## Installation

1. Run `npm install` to install dependencies.
2. Run `aio auth:login` to authenticate with your Adobe I/O account.
3. Run `aio app use` and select the appropriate project and workspace.
4. To enable data display in tables, update your `.env` file with the following PaaS values:
   - `COMMERCE_BASE_URL=`
   - `COMMERCE_CONSUMER_KEY=`
   - `COMMERCE_CONSUMER_SECRET=`
   - `COMMERCE_ACCESS_TOKEN=`
   - `COMMERCE_ACCESS_TOKEN_SECRET=`
5. Run `aio app build` to build the application.
6. Run `aio app deploy` to deploy the application.

## Secured Runtime Actions

The application includes a secured runtime action to access data from Commerce. It demonstrates how to retrieve the `token` and `orgId` from the `sharedContext` when they are not directly available. Note: the application will not load correctly outside of the Commerce environment, as it requires a secure connection to retrieve credentials.

## Local Testing

- Run `aio app dev` to start the local development server.
- Ensure that the `require-adobe-auth` field in your runtime actions is set to `false`, since tokens cannot be generated locally.
- To redirect to your local application, set up a server as described in the [Local Testing documentation](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/configuration/), the custom menus and pages will be accessible from the Commerce Admin panel.

## More Information

To learn more about the Admin UI SDK menu extension point, visit the [Developer docs](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/extension-points/menu/)

# Adobe Commerce Admin UI SDK - Custom Menu

This application extends the Adobe Commerce Admin UI by adding custom menus using the Adobe Commerce Admin UI SDK.

## Overview

The Adobe Commerce Admin UI SDK allows an App Builder developer to extend the Commerce Admin to include custom menus and pages. 
These Admin customizations were traditionally defined in a PHP module, but the principles of Out-of-Process development require a more modern approach.

## Features

- **Custom Menus**: Create a new menu that redirects to the App Builder app.
- **Custom Sections**: Add custom section to the Commerce Admin panel.

## Prerequisites

- Adobe Commerce instance with IMS module installed and enabled.
- Adobe Commerce Admin UI SDK installed and enabled.
- Developer console access to the organization on App Builder.
- App Builder project created.

## Installation

- Run `npm install` to install the dependencies
- Run `aio auth:login` to login to your Adobe I/O account
- Run `aio app use` (select the correct project and workspace)
- Append .env file with the following values:
  - `COMMERCE_BASE_URL=`
  - `COMMERCE_CONSUMER_KEY=`
  - `COMMERCE_CONSUMER_SECRET=`
  - `COMMERCE_ACCESS_TOKEN=`
  - `COMMERCE_ACCESS_TOKEN_SECRET=`
- Run `aio app deploy` to deploy the application

## Local testing

- Run `aio app run` to start the local development server.
- Create and run a server to redirect to your local application. Refer to the following documentation for more information: [Local Testing](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/configuration/).

## Usage

After installation and configuration, you can access the custom menus and pages from the Commerce Admin panel.

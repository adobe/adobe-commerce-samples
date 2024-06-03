# Adobe Commerce Order Grid Columns Extension Point

This application demonstrates how to customize the order grid columns in the Adobe Commerce Admin using the Admin UI SDK.

## Overview

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

## Features

- **App Grid Columns**: Add a custom column to the order grid in the Commerce Admin panel.

## Prerequisites

- Adobe Commerce instance with IMS module installed and enabled.
- Adobe Commerce Admin UI SDK installed and enabled.
- Developer console access to the organization on App Builder.
- App Builder project created.

## Installation

- Run `npm install` to install the dependencies
- Run `aio auth:login` to login to your Adobe I/O account
- Run `aio app use` (select the correct project and workspace)
- Update the `mesh.json` file with the correct base URL for the application
- Run `aio api-mesh:create mesh.json` to create the API mesh
- Update the ExtensionRegistration with the correct meshId and apiKey from the API mesh
- Run `aio app deploy` to deploy the application

## Local testing

- Run `aio app run` to start the local development server.
- Create and run a server to redirect to your local application. Refer to the following documentation for more information: [Local Testing](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/configuration/).

## Usage

After installation and configuration, you can access the custom menus and pages from the Commerce Admin panel.

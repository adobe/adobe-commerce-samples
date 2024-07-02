# Adobe Commerce Order Custom Fees Extension Point

This application demonstrates how to customize the order custom fees in the Adobe Commerce Admin using the Admin UI SDK.

## Overview

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

## Features

- **Custom Fee**: Add a custom fee to the order upon creation.

## Prerequisites

- Adobe Commerce instance with IMS module installed and enabled.
- Adobe Commerce Admin UI SDK installed and enabled.
- Developer console access to the organization on App Builder.
- App Builder project created.

## Installation

- Run `npm install` to install the dependencies
- Run `aio auth:login` to login to your Adobe I/O account
- Run `aio app use` (select the correct project and workspace)
- Run `aio app deploy` to deploy the application

## Local testing

- Run `aio app run` to start the local development server.
- Create and run a server to redirect to your local application. Refer to the following documentation for more information: [Local Testing](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/configuration/).

## Usage

After installation and configuration, you can access the custom menus and pages from the Commerce Admin panel.

# Sample Extension

The sample extension is an App Builder application that helps you start with Out-of-Process extensibility for Adobe Commerce.

## Prerequisites

- Have the Adobe AIO CLI installed.
- Have an App Builder project created in your IMS organization.

## Setup

- Run `npm install`.
- Run `aio console where` to check if the right project and workspace are selected. If not, you can run `aio console project select` and `aio console workspace select`.
- Run `aio app use` to create and populate `.env` and `.aio` files. Make sure you defined your OAuth credentials in the project first and added the I/O Management API to the workspace.
- Run `aio app build`.

## Local Dev

- `aio app run` to start your local Dev server.
- App will run on `localhost:9080` by default.

By default, the UI will be served locally but actions will be deployed and served from Adobe I/O Runtime. To start a
local serverless stack and also run your actions locally use the `aio app run --local` option.

## Test & Coverage

- Run `aio app test` to run unit tests for ui and actions.
- Run `aio app test --e2e` to run e2e tests.

## Deploy & Cleanup

- `aio app deploy` to build and deploy all actions on Runtime and static files to CDN
- `aio app undeploy` to undeploy the app

## Config

### `.env` and `.aio`

The `.env` and `.aio` files should not be committed to source control.

### `app.config.yaml`

- Main configuration file that defines an application's implementation. 
- More information on this file, application configuration, and extension configuration 
  can be found [here](https://developer.adobe.com/app-builder/docs/guides/appbuilder-configuration/#appconfigyaml)

#### Action Dependencies

- You have two options to resolve your actions' dependencies:

  1. **Packaged action file**: Add your action's dependencies to the root
   `package.json` and install them using `npm install`. Then set the `function`
   field in `app.config.yaml` to point to the **entry file** of your action
   folder. We will use `webpack` to package your code and dependencies into a
   single minified js file. The action will then be deployed as a single file.
   Use this method if you want to reduce the size of your actions.

  2. **Zipped action folder**: In the folder containing the action code add a
     `package.json` with the action's dependencies. Then set the `function`
     field in `app.config.yaml` to point to the **folder** of that action. We will
     install the required dependencies within that directory and zip the folder
     before deploying it as a zipped action. Use this method if you want to keep
     your action's dependencies separated.

## Debugging in VS Code

While running your local server (`aio app run`), both UI and actions can be debugged, to do so open the vscode debugger
and select the debugging configuration called `WebAndActions`.
Alternatively, there are also debug configs for only UI and each separate action.

## Typescript support for UI

To use typescript use `.tsx` extension for react components and add a `tsconfig.json` 
and make sure you have the below config added
```
 {
  "compilerOptions": {
      "jsx": "react"
    }
  } 
```

## Test Admin UI SDK registrations in your Commerce instance

### Local development

For your local development you can refer to the following [documentation](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/configuration/).

### Cloud instance

For your cloud instance testing, you'll have to publish your application by following this [documentation](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/publish/).

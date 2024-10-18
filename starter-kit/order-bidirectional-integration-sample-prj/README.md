# Order Bidirectional Integration Sample Project

  
* [Prerequisites](#prerequisites)
* [Starter Kit first deploy & onboarding](#starter-kit-first-deploy--onboarding)
* [Development](#development)
* [References](#references)

Sample code for a starter kit based project that demonstrates how to integrate Adobe Commerce with a mock third-party back-office system.

The project includes the following features:
- Integration of the order entity between Adobe Commerce and a mock third-party back-office system.
- Integration of an email notification system to send an email when an order is created in Adobe Commerce.

The code was used in this Integration Starter Kit for Adobe Commerce video tutorial:

```html
<iframe width="560" height="315" src="https://www.youtube.com/embed/PQvdt7DrO7I?si=u0pu_YwXeHDskH7R" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
```

The starter kit public documentation can be found at [Adobe Developer Starter Kit docs](https://developer.adobe.com/commerce/extensibility/starter-kit/)…

## Prerequisites

### Create App Builder project
Go to the [Adobe developer console](https://developer.adobe.com/console) portal
- Click on `Create a new project from template`
- Select `App Builder`
- Chose a name and title
- Select stage workspace or create a new one
- Add the following API services (select default Oauth server to server)
  - I/0 events
  - Adobe I/O Events for Adobe Commerce
  - I/O management API
- Download the [workspace configuration JSON](https://developer.adobe.com/commerce/extensibility/events/project-setup/#download-the-workspace-configuration-file) file and save it as `workspace.json` in the `./scripts/onboarding/config` starter kit folder because you will use it to configure Adobe IO Events in commerce afterward.

### Configure a new Integration in commerce
Configure a new Integration to secure the calls to Commerce from App Builder using OAuth by following these steps:
- In the Commerce Admin, navigate to System > Extensions > Integrations.
- Click the `Add New Integration` button. The following screen displays
  ![Alt text](docs/new-integration.png "New Integration")
- Give the integration a name. The rest of the fields can be left blank.
- Select API on the left and grant access to all the resources.
  ![Alt text](docs/integration-all-apis-access.png "New Integration")
- Click Save.
- In the list of integrations, activate your integration.
- To configure the starter kit, you will need the integration details (consumer key, consumer secret, access token, and access token secret).

### Install Commerce Eventing module (only required when running Adobe Commerce versions 2.4.4 or 2.4.5) 
Install Adobe I/O Events for Adobe Commerce module in your commerce instance following this [documentation](https://developer.adobe.com/commerce/extensibility/events/installation/)

> **Note**
> 
> By upgrading the Adobe I/O Events for Adobe Commerce module to version 1.6.0 or greater, you will benefit from some additional automated steps during onboarding.  

## Starter Kit first deploy & onboarding
Following the next steps, you will deploy and onboard the starter kit for the first time. The onboarding process sets up event providers and registrations based on your selection.

### Download the project
- Download and unzip the project
- Copy the env file `cp env.dist .env`
- Fill in the values following the comments on the env file.

### Configure the project
Install the npm dependencies using the command:
```bash
npm install
```

This step will connect your starter kit project to the App builder project you created earlier.
Ensure to select the proper Organization > Project > Workspace with the following commands:
```bash
aio login
aio console org select
aio console project select
aio console workspace select
```

Sync your local application with the App Builder project using the following command:
```bash
aio app use
# Choose the option 'm' (merge) 
```

### Deploy
Run the following command to deploy the project; this will deploy the runtime actions needed for the onboarding step:
```bash
aio app deploy
```
You can confirm the success of the deployment in the Adobe Developer Console by navigating to the `Runtime` section on your workspace:
![Alt text](docs/console-user-defined-actions.png "Workspace runtimes packages")

### Onboarding

#### Execute the onboarding
This step will generate the IO Events providers and the registrations for your starter kit project.
If your Commerce instance Adobe I/O Events for Adobe Commerce module version 1.6.0 or greater, the module will also be automatically configured by the onboarding script.  
To start the process run the command:
```bash
npm run onboard
```

The console will return the provider's IDs and save this information:
- You will need the commerce instance ID and provider ID to configure your commerce instance later.
- You will need the backoffice provider id to send the events to the App builder project.
  e.g., of output:
```bash
Process of On-Boarding done successfully: [
  {
    key: 'commerce',
    id: 'THIS IS THE ID OF COMMERCE PROVIDER',
    instanceId: 'THIS IS THE INSTANCE ID OF COMMERCE PROVIDER',
    label: 'Commerce Provider'
  },
  {
    key: 'backoffice',
    id: 'THIS IS THE ID OF BACKOFFICE PROVIDER',
    instanceId: 'THIS IS THE INSTANCE ID OF BACKOFFICE PROVIDER',
    label: 'Backoffice Provider'
  },
  {
    key: 'email',
    id: 'THIS IS THE ID OF EMAIL PROVIDER',
    instanceId: 'THIS IS THE INSTANCE ID OF EMAIL PROVIDER',
    label: 'Email Provider'
  }
]

```
Check your App developer console to confirm the creation of the registrations:
![Alt text](docs/console-event-registrations.png "Workspace registrations")


### Complete the Adobe Commerce eventing configuration

> **Note**
>
> If your Commerce instance Adobe I/O Events for Adobe Commerce module version is 1.6.0 or greater and the onboarding script completed successfully, the following steps are not required. The onboarding script will configure the Adobe Commerce instance automatically.
> Follow the steps in the next section to validate that the configuration is correct or skip to the next section.

You will configure your Adobe Commerce instance to send events to your App builder project using the following steps

#### Configure Adobe I/O Events in Adobe Commerce instance
To configure the provider in Commerce, do the following:
- In the Adobe Commerce Admin, navigate to Stores > Settings > Configuration > Adobe Services > Adobe I/O Events > General configuration. The following screen displays.
  ![Alt text](docs/commerce-events-configuration.webp "Commerce eventing configuration")
- Select `OAuth (Recommended)` from the `Adobe I/O Authorization Type` menu.
- Copy the contents of the `<workspace-name>.json` (Workspace configuration JSON you downloaded in the previous step [`Create app builder project`](#create-app-builder-project)) into the `Adobe I/O Workspace Configuration` field.
- Copy the commerce provider instance ID you saved in the previous step [`Execute the onboarding](#execute-the-onboarding) into the `Adobe Commerce Instance ID` field.
- Copy the commerce provider ID  you saved in the previous step [`Execute the onboarding`](#execute-the-onboarding) into the `Adobe I/O Event Provider ID` field.
- Click `Save Config`.
- Enable Commerce Eventing by setting the `Enabled` menu to Yes. (Note: You must enable cron so that Commerce can send events to the endpoint.)
- Enter the merchant's company name in the `Merchant ID` field. You must use alphanumeric and underscores only.
- In the `Environment ID` field, enter a temporary name for your workspaces while in development mode. When you are ready for production, change this value to a permanent value, such as `Production`.
- (Optional) By default, if an error occurs when Adobe Commerce attempts to send an event to Adobe I/O, Commerce retries a maximum of seven times. To change this value, uncheck the Use system value checkbox and set a new value in the Maximum retries to send events field.
- (Optional) By default, Adobe Commerce runs a cron job (clean_event_data) every 24 hours that delete event data three days old. To change the number of days to retain event data, uncheck the Use system value checkbox and set a new value in the Event retention time (in days) field.
- Click `Save Config`.

#### Subscribe to events in Adobe Commerce instance
> **Note**
>
> If your Commerce instance Adobe I/O Events for Adobe Commerce module version is 1.6.0 or greater, run the commerce-event-subscribe script to automatically subscribe to the Commerce events in `scripts/commerce-event-subscribe/config/commerce-event-subscribe.json`
> ```bash
> npm run commerce-event-subscribe
> ```
> Otherwise, follow the steps below to subscribe to the events manually.

To subscribe to events, follow this [documentation](https://developer.adobe.com/commerce/extensibility/events/configure-commerce/#subscribe-and-register-events).
For events of type 'plugin' you can also check this [documentation](https://developer.adobe.com/commerce/extensibility/events/commands/#subscribe-to-an-event).

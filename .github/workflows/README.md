# Github Actions

This repository has several self-contained example projects that need to be regularly tested when modified. While some example projects have their own `.github` directory, this mono-repo needs a varient of these workflows to work in order to account for different directory structures and other changes. This directory houses these modified versions.

## Github Actions Setup

The following are the variables required for the github actions to execute correctly

| Variable                     | Description                                                                                   | Default Value                  |
|------------------------------|-----------------------------------------------------------------------------------------------|--------------------------------|
| AIO_RUNTIME_NAMESPACE_STAGE  | The namespace for the AIO runtime environment in the staging stage, used for isolating resources and configurations. | `aio-runtime-namespace-stage`  |
| CLIENTID_STAGE               | The client identifier for the staging environment, used to authenticate API requests.         | `client-id-stage`              |
| CLIENTSECRET_STAGE           | The client secret for the staging environment, used in conjunction with the client ID to authenticate API requests. | `client-secret-stage`          |
| IMSORGID_STAGE               | The IMS organization ID for the staging environment, used to identify the organization within the IMS system. | `ims-org-id-stage`             |
| SCOPES_STAGE                 | The OAuth scopes for the staging environment, defining the permissions granted to the application. | `read:scope-stage write:scope-stage` |
| TECHNICALACCEMAIL_STAGE      | The email address associated with the technical account for the staging environment, used for notifications and account recovery. | `tech-account-email-stage@example.com` |
| TECHNICALACCID_STAGE         | The identifier for the technical account in the staging environment, used for managing the technical user and associated resources. | `tech-account-id-stage`        |

Credentials like Technical Account Email can be found by adding an I/O Action Event to the App Builder workspace and then adding an `Oauth Server-to-server` credential, this will generate most of the credentials needed above. For anything else, within the workspace click `Download All` and copy the information from the json file.

Change the ```on``` parameter to define which events can cause the workflow to run, for a list of available events, see [Events that trigger workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows).

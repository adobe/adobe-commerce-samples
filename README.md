# Adobe Commerce - Extensibility Code Samples

This project is a collection of code samples that demonstrate common extensibility use cases for Adobe Commerce. 

## Featured sample

**[Purchase Approval – B2B Approval App](purchase-approval/)** — a complete App Builder reference app implementing an end-to-end B2B purchase-approval workflow for Adobe Commerce. It combines multiple extension points in a single app:

- App Management install and business configuration
- A checkout-time approval webhook
- An order event handler that creates approval requests
- An approver dashboard SPA (React + Adobe Spectrum) via the Admin UI SDK

See [purchase-approval/README.md](purchase-approval/README.md) for setup and architecture.

## What this project is

This project is intended as a reference for developers to learn how to extend and integrate Adobe Commerce. The code is meant to showcase concepts and may not necessarily implement real-world scenarios. 

## What this project isn't

The code in the project is not meant to be construed as production-ready code and should not be used as-is in production use cases. It may not have been tested for security, performance, or other best practices.

## Prerequisites

- Access to Adobe Developer Console.
- Full access or trial access to App Builder.
- Project and workspaces has been created and correctly configured.
- AIO CLI installed to run commands.

## How to use this project

The code and comments are expected to be self-explanatory and developers can use them to learn the concepts. When deploying code from this project, ensure it is only used in development environments

## Contributing to this project

Contributions are welcomed!

- Contribute new samples: runtime actions, mesh configs, dropins, etc…
- Samples should be heavily commented describing WHAT the code does and WHY.
- Report or fix any bugs or inefficiencies.
- Participate in code reviews.

## Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.

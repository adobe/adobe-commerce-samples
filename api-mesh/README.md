# API Mesh Samples

Welcome to the API Mesh samples repository! This repository contains a collection of samples demonstrating how to effectively use Adobe API Mesh to integrate and manage multiple APIs in a unified and secure manner.

## Overview

API Mesh allows you to simplify the integration of multiple APIs by providing a unified endpoint for your clients. This makes it easier to manage, secure, and scale your API integrations.

In this repository, you'll find various samples demonstrating how to set up and use API Mesh for different scenarios. Whether you're new to API Mesh or looking to expand your knowledge, these examples will help you get started and improve your skills.

## Samples

This repository includes the following examples:

### Authentication & Security
- **[auth0-integration](./auth0-integration/)** - Complete Auth0 authentication integration with API Mesh featuring JWT validation, user profile management, and seamless Commerce data integration (orders, wishlist, addresses)

### API Integration
- **[commerce-rest-and-graphql](./commerce-rest-and-graphql/)** - Combine Adobe Commerce REST and GraphQL APIs
- **[commerce-and-catalog](./commerce-and-catalog/)** - Integrate Commerce with catalog services
- **[adobe-io-events-integration](./adobe-io-events-integration/)** - Connect Adobe I/O Events with API Mesh

### Advanced Features
- **[custom-field](./custom-field/)** - Add custom fields and resolvers to extend your API
- **[chain-mutations](./chain-mutations/)** - Chain multiple GraphQL mutations together
- **[mock-response](./mock-response/)** - Create mock responses for testing
- **[response-caching](./response-caching/)** - Configure response caching for better performance

## Prerequisites

Before you begin, ensure you have the following:

- An Adobe Developer account
- Access to Adobe API Mesh
- Node.js and npm installed on your local machine (nvm 18.x.x (Mac/Linux) or nvm-windows (Windows))
- Basic knowledge of RESTful APIs and GraphQL

## Installation

To get started with the examples, follow these steps:

1. Clone this repository:

   git clone [adobe-commerce-samples](https://github.com/adobe/adobe-commerce-samples.git)

2. Navigate to the cloned directory:

   cd api-mesh-examples

3. Navigate to the example you are interested in

   cd mock-response

4. [Provision](https://developer.adobe.com/graphql-mesh-gateway/gateway/getting-started/) an API Mesh using the create or update command.


---
title: HTTP Request
sidebar_position: 22
---

The **HTTP Request** node is a key component in the XpertAI platform's agent workflow, enabling flexible external API calls within agent processes to facilitate data interaction, automated triggers, and complex system integrations.

## 📌 Feature Overview

The HTTP Request node supports initiating standard web requests (e.g., GET, POST) in workflows, allowing seamless integration with any service supporting the HTTP protocol. Whether fetching data, submitting forms, or triggering third-party system commands, this node handles it effortlessly.

## 🔧 Configuration Details

After dragging an HTTP Request node into the workflow, you can configure it in the right panel as follows:

### 1. Request Method and URL (API)
- **Method Type**: Supports common HTTP methods like `GET`, `POST`, `PUT`, `DELETE`, etc.
- **Request URL**: Enter the full API address, e.g., `https://api.example.com/data`.

### 2. Headers
Add multiple header key-value pairs to pass information like authentication tokens or content types.
- **Name**: Header name, e.g., `Authorization`.
- **Value**: Header value, e.g., `Bearer {{access_token}}`.

### 3. Params (Query Parameters)
Set URL parameters, ideal for GET requests or appending query strings.
- **Key**: Parameter name.
- **Value**: Parameter value (supports dynamic variables).

### 4. Body (Request Body)
Used for requests like POST or PUT that include a body.
- Supported formats:
  - `x-www-form-urlencoded`
  - `JSON`
  - `RAW`
- Enter specific fields or bind variables for dynamic data.

### 5. Timeout Settings
Fine-tune settings for network conditions or slow API responses:
- **Connection Timeout**: Time limit for establishing a connection (seconds).
- **Read Timeout**: Time limit for reading data (seconds).
- **Write Timeout**: Time limit for sending data (seconds).

### 6. Output Variables

The HTTP Request node outputs three default session variables:
- `body`: Response body.
- `status_code`: Response status code.
- `headers`: Response headers.

### 7. Error Handling

Refer to [Error Handling](/docs/ai/workflow/error-handling/).

## ✅ Usage Example

For instance, to automatically call a weather API in a node, configure as follows:

- Method: GET  
- URL: https://api.weatherapi.com/v1/current.json  
- Params:  
  - `key`: `{{weather_api_key}}`  
  - `q`: `{{user_location}}`  
- No request body required  
- Timeout: Use default or customize as needed  

## 🚀 Use Cases

- Call internal enterprise systems or third-party APIs.
- Enable data synchronization or notification pushes.
- Integrate with tools like CRM, ERP, WeChat Work, or Slack.
- Expand agent capabilities for more powerful automation logic.
---
title: Self-Built Application Configuration
sidebar_position: 1
---

Customers can seamlessly showcase ChatBI's capabilities to users through the **bot** in **Feishu's Enterprise Self-Built Applications**, enabling **real-time data** analysis in conversational BI. Within the Feishu client, users can directly interact with ChatBI using natural language to query and analyze data from SAP systems or data warehouses. Users can easily perform **collaborative** data queries and business analysis within the familiar Feishu environment without switching applications, significantly improving work efficiency and decision-making speed.

## Enterprise Self-Built Applications

**Feishu Enterprise Self-Built Applications** refer to applications developed and deployed by enterprises using the open interfaces and development tools provided by the Feishu platform. These applications can be customized to meet specific business processes, team collaboration, information management, and other internal needs of the enterprise.

To access the developer backend of the Feishu Open Platform:
https://open.feishu.cn/app

Click on **Create Enterprise Self-Built Application**, enter the application name and information to create it successfully, then add the **bot** capability in **Add Application Capability**, and navigate to the bot configuration page:

## Bot Settings

Input basic information such as “How to get started.” Click to go to **Events and Callbacks** to add the “Card Callback Interaction” callback for the card.

### Event Configuration

To receive message events sent by Feishu, you first need to configure the event request address:

`<Your server>/api/lark/webhook/<id>`

![Webhook](/public/img/chatbi/webhook.png)

- Refer to the “Callback Address” attribute in [System Integration - Feishu Integration Configuration](/docs/server/organization/integration).

Add events and enable the corresponding permissions:

- `im.message.receive_v1` Receive messages v2.0
- `application.bot.menu_v6` Custom bot menu events v2.0

### Callback Configuration

Request address (same as the event configuration request address):
`<Your server>/api/lark/webhook/<id>`

Subscribed callbacks:

- `card.action.trigger` Card Callback Interaction

### Permission Management

The following permissions need to be enabled for this self-built application:

- `im:message:send_as_bot`
- `contact:contact.base:readonly`
- `contact:user.email:readonly`
- `contact:user.phone:readonly`
- `contact:user.employee_id:readonly`

### Custom Bot Menu

If you want to configure a model switching function in the custom bot menu, add the menu according to the following rule:

`select_model:e7dc6846-c893-411a-90a2-0885a45fd5f1`

Replace the uuid with the corresponding dialog model's id.

## System Settings

### Environment Configuration

When installing and deploying the system, configure the role name, which is the role initially assigned to the user created automatically by Feishu.

```ini title="File .env"
LARK_ROLE_NAME=VIEWER
```

### Data Source

Taking the SAP system as an example, create a data source that connects to the S/4HANA system.

![SAP S/4HANA Data Source](/public/img/chatbi/sap-s4hana-data-source.png)

### Semantic Model

By connecting the data source of the S/4HANA system, create a semantic model for the cubes or individual queries in the SAP system, and interface it to ChatBI after semantic enhancement.

![SAP S/4HANA Semantic Model](/public/img/chatbi/sap-s4hana-semantic-model.png)

![SAP S/4HANA Cube](/public/img/chatbi/sap-cube-semantic-enhance.png)

### Configure Model for ChatBI Bot

Configure the enhanced SAP Cube semantic model or the self-developed data warehouse semantic model into the ChatBI service so that the Feishu bot can view and analyze it.

Refer to [Dialog Models](../models/).

References:
- https://open.feishu.cn/document/home/qr-code-scanning-login-for-web-app/introduction
---
title: Chat Models
sidebar_position: 2
---

In the Meta Analytics platform, the configured list of data models plays a crucial role in limiting the conversational capabilities of the Feishu bot. The ChatBI data models that the Feishu bot can access and use are restricted to specific models within this list. 

Through this configuration, enterprises can precisely control the range of data that the Feishu bot can access during conversations, ensuring that only authorized and relevant models are available. 

This mechanism enables users to conduct real-time analysis on specific data models related to the core business of the enterprise while using the Feishu client for data conversations, without concerns about data leakage or misuse. Additionally, administrators can dynamically adjust this model list based on business needs, thereby managing and optimizing the data analysis process flexibly. This configuration enhances data security and compliance while also improving user efficiency and the accuracy of data interactions.

To configure the bot cha y models in the ChatBI page of the system settings:

![ChatBI Models](/public/img/chatbi/chatbi-model-list.png)

## Adding a New Data Model

To add a new data model, select a semantic model and then choose a data entity (such as a dataset or cube) within the semantic model. Provide a short label, which will be displayed as the name of this data model to users. In the long description, include some explanatory information about the model (relatively flexible, this will be provided as reference information to the AI), such as suggestions for core questions that users might be concerned about. The AI will use this as a reference to provide example questions for users.

![ChatBI Model](/public/img/chatbi/chatbi-models.png)
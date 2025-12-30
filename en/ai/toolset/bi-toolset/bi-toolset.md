---
title: BI Toolsets
sidebar_position: 2
---

The Xpert Data Analytics Toolset provides a suite of tools for business intelligence analysis, seamlessly integrated with the Xpert Data Analytics Platform.

## How to Configure the Model for Analysis?

To analyze models on the data analytics platform using the ChatBI Toolset, authorize the relevant model(s) for the toolset. As shown below, select the model to analyze in the Chat Models attribute, in addition to name and description attributes, then save the authorization to enable three tools and save.

![ChatBI Toolset authorization](/public/img/ai/builtin-tool-chatbi-auth.png)

## Why Are There No Chat Models Available?

The Chat Models list must be created in the Chat BI system configuration page of the Xpert Data Analytics Platform. Select a semantic model and one of its model entities, provide the entity description and details, then create successfully.

![ChatBI Toolset authorization](/public/img/ai/chatbi-model.png)

For detailed information on semantic models, see [Semantic Models](/docs/models/).

## How to Use the ChatBI Toolset?

In Xpert Studio, when orchestrating an agent, right-click to add the toolset, locate the authorized ChatBI Toolset, and add it to the Studio panel. Connect the agent node to the toolset node, enabling the agent to use the ChatBI Toolset to answer data analysis-related questions.

![ChatBI Toolset use](/public/img/ai/chatbi-toolset-usein-xpert.png)

## Final Usage

In the final user conversation interface, Xpert expert users can ask analysis questions related to the data model. Xpert will query model information as needed and provide answers using graphical components.

![ChatBI Toolset use in chat](/public/img/ai/chatbi-toolset-in-chat-xpert.png)

## ChatDB Toolset

The ChatDB Toolset includes tools for direct database interaction, converting natural language into SQL to query the database for answers. The usage process is similar to ChatBI.
---

title: "🤖 AI Copilot"  
sidebar_position: 6  
tags:
  - AI
  - Copilot
---

🤖 **AI Copilot** is an AI-powered tool within the Xpert Analytics Cloud product, designed to provide support for system data analysis through large model interfaces and custom command functionality.

There are two ways to interact with the AI Copilot:

- Free conversation mode: Users can freely input text, and the AI assistant will respond based on the user's input.
- Command mode: Users can input specific commands, and the AI assistant will call the corresponding functions based on the commands and input to execute logic.

Currently, the AI Copilot supports two main types of large language model providers:
- OpenAI-type services, including OpenAI and Azure;
- Opensource-type services, such as Ollama.

Go to [Enable AI Copilot Functionality](/docs/server/organization/copilot/) to activate the AI assistant for your organization.

## Chat Window

Once Copilot is enabled, the AI assistant chat window can be used across the entire Xpert Analytics Cloud site, for example, a global chat window can serve as a general copilot for asking any questions.

![Roles in Copilot](/public/img/copilot/roles-in-copilot-chat.png)

### Options

The chat window provides the following configuration options:

- **Model**: Select the AI model to use.
- **Temperature**: Select the temperature parameter.
- **Number of options**: Select the number of options to return.
- **Interactive**: Use interactive mode when running commands; it will pause before or after specific nodes, allowing the user to click continue or end.
- **Verbose**: Output detailed logs of the command agent.

You can also **clear chat messages**.

### Shortcuts

| Shortcut | Description |
| --- | --- |
| `Tab` | Quick type autocomplete command |
| `Shift` + `Enter` | Insert a line break |
| `Up` | Previous history record |
| `Down` | Next history record |
| `Ctrl` + `B` | Open copilot chat window |
| `Ctrl` + `/` | Open copilot chat window and type `/` |

## Commands

In [Command](./command/) mode, **commands** are instructions users can input on the current page, and the AI assistant will call an agent to execute the logic based on the commands and prompts.

## Business Roles

[Business Roles](./roles/) is an important feature of the AI assistant that allows users to switch roles according to different business scenarios, enabling more accurate and efficient data analysis.
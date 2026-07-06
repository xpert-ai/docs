---
title: Crawl4AI
sidebar_position: 2
---

[Crawl4AI](https://docs.crawl4ai.com/): Open-source LLM-friendly web crawler and scraping tool.

## Configuring a Crawl4AI MCP Tool Instance

On the XpertAI platform, you can directly configure the built-in Crawl4AI MCP service as an **SSE-type MCP tool instance** for use by agents and workflows.

<Info>
You can also find Crawl4AI in the MCP tool template marketplace and create it with one click.
</Info>

Configuration steps are as follows:

* **Configuration Example**
  When adding an MCP tool on the XpertAI platform, configure it as:

  ```yaml
  type: sse
  url: "http://crawl4ai:11235/mcp/sse"
  name: crawl4ai
  ```

* **Usage**
  Once configured, agents or workflows can directly call the capabilities provided by the `crawl4ai` MCP tool (e.g., `md`, `html`, `screenshot`, `pdf`, `crawl`, `ask`, etc.) during orchestration.

## Use Cases

### Use Case 1: Automated Web Content Collection Agent ("Summary Bot")

**Objective**: Enable users to submit a webpage link through an intelligent agent to automatically retrieve a Markdown text summary of the page.

#### Key Steps

1. User inputs a link → The agent triggers the MCP's `md` tool to convert the target webpage into Markdown text.
2. The agent receives and displays the summary, and can further extract key content based on user needs.

#### Summary Illustration

```text
User: Please summarize the main content of https://example.com.
Agent → Calls MCP tool `md` to retrieve content in Markdown format
Agent → Returns the summary to the user
```

### Use Case 2: Multimedia Content Capture and Analysis Workflow ("Report Generator")

**Objective**: After a user inputs a target URL, the agent automatically captures a webpage screenshot and PDF, and generates a final report on the XpertAI platform.

#### Implementation Steps

1. User inputs a link → The agent sequentially calls:
   * `screenshot`: Generates a webpage screenshot
   * `pdf`: Exports the webpage as a PDF
   * Optional: `ask` or `html` → Extracts structured text content
2. The agent compiles the screenshot, PDF, and text into a shareable report.

#### Workflow Illustration

```text
User: Please capture the https://example.com page and generate a report.
→ Agent calls MCP:
   1⃣ Calls `screenshot` to obtain a page screenshot
   2⃣ Calls `pdf` to obtain a page PDF
   3⃣ Optional: Calls `ask`/`html` to retrieve structured text or Markdown

Agent: Below are the page screenshot and PDF file, with the extracted summary as follows... (displays content)
```

## Cross-Scenario Common Configuration Notes

* **MCP Tool List**

  | Tool Name      | Function Description                     |
  |----------------|-----------------------------------------|
  | `md`           | Generates page content in Markdown       |
  | `html`         | Extracts preprocessed HTML              |
  | `screenshot`   | Captures a full-page screenshot (PNG)    |
  | `pdf`          | Exports the page as a PDF document       |
  | `execute_js`   | Executes custom JavaScript in the page context |
  | `crawl`        | Crawls multiple URLs                    |
  | `ask`          | Queries the indexed library context      |

* For more tool parameters and usage, visit:

  [https://docs.crawl4ai.com/core/docker-deployment/#mcp-model-context-protocol-support](https://docs.crawl4ai.com/core/docker-deployment/#mcp-model-context-protocol-support)

---
title: 🔀 Workflow
sidebar_position: 4
---

**AI Workflow** is the core feature of the Xpert AI platform, designed to support developers in quickly building, debugging, and deploying complex multi-agent collaboration systems through visual orchestration and dynamic execution mechanisms.

The core innovation of the Xpert AI workflow lies in its **hybrid architecture of agents and workflows**, which essentially balances flexibility and efficiency by dynamically adapting to the autonomous needs of different nodes.

![hybrid architecture](/public/img/ai/agent-workflow-hybrid-architecture.png)

1. **Agent Mode** (High Autonomy Nodes)  
   - **Use Cases**: Tasks requiring complex decision-making and free-form LLM involvement (e.g., open-ended conversations, creative generation).  
   - **Features**: Autonomous reasoning based on LLM, capable of dynamically invoking tools and adjusting strategies to adapt to uncertainties.  

2. **Workflow Mode** (Low Autonomy Nodes)  
   - **Use Cases**: Structured processes and tasks with clear rules (e.g., data cleaning, API calls).  
   - **Features**: Predefined standardized operation chains to ensure execution efficiency and controllability.  

3. **Hybrid Collaboration Mechanism**  
   - **Dynamic Switching**: Seamless transition between agent and workflow nodes within the same process (e.g., an agent first understands and communicates user needs, then triggers the corresponding workflow to complete the task).  
   - **State Sharing**: Data is passed through unified state channels to avoid architectural fragmentation.  

**Typical Application Example**: E-commerce Customer Service Scenario  
```plaintext
[User Query] → Workflow Node → Structured Parsing → Agent Node → Intent Reasoning → Branch Judgment  
                          ↑ ↓  
Workflow Node ← If Inventory Check Needed → Workflow Node → Call Database API → Agent Node → Generate Natural Language Response  
```  
Through the hybrid architecture, the stability of database queries is ensured while retaining the flexibility of response generation, with the overall process automatically evolving via state channels.

## Explore Detailed Technical Points

- [**Agent**](./agent/)
- [**External Digital Expert**](./external/)
- [**Session Variables**](./variables/)
- [**Execution Endpoints**](./terminal/)
- [**Error Handling**](./error-handling/)
- [**Logic Branches**](./if-else/)
- [**Iterating**](./iterating/)
- [**Subflow**](./subflow/)
- [**Answer**](./answer/)
- [**Knowledge Retrieval**](./knowledge/)
- [**Code Execution**](./code/)
- [**Template Transformation**](./template/)
- [**Variable Assigner**](./assigner/)
- [**HTTP Request**](./http/)
- [**Tool Invocation**](./tool/)
- [**Question Classifier**](./classifier/)
- [**Note**](./note/)
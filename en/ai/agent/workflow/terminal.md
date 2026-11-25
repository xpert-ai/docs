---
title: Execution Endpoint
sidebar_position: 5
---

In Xpert Agents, the `END` node is a special node used to represent the termination point of a graph. When the execution flow reaches the `END` node, it signifies that the execution of the graph is complete, and the process will stop.

When defining the orchestration structure of an Xpert agent, you can use an `END` agent or tool node to explicitly specify the end of the process.

![End agent](/public/img/ai/terminal-agent.png)

![End tool](/public/img/ai/terminal-tool.png)

<Tip>
It is important to ensure that the logic of the graph is correctly designed to avoid unexpected loops or continued execution after reaching the `END` node.
</Tip>
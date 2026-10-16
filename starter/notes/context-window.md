# Context window

## What the model can see
The context window is everything the model can see in one request: the system prompt, the conversation, tool results and its own earlier replies. Anything outside it does not exist for the model.

## When it fills up
When the window fills up, older content must be dropped or summarized. In Claude Code the /compact command summarizes the history, and details can be lost in the summary.

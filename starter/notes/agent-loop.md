# Agent loop

## The cycle
An agent repeats four steps: build the context, plan, act by calling a tool, then check the result. The loop ends when the model gives a final answer or when a step limit is reached.

## Step limits
Always cap the number of steps. A loop with no limit can run forever and burn tokens on a task it cannot finish.

# Tool calls

## How a model uses a tool
The model never runs code. It returns a structured request that names a tool and its arguments. Your program runs the tool and sends the result back as the next message.

## Writing good tools
Give each tool a clear name, a one-line description and a strict input schema. Validate the arguments in your code, because the model can send wrong or unexpected values.

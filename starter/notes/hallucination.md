# Hallucination

## Why it happens
A model predicts likely text, not true text. When it lacks the facts it can still produce a fluent, confident answer that is wrong.

## How to catch it
Verify claims against a source, for example run npm view on a package name before trusting it. Tell the model to say "I don't know" when unsure, and ask it to cite where each claim came from.

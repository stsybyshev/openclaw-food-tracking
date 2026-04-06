## Input

what's a good pasta recipe for dinner tonight?

## Expected behaviour

- Correctly identifies this is NOT a food tracking request
- Does NOT log any food entry
- Responds as a normal assistant question (recipe suggestion, or out-of-scope note)

## Purpose

Tests intent recognition boundary — the skill must distinguish "I ate X" from "tell me about X".
This is the most important negative test case.

## Ablation note

Both with and without skill should NOT log an entry here.
If the skill causes a false positive log on this input, the intent recognition instructions are too broad.

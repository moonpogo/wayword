# Expression Session Grammar

## Purpose

This grammar defines the minimum shape needed for the first V2 expression-loop prototype. It is intentionally small. It supports three experimental mechanics before any production saved-run architecture is decided.

## Units

### Opener

An opener begins expression.

Example:

```text
Tell a memory as if you are certain.
```

### Expression

Expression is language produced by the user.

Allowed modalities:

```text
speech
typing
mixed
```

### Movement

A movement acts on existing expression.

Example:

```text
Tell it again as if your memory cannot be trusted.
```

### Selection

Selection chooses material from an earlier expression so a movement can act on it.

Prototype-only shape:

```text
Selection
- instruction
- sourceStepId
- selectionGranularity
- selectionPurpose
```

Supported early values:

```text
selectionGranularity:
- sentence
- item

selectionPurpose:
- movement-source
- final-artifact
- reflection
- preservation
```

Current prototype use:

- `certainty-memory-01` uses sentence selection for `movement-source`.
- `attention-sounds-01` uses item selection for `movement-source`.
- `question-threshold-01` uses sentence selection for `movement-source`; question candidates are detected only by local punctuation.

Post-movement selection may still be valid in future sessions, but it is not the primary mechanic in these three experiments.

### Closure

A closure deliberately ends the run.

Example:

```text
Choose one line to keep.
```

## Visible Prototype Surfaces

The prototype preserves the internal grammar but compresses it into three visible surfaces:

```text
initiation and expression
encounter, selection, movement, and shaping
reflection and final artifact
```

Selection is no longer only a closure gesture. In these experiments, selection is the hinge between the first expression and the movement:

```text
opener -> first expression -> select a line -> movement from selected line -> second expression -> final artifact
```

## Valid Early Forms

The prototype grammar should support:

```text
opener -> expression -> closure
opener -> expression -> movement -> expression -> closure
opener -> speech expression -> movement -> typing expression -> closure
opener -> typing expression -> movement -> speech expression -> closure
opener -> timed silence -> expression -> item selection -> movement -> expression -> closure
opener -> expression -> question selection -> typing movement -> typing expression -> closure
```

## Prototype Data Shape

The fixture in `expression-loop-prototype-sessions.json` uses this local-only shape:

```text
SessionDefinition
- id
- title
- mechanic
- opener
- prelude
- steps[]
- closure
- finalArtifact
- privacyNotes

Step
- id
- type
- instruction
- allowedModalities
- sourceStepId
- selectionGranularity
- selectionPurpose

PrototypeSessionState
- currentStepId
- outputsByStepId
- modalityPath
- selectedLine
- selectedIndex
- transientStatus
- conceptualState
- visibleSurface
- preludeStatus
```

`prelude`, `selectionGranularity`, `selectionPurpose`, `questionOnly`, and `finalArtifact` are local prototype fields. The fixture is content and prototype data only. It is not a production schema and must not be treated as the saved-run contract.

## Content Families

### Opener Families

- observation
- memory
- imagination
- description
- relation
- naming
- argument
- sound
- perspective
- unfinished thought

### Movement Families

- select
- continue
- condense
- expand
- contradict
- question
- rename
- invert
- reorder
- change perspective
- change modality
- remove
- preserve
- repeat

### Closure Families

- keep a line
- title it
- leave it unfinished
- read once
- discard
- answer once more
- save the whole
- preserve only the final state

## Boundaries

The first prototype must keep all state in memory. It must not persist text, audio, transcripts, selected lines, or modality paths.

Wayword must not intentionally record, upload, retain, or play back audio. Browser speech recognition may still involve temporary processing by the browser, operating system, or speech provider.

If browser speech recognition is not available, the session still works through typing and operating-system dictation.

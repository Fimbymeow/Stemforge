# Content Import foundation

## Status and boundary

Programme 5 implemented the Content Import mechanism. Chain Rule was subsequently approved and
published through that mechanism; its approval and import receipts are committed. The compiler is
still an infrastructure boundary, not the whole content-production workflow. The current end-to-end
process is documented in `docs/content-production-v1.md`.

The remaining source banks under `content-drafts/higher-maths/calculus` are authoring inputs, not
live content. Any further content change still requires reviewed preview evidence, explicit approval,
staged validation, verified apply and an import receipt.

## Assessment-preservation rule

The importer may normalise representation but must not reauthor assessment. A conversion is allowed
only when it preserves the assessed deliverable, every declared valid answer, the interaction type,
the expected learner evidence, intended difficulty, and diagnostic meaning.

The importer never:

- selects a convenient final field from an undeclared multi-field answer;
- removes a declared accepted answer;
- rewrites unsupported algebra;
- removes units or variable labels;
- converts free text into multiple choice;
- weakens an answer to literal string matching;
- infers a path or stage from names.

If preservation cannot be demonstrated through the live marker, the question is blocked.

## Source and configuration layout

The committed source drafts are:

- `basic-differentiation-v1.md`
- `chain-rule-v6.md`
- `stationary-points-v2.md`
- `optimisation-v1.md`
- `basic-integration-v1.md`
- `tangents-and-normals-v1.md`

Basic Differentiation and Chain Rule have committed import configurations. Chain Rule is now live;
its 34 canonical questions are no longer merely a pending bank.

The other banks deliberately have no production-valid configuration yet:

- Optimisation and Basic Integration have path slugs but no live stage IDs.
- Stationary Points has no live stages and also requires an unresolved product decision between
  the Stationary Points and Nature of stationary points paths.
- Tangents has a draft import configuration reference, but its missing Foundations source and
  unsupported equation-form/structured marking keep it non-importable.

Inventing stage IDs or resolving that split would violate strict configuration and product
ownership. Tests retain explicit invalid/pending examples to prove these cases fail closed.

## Compiler stages

The implemented flow is:

1. Read bounded Markdown bytes and compute their SHA-256 hash.
2. Parse a source-fact-only intermediate representation.
3. Validate a bounded exact import configuration against the live registry.
4. Compare exact question IDs with canonical content.
5. Call the live numeric, polynomial, or multiple-choice marker for every candidate and alias.
6. Classify each question as ready, convertible, blocked, or unchanged.
7. Create a canonical immutable preview decision payload and hash, including the exact configuration
   path and source/configuration byte hashes.
8. Reconstruct that complete payload from current source, configuration and canonical content before
   approval, then require an explicit approval receipt containing the matching full decision payload.
9. Generate deterministic skill-owned TypeScript modules in staging.
10. Validate the hypothetical final content graph.
11. Prepare and validate the immutable import receipt before canonical replacement.
12. Perform ordered replacement, atomically finalise and verify the receipt, and remove rollback state
    only after canonical and receipt hashes are verified.

Markdown and LaTeX remain opaque source strings. The parser does not render or execute them.

## Intermediate representation and parser security

The IR records compiler version, source path and hash, bank identity/version, source line ranges,
declared stage, marks, calculator status, command word, question text, hint, solution, mistake,
QA note, answer candidates, original answer declaration shape, explicit assessment metadata, and
diagnostics.

It contains no resolved version decision, inferred placement, marking capability claim, or approval
state.

The parser supports the two real bank patterns:

- bare `Correct answer` plus Markdown `Accepted answers`;
- fenced YAML `answerFields`.

It supports the real level-two and level-three question headings and ignores skim/QA summary
copies. It bounds source size, question count, fields, aliases, and text, while rejecting malformed
or out-of-order headings, duplicate sections, malformed YAML, duplicate IDs and YAML keys,
prototype-polluting keys, unknown YAML shapes, and missing required sections.

Declared aliases are parsed in full before bounds are checked. An over-limit declaration is retained
for diagnosis and blocks the question; aliases are never sliced or silently pruned. Any error-level
source diagnostic makes the preview explicitly non-importable. Question errors also add a
question-level blocker, while malformed discovery or incomplete enumeration invalidates the whole
bank.

## Classification and blocker taxonomy

Ready questions have exactly one assessed answer and every declared accepted answer succeeds under
the same live marking strategy.

Permitted conversions are limited to:

- `label_rename`
- `stage_label_to_stage_id`
- marker-proven lexical normalisation
- `explicit_scaffolding_field_drop`

The fourth conversion requires every field to explicitly declare assessed/scaffolding status.
None of the five supplied banks declares this, so it occurs zero times in their mechanical audit.

The bounded capability blockers are:

- `structured_coordinate_pair`
- `repeated_coordinate_nature_group`
- `interval_set`
- `structured_multi_field_answer`
- `arbitrary_integration_constant`
- `composite_algebraic_equivalence`
- `equation_form_answer`
- `closed_vocabulary_text_answer`
- `prompt_diagram`
- `graph_response`

These are diagnostic labels only. Programme 5 adds no marking capability.

## Identity and version decisions

Identity matching uses exact canonical question ID only. There is no fuzzy title, content, path, or
stage matching.

Every differing exact-ID collision carries a field-level diff and the available decision kinds.
The importer never selects a decision. An approved collision must include an explicit consistent
decision in its approval receipt. A rejected collision must be explicitly excluded rather than
approved under its existing ID.

### Version-decision matrix

| Complete structured diff | Approval-valid decision |
|---|---|
| Presentation, metadata, hint, worked-solution or common-mistake changes only | `content_revision_bump` or `question_version_bump` |
| Prompt meaning, marks, calculator status, accepted answers, correct-answer authority, options, answer type or marking contract | `question_version_bump` |
| Same-owner stage or ordering change | `question_version_bump` |
| Version fields with no independently proposed content change | none |
| Cross-path ownership transfer, canonical identity change, archive/replace or separate Marking-strategy migration | none in Programme 5 |

Approval rejects any decision that does not cover every changed field. The only approval-valid
decision kinds are implemented by deterministic generation. Cross-path moves, archive-and-replace,
fresh-ID rejection and separate Marking-strategy migration remain explicit external workflows rather
than receipts that validate and later fail.

All eight Basic Differentiation collisions are reported and remain unresolved.

## Preview and approval

`PreviewDecisionPayload` includes source/configuration paths and byte hashes, parsed configuration
hash, live-snapshot hash, importer version, importable status, all question IDs, classifications,
diagnostics, blockers, candidate partitions, collision diffs, and exact question-fragment output
paths and hashes.

`previewHash` is SHA-256 over deterministic canonical serialization of the complete payload.
Human-readable previews and payload files are generated beneath `content-import/previews` and are
gitignored. They are immutable: the CLI uses exclusive creation.

An approval receipt embeds the complete payload, so its decision can be audited after the
disposable preview file is removed. Approval and apply independently reread the exact recorded
source and configuration paths, reconstruct parsing, classification, collision analysis and
canonical proposals, and require canonical payload and hash equality. A reauthored preview therefore
fails even if its self-hash was recomputed. Validation also checks exact candidate accounting,
rejects invalid, blocked or unchanged approvals, validates impact-derived collision decisions,
rejects duplicates and unknown IDs, and rechecks source bytes, configuration bytes/path and live
snapshot freshness. There is no approve-all shortcut.

## Canonical output ownership

Canonical Higher Maths questions now use one module per skill path. The existing eight questions
were moved byte-for-byte from `differentiation.ts` to `basic-differentiation.ts`; their objects,
IDs, versions, stages, order, and evidence identity are unchanged.

The generator may replace only the configured skill-owned module. It never rewrites sibling
question files, shared helpers, or a hand-maintained registry. A new path module is staged and
reported, but real apply refuses until its small explicit registry wiring has been reviewed.

## Apply and rollback guarantee

Multi-file replacement is not described as atomic.

Apply requires a clean working tree by default. An advanced/test override must carry the exact
acknowledged status snapshot and hash. Outputs are generated in staging and the hypothetical final
content graph is validated before replacement.

For every destination, original bytes and hashes are retained in recovery state. Receipt bytes,
hash, directory and same-filesystem temporary path are prepared before canonical writes.
Replacements use deterministic path order. The receipt is atomically renamed and reread only after
canonical hashes pass. Any canonical or receipt failure rolls already-changed files back to exact
original bytes, deletes newly created destinations and removes a finalised receipt. Recovery state
remains after post-write failure. Pre-write validation failures remove staging and leave no apply
state. Temporary recovery state is removed only after every canonical hash and the persisted receipt
have been verified.

Fault-injection tests cover failure after the first, middle, and final replacement, canonical
post-write corruption, receipt validation, receipt-directory preparation, temporary receipt write,
receipt finalisation, persisted-receipt verification and staged-graph validation.

## Security boundaries

- No network calls or arbitrary command execution are used for content compilation.
- CLI input paths are confined to the applicable draft, preview, or approval boundary.
- Slugs, IDs, arrays, strings, configurations, receipts, and output paths are bounded and validated.
- YAML is parsed by a narrow answer-field parser, not executed.
- Prototype-polluting keys are rejected.
- Generated output paths cannot traverse the repository.
- Source, configuration, preview, approval, and output hashes use SHA-256.
- Live marking implementations remain authoritative and unchanged.

## CLI

The supported commands are:

    pnpm run import-content -- preview content-drafts/higher-maths/calculus/basic-differentiation-v1.md
    pnpm run import-content -- preview content-drafts/higher-maths/calculus/basic-differentiation-v1.md --config content-drafts/configurations/basic.import.json
    pnpm run import-content -- approve content-import/previews/<preview>.json --include <ids> --exclude <id=reason>
    pnpm run import-content -- apply content-import/approvals/<receipt>.json

Preview performs no canonical write. Approve writes only a receipt. A custom `--config` path becomes
part of the immutable preview identity and apply rereads that exact path rather than deriving an
adjacent filename. Apply refuses stale or incomplete approval, invalid graph output, new-path
registry wiring, and unacknowledged working-tree changes.

## Historical five-bank mechanical results

The Programme 5 parser/classifier run produced the snapshot below. It is retained as historical
compiler evidence, not a current production tracker: Chain Rule was later repartitioned, approved
and published, and five Tangents questions now live in a separate draft. Use `pnpm run
content:status` for current all-skill state.

| Bank | Parsed | Ready | Convertible | Blocked |
|---|---:|---:|---:|---:|
| Basic Differentiation v1 | 50 | 7 | 0 | 43 |
| Chain Rule v6 | 45 | 0 | 2 | 43 |
| Stationary Points v2 | 43 | 0 | 0 | 43 |
| Optimisation v1 | 14 | 0 | 0 | 14 |
| Basic Integration v1 | 20 | 0 | 0 | 20 |
| **Total** | **172** | **7** | **2** | **163** |

Blocker occurrences overlap when one question violates more than one contract:

| Bank | Blocker occurrences |
|---|---|
| Basic Differentiation | 39 undeclared multi-field; 4 unsupported marker targets |
| Chain Rule | 35 equation-form; 11 unsupported aliases; 4 unsupported marker targets |
| Stationary Points | 5 equation-form; 11 interval-set; 12 unsupported aliases; 24 unsupported marker targets |
| Optimisation | 12 equation-form; 2 unsupported marker targets |
| Basic Integration | 14 arbitrary integration constants; 6 undeclared multi-field |

The valid Basic Differentiation preview separately reported 50 total, 7 eligible, 43 blocked,
0 unchanged, and all eight exact-ID collisions. No collision decision was made.

These figures describe that historical compatibility run, not current content quality or a current
publication recommendation.

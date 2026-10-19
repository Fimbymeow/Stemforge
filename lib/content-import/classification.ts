import type { Question, QuestionOption } from "@/data/types";
import { markQuestionAnswer } from "@/lib/answer-engine";
import { resolveConfiguredPlacement } from "@/lib/content-import/configuration";
import { canonicalSerialize } from "@/lib/content-import/canonical";
import { stripMathWrapper } from "@/lib/content-import/parser";
import type {
  BankImportConfiguration,
  CollisionDiff,
  CollisionFieldDiff,
  ContentBankIR,
  ImportAnswerCandidate,
  ImportBlocker,
  ImportClassification,
  ImportConversion,
  ImportQuestionIR,
  ImportRegistry,
  MarkerCompatibilityCheck,
  RequiredCapability,
} from "@/lib/content-import/types";
import { buildVocabulary } from "@/lib/marking/closed-vocabulary-text";
import type {
  ClosedVocabularyTextAnswerMarkingContract,
  AtomicMarkingContract,
  CompositeAlgebraicEquivalenceMarkingContract,
  MarkingFixtures,
  MultipartMarkingContract,
  NumericMarkingContract,
  PolynomialMarkingContract,
  CoordinatePairMarkingContract,
  LinearEquationEquivalenceMarkingContract,
  QuestionMarkingContract,
} from "@/lib/marking/types";

export function classifyBank(
  bank: ContentBankIR,
  configuration: BankImportConfiguration,
  registry: ImportRegistry,
): { classifications: ImportClassification[]; collisionDiffs: CollisionDiff[] } {
  const collisionDiffs: CollisionDiff[] = [];
  const classifications = bank.questions.map((question) => {
    const placement = resolveConfiguredPlacement(configuration, question.id, question.declaredStage, registry);
    const diagnostics = [...question.diagnostics];
    const existing = registry.questions.get(question.id);
    if (bank.advisorySkillPathId && bank.advisorySkillPathId !== configuration.bankId) {
      diagnostics.push({
        code: "advisory_skill_path_mismatch",
        severity: "warning",
        message: `Draft advisory skillPathId "${bank.advisorySkillPathId}" differs from configured bank identity "${configuration.bankId}".`,
        questionId: question.id,
        lineRange: question.sourceLineRange,
      });
    }
    const assessed = selectAssessedCandidate(question);
    const blockers = [...assessed.blockers];
    const curriculum = question.curriculum ?? existing?.curriculum;
    if (!question.curriculum && existing?.curriculum) {
      diagnostics.push({
        code: "reviewed_runtime_curriculum_compatibility",
        severity: "warning",
        message: "Authored curriculum metadata is absent; this exact published question keeps its reviewed runtime curriculum metadata for backward compatibility.",
        questionId: question.id,
        lineRange: question.sourceLineRange,
      });
    }
    if (!curriculum) {
      blockers.push({ code: "missing_curriculum_metadata", message: "New authored questions must explicitly declare curriculum.primarySkillId and curriculum.requiredSkillIds, including an empty requiredSkillIds list when no extra dependency is required." });
    } else {
      if (!registry.paths.has(curriculum.primarySkillId)) {
        blockers.push({ code: "unknown_curriculum_primary_skill", message: `Question curriculum names unknown canonical owner "${curriculum.primarySkillId}".` });
      }
      if (curriculum.primarySkillId !== placement.targetSkillPathSlug) {
        blockers.push({ code: "curriculum_primary_skill_mismatch", message: `Question curriculum owner "${curriculum.primarySkillId}" does not match configured target "${placement.targetSkillPathSlug}".` });
      }
      if (new Set(curriculum.requiredSkillIds).size !== curriculum.requiredSkillIds.length) {
        blockers.push({ code: "duplicate_curriculum_required_skill", message: "Question curriculum repeats a required canonical skill ID." });
      }
      for (const requiredSkillId of curriculum.requiredSkillIds) {
        if (!registry.paths.has(requiredSkillId)) blockers.push({ code: "unknown_curriculum_required_skill", message: `Question curriculum requires unknown canonical skill "${requiredSkillId}".` });
      }
    }
    if (question.diagnostics.some((item) => item.severity === "error")) {
      blockers.push({
        code: "invalid_source_question",
        message: "Question contains error-level source diagnostics and cannot be imported.",
      });
    }
    if (!placement.targetStageId) {
      blockers.push({
        code: "unmapped_source_stage",
        message: `Source stage "${question.declaredStage}" has no explicit canonical stage mapping.`,
      });
    }
    const conversions: ImportConversion[] = configuration && !("stageNameToStageId" in configuration)
      ? ["label_rename", "practice_compatibility_provenance"]
      : ["label_rename", "stage_label_to_stage_id"];
    if (assessed.conversion) conversions.push(assessed.conversion);
    let markerCompatibility: MarkerCompatibilityCheck | undefined;
    let canonicalQuestion: Question | undefined;
    if (assessed.candidates) {
      const marker = analyseMultipartMarkability(question, assessed.candidates);
      markerCompatibility = marker.compatibility;
      blockers.push(...marker.blockers);
      if (marker.contract && !blockers.length && placement.targetStageId) {
        canonicalQuestion = toCanonicalQuestion(question, assessed.candidates, marker.contract, marker.correctAnswer, curriculum!, placement.targetSkillPathSlug, placement.targetStageId, registry);
      }
    } else if (assessed.candidate) {
      const marker = analyseMarkability(question, assessed.candidate);
      markerCompatibility = marker.compatibility;
      blockers.push(...marker.blockers);
      if (marker.lexicallyNormalised) conversions.push("marker_proven_lexical_normalisation");
      if (marker.contract && !blockers.length && placement.targetStageId) {
        canonicalQuestion = toCanonicalQuestion(question, assessed.candidate, marker.contract, marker.correctAnswer, curriculum!, placement.targetSkillPathSlug, placement.targetStageId, registry);
      }
    }
    let status: ImportClassification["status"] = blockers.length ? "blocked" : conversions.length ? "convertible" : "ready";
    if (existing) {
      const diff = canonicalQuestion ? compareQuestion(existing, canonicalQuestion) : compareSourceQuestion(existing, question);
      collisionDiffs.push(diff);
      if (diff.identical && canonicalQuestion) status = "unchanged";
      else if (configuration.runMode === "new_content_only") {
        blockers.push({ code: "existing_id_collision", message: `Question ID "${question.id}" already exists and new_content_only forbids edits.` });
        status = "blocked";
      } else if (!blockers.length && !diff.availableVersionDecisions.length) {
        blockers.push({
          code: "collision_has_no_executable_version_decision",
          message: `Question ID "${question.id}" differs in a way the current importer cannot apply safely.`,
        });
        status = "blocked";
      } else if (!blockers.length) {
        diagnostics.push({
          code: "collision_requires_explicit_version_decision",
          severity: "warning",
          message: `Question ID "${question.id}" differs from canonical content and requires an explicit approval-receipt decision.`,
          questionId: question.id,
          lineRange: question.sourceLineRange,
        });
      }
    }
    return {
      questionId: question.id,
      sourceLineRange: question.sourceLineRange,
      status,
      targetSkillPathSlug: placement.targetSkillPathSlug,
      targetStageId: placement.targetStageId,
      conversions: unique(conversions),
      blockers,
      diagnostics,
      ...(markerCompatibility ? { markerCompatibility } : {}),
      ...(canonicalQuestion ? { canonicalQuestion } : {}),
    };
  });
  return { classifications, collisionDiffs };
}

export function auditBankAssessment(bank: ContentBankIR): ImportClassification[] {
  return bank.questions.map((question) => {
    const assessed = selectAssessedCandidate(question);
    const blockers = [...assessed.blockers];
    if (question.diagnostics.some((item) => item.severity === "error")) {
      blockers.push({
        code: "invalid_source_question",
        message: "Question contains error-level source diagnostics and cannot be imported.",
      });
    }
    const conversions: ImportConversion[] = assessed.conversion ? [assessed.conversion] : [];
    let markerCompatibility: MarkerCompatibilityCheck | undefined;
    if (assessed.candidates) {
      const marker = analyseMultipartMarkability(question, assessed.candidates);
      blockers.push(...marker.blockers);
      markerCompatibility = marker.compatibility;
    } else if (assessed.candidate) {
      const marker = analyseMarkability(question, assessed.candidate);
      blockers.push(...marker.blockers);
      markerCompatibility = marker.compatibility;
      if (marker.lexicallyNormalised) conversions.push("marker_proven_lexical_normalisation");
    }
    return {
      questionId: question.id,
      sourceLineRange: question.sourceLineRange,
      status: blockers.length ? "blocked" : conversions.length ? "convertible" : "ready",
      conversions: unique(conversions),
      blockers,
      diagnostics: [...question.diagnostics],
      ...(markerCompatibility ? { markerCompatibility } : {}),
    };
  });
}

function selectAssessedCandidate(question: ImportQuestionIR): {
  candidate?: ImportAnswerCandidate;
  candidates?: ImportAnswerCandidate[];
  conversion?: ImportConversion;
  blockers: ImportBlocker[];
} {
  if (question.answerCandidates.length === 1) return { candidate: question.answerCandidates[0], blockers: [] };
  const multiFieldCapability = detectMultiFieldCapability(question);
  if (multiFieldCapability === "repeated_coordinate_nature_group") return {
    blockers: [{ code: "requires_repeated_coordinate_nature_group", message: "Repeated coordinate/nature groups remain outside the bounded multipart contract.", requiredCapability: multiFieldCapability }],
  };
  if (question.explicitFieldAssessment) {
    const assessed = question.answerCandidates.filter((candidate) => candidate.assessed);
    const scaffolding = question.answerCandidates.filter((candidate) => candidate.assessed === false);
    if (assessed.length === 1 && scaffolding.length === question.answerCandidates.length - 1) {
      return { candidate: assessed[0], conversion: "explicit_scaffolding_field_drop", blockers: [] };
    }
    if (assessed.length > 1 && assessed.length + scaffolding.length === question.answerCandidates.length) {
      return { candidates: assessed, ...(scaffolding.length ? { conversion: "explicit_scaffolding_field_drop" as const } : {}), blockers: [] };
    }
  }
  if (question.answerCandidates.length > 1 && !question.explicitFieldAssessment && question.interactionType?.toLowerCase() === "multi_step") {
    return { candidates: question.answerCandidates, blockers: [] };
  }
  const requiredCapability = multiFieldCapability;
  return {
    blockers: [{
      code: "undeclared_multi_field_assessment",
      message: "Multiple answer fields cannot be collapsed without explicit assessed/scaffolding metadata.",
      requiredCapability,
    }],
  };
}

function analyseMarkability(question: ImportQuestionIR, candidate: ImportAnswerCandidate, allowFieldWrappers = false) {
  const blockers: ImportBlocker[] = [];
  const fieldType = candidate.type.toLowerCase();
  const capability = detectCapability(question, candidate);
  // closed_vocabulary_text_answer is the one detected capability with a real, narrowly-scoped
  // marker behind it — but only for the exact constrained field type the marker was designed
  // against ("text_short"). A "nature"/"classification" typed field, or any other detected
  // capability, still blocks immediately exactly as before: this must never widen into inferring
  // the marker for arbitrary free-text fields merely because they happen to declare aliases.
  const isNarrowClosedVocabularyField = capability === "closed_vocabulary_text_answer" && candidate.type.toLowerCase() === "text_short";
  const isSupportedEquation = capability === "equation_form_answer" && candidate.type.toLowerCase() === "algebraic";
  const isSupportedCoordinate = capability === "structured_coordinate_pair" && candidate.type.toLowerCase() === "coordinate";
  if (capability && !isNarrowClosedVocabularyField && !isSupportedEquation && !isSupportedCoordinate) {
    blockers.push({ code: `requires_${capability}`, message: `Answer requires unsupported capability "${capability}".`, requiredCapability: capability, candidateId: candidate.id });
    return { blockers, compatibility: { aliasOutcomes: [] } as MarkerCompatibilityCheck, correctAnswer: candidate.correctAnswer, lexicallyNormalised: false };
  }
  const supportedTypes = new Set(["numeric", "numerical", "exact", "algebraic", "coordinate", "text_short", "multiple_choice"]);
  if (!supportedTypes.has(fieldType)) {
    blockers.push({ code: "unsupported_answer_field_type", message: `Answer field type "${candidate.type}" is not in the bounded authoring contract.`, candidateId: candidate.id });
    return { blockers, compatibility: { aliasOutcomes: [] } as MarkerCompatibilityCheck, correctAnswer: candidate.correctAnswer, lexicallyNormalised: false };
  }
  const interaction = (question.interactionType || candidate.type).toLowerCase();
  const rawCorrect = candidate.correctAnswer;
  const correctAnswer = normalizeMarkerLexeme(rawCorrect);
  let contract: QuestionMarkingContract | undefined;
  if (isSupportedEquation) {
    const line = linearEquationContract(correctAnswer, candidate.acceptedAnswers.map(normalizeMarkerLexeme));
    if (line && markQuestionAnswer({ marking: line }, line.target).outcomeKind === "graded") contract = line;
    else blockers.push({ code: "requires_equation_form_answer", message: "Equation is outside the supported affine x/y line-equation domain.", requiredCapability: "equation_form_answer", candidateId: candidate.id });
  } else if (isSupportedCoordinate) {
    const coordinate = coordinatePairContract(correctAnswer, candidate.acceptedAnswers.map(normalizeMarkerLexeme));
    if (coordinate && markQuestionAnswer({ marking: coordinate }, coordinate.target).outcomeKind === "graded") contract = coordinate;
    else blockers.push({ code: "requires_structured_coordinate_pair", message: "Coordinate is outside the supported exact ordered-pair domain.", requiredCapability: "structured_coordinate_pair", candidateId: candidate.id });
  } else if (isNarrowClosedVocabularyField) {
    const closedVocabulary = closedVocabularyTextAnswerContract(candidate);
    if (closedVocabulary && markQuestionAnswer({ marking: closedVocabulary }, closedVocabulary.target).outcomeKind === "graded") contract = closedVocabulary;
    else {
      blockers.push({
        code: "requires_closed_vocabulary_text_answer",
        message: 'Answer requires unsupported capability "closed_vocabulary_text_answer".',
        requiredCapability: "closed_vocabulary_text_answer",
        candidateId: candidate.id,
      });
    }
  } else if (interaction === "multiple_choice") {
    const options = parseOptions(question.questionText);
    const authority = resolveMultipleChoiceAuthority(rawCorrect, options);
    const duplicateValues = hasDuplicates(options.map((option) => option.value));
    const duplicateLabels = hasDuplicates(options.map((option) => normalizeOptionText(option.label)));
    if (!options.length) {
      blockers.push({ code: "missing_multiple_choice_options", message: "Multiple-choice question does not declare parseable options.", candidateId: candidate.id });
    } else if (duplicateValues || duplicateLabels) {
      blockers.push({ code: "ambiguous_multiple_choice_options", message: "Multiple-choice option IDs and labels must be unique.", candidateId: candidate.id });
    } else if (!authority) {
      blockers.push({ code: "invalid_multiple_choice_target", message: "Multiple-choice correct answer does not resolve uniquely to an existing option.", candidateId: candidate.id });
    } else {
      contract = { strategy: "multiple_choice", strategyVersion: 1, correctOptionId: authority, fixtures: fixtures([authority]) };
    }
  } else {
    const numeric = numericContract(correctAnswer, candidate.acceptedAnswers.map(normalizeMarkerLexeme));
    const polynomial = polynomialContract(correctAnswer, candidate.acceptedAnswers.map(normalizeMarkerLexeme));
    const composite = compositeAlgebraicContract(correctAnswer, candidate.acceptedAnswers.map(normalizeMarkerLexeme));
    if (numeric && markQuestionAnswer({ marking: numeric }, correctAnswer).outcomeKind === "graded") contract = numeric;
    else if (polynomial && markQuestionAnswer({ marking: polynomial }, correctAnswer).outcomeKind === "graded") contract = polynomial;
    else if (composite && markQuestionAnswer({ marking: composite }, correctAnswer).outcomeKind === "graded") contract = composite;
    else {
      const requiredCapability = inferUnsupportedAlgebraCapability(correctAnswer);
      blockers.push({
        code: "unsupported_marker_target",
        message: "The live marking implementations cannot interpret the declared correct answer.",
        ...(requiredCapability ? { requiredCapability } : {}),
        candidateId: candidate.id,
      });
    }
  }
  const aliases = unique(candidate.acceptedAnswers.length ? candidate.acceptedAnswers : [candidate.correctAnswer]);
  const aliasOutcomes = contract ? aliases.map((answer) => {
    const submitted = contract.strategy === "multiple_choice"
      ? resolveMultipleChoiceAuthority(answer, parseOptions(question.questionText)) ?? answer
      // Closed-vocabulary text is never routed through the LaTeX/math-lexeme normaliser — an
      // authored phrase could legitimately start with "A. " or contain other math-specific tokens
      // that normalizeMarkerLexeme would mangle; the marker's own narrow text normaliser handles it.
      : contract.strategy === "closed_vocabulary_text_answer"
        ? answer
        : allowFieldWrappers ? normalizeFieldLexeme(candidate, answer) : normalizeMarkerLexeme(answer);
    const result = markQuestionAnswer({ marking: contract }, submitted);
    return { answer, outcomeKind: result.outcomeKind, isCorrect: result.isCorrect };
  }) : [];
  if (contract) {
    aliasOutcomes.forEach((outcome) => {
      if (outcome.outcomeKind !== "graded" || outcome.isCorrect !== true) {
        blockers.push({
          code: "unsupported_intended_alias",
          message: "A source-declared accepted answer is not accepted by the live strategy; aliases are never pruned.",
          candidateId: candidate.id,
        });
      }
    });
  }
  const canonicalCorrectAnswer = contract?.strategy === "multiple_choice" ? contract.correctOptionId
    : contract?.strategy === "closed_vocabulary_text_answer" ? contract.target
    : correctAnswer;
  const targetOutcome = contract ? markQuestionAnswer({ marking: contract }, canonicalCorrectAnswer).outcomeKind : undefined;
  return {
    blockers,
    contract,
    compatibility: {
      ...(contract ? { strategy: contract.strategy, strategyVersion: contract.strategyVersion } : {}),
      ...(targetOutcome ? { targetOutcome } : {}),
      aliasOutcomes,
    },
    correctAnswer: canonicalCorrectAnswer,
    lexicallyNormalised: correctAnswer !== rawCorrect,
  };
}

function analyseMultipartMarkability(question: ImportQuestionIR, candidates: ImportAnswerCandidate[]) {
  const blockers: ImportBlocker[] = [];
  const fields: MultipartMarkingContract["fields"] = [];
  for (const candidate of candidates) {
    const marker = analyseMarkability(question, candidate, true);
    blockers.push(...marker.blockers);
    if (!marker.contract || !isAtomicContract(marker.contract)) continue;
    fields.push({
      id: candidate.id,
      label: candidate.label,
      inputType: marker.contract.strategy === "numeric" ? "numeric"
        : marker.contract.strategy === "coordinate_pair" ? "coordinate"
        : marker.contract.strategy === "linear_equation_equivalence" ? "line_equation"
        : marker.contract.strategy === "closed_vocabulary_text_answer" ? "text" : "algebraic",
      marking: marker.contract,
    });
  }
  const contract: MultipartMarkingContract | undefined = !blockers.length && fields.length === candidates.length
    ? { strategy: "multipart", strategyVersion: 1, fields }
    : undefined;
  const correctAnswer = contract ? JSON.stringify(Object.fromEntries(candidates.map((candidate) => [candidate.id, normalizeFieldLexeme(candidate, candidate.correctAnswer)]))) : "";
  const targetOutcome = contract ? markQuestionAnswer({ marking: contract }, correctAnswer).outcomeKind : undefined;
  if (contract && targetOutcome !== "graded") blockers.push({ code: "unsupported_multipart_target", message: "The multipart target does not produce a graded outcome." });
  return {
    blockers,
    contract: blockers.length ? undefined : contract,
    correctAnswer,
    compatibility: { ...(contract ? { strategy: contract.strategy, strategyVersion: contract.strategyVersion } : {}), ...(targetOutcome ? { targetOutcome } : {}), aliasOutcomes: [] } as MarkerCompatibilityCheck,
  };
}

function isAtomicContract(contract: QuestionMarkingContract): contract is AtomicMarkingContract {
  return !["multiple_choice", "guided_self_check", "structured_graph", "multipart"].includes(contract.strategy);
}

function toCanonicalQuestion(
  source: ImportQuestionIR,
  candidate: ImportAnswerCandidate | ImportAnswerCandidate[],
  marking: QuestionMarkingContract,
  correctAnswer: string,
  curriculum: NonNullable<Question["curriculum"]>,
  pathSlug: string,
  stageId: string,
  registry: ImportRegistry,
): Question {
  const path = registry.paths.get(pathSlug);
  if (!path) throw new Error(`unknown_import_path:${pathSlug}`);
  const answerType = marking.strategy === "multiple_choice" ? "multiple_choice"
    : marking.strategy === "numeric" ? "numerical"
    : marking.strategy === "closed_vocabulary_text_answer" ? "written"
    : marking.strategy === "multipart" ? "multi_step"
    : "algebraic";
  const options = marking.strategy === "multiple_choice" ? parseOptions(source.questionText) : undefined;
  return {
    id: source.id,
    questionVersion: 1,
    contentRevision: 1,
    contentStatus: "active",
    subject: path.subject,
    courseArea: path.courseArea,
    specArea: path.specArea,
    skillPath: path.name,
    skillPathId: path.slug,
    stageId,
    stage: source.declaredStage as Question["stage"],
    skill: source.subskill ?? source.commandWord ?? "Imported question",
    title: source.subskill ?? source.id,
    questionText: source.questionText,
    marks: source.marks,
    answerType,
    marking,
    ...(marking.strategy === "multipart" ? { answerFields: marking.fields } : {}),
    curriculum,
    ...(source.graphConfig ? { graphConfig: source.graphConfig } : {}),
    correctAnswer,
    acceptedAnswers: marking.strategy === "multiple_choice"
      ? [marking.correctOptionId]
      : marking.strategy === "closed_vocabulary_text_answer"
        ? marking.acceptedAnswers
        : marking.strategy === "multipart"
          ? [correctAnswer]
          : unique((candidate as ImportAnswerCandidate).acceptedAnswers.map(normalizeMarkerLexeme)),
    ...(options?.length ? { options } : {}),
    workedSolution: source.workedSolution,
    finalAnswer: correctAnswer,
    hint: source.hint,
    commonMistake: source.commonMistake,
    calculatorAllowed: !/non-calculator/i.test(source.calculatorStatus ?? ""),
    source: "Original Orthic QS-style content",
    status: "ready",
    displayOrder: authoredOrder(source.sourceOrder),
  };
}

export function compareQuestion(existing: Question, proposed: Question): CollisionDiff {
  const fields: CollisionFieldDiff[] = [];
  const keys = [...new Set([...Object.keys(existing), ...Object.keys(proposed)])].sort() as Array<keyof Question>;
  for (const key of keys) {
    const existingValue = existing[key];
    const proposedValue = proposed[key];
    if (existingValue === undefined && proposedValue === undefined) continue;
    if (existingValue !== undefined && proposedValue !== undefined &&
        canonicalSerialize(existingValue) === canonicalSerialize(proposedValue)) continue;
    fields.push({
      field: key,
      existingValue: diffValue(existingValue),
      proposedValue: diffValue(proposedValue),
      likelyImpact: impactForField(key),
    });
  }
  return { questionId: proposed.id, identical: fields.length === 0, fields, availableVersionDecisions: deriveVersionDecisions(existing, proposed, fields) };
}

function compareSourceQuestion(existing: Question, source: ImportQuestionIR): CollisionDiff {
  const first = source.answerCandidates[0];
  const proposed = {
    stage: source.declaredStage,
    questionText: source.questionText,
    marks: source.marks,
    correctAnswer: first?.correctAnswer,
    acceptedAnswers: first?.acceptedAnswers,
    curriculum: source.curriculum,
    graphConfig: source.graphConfig,
    workedSolution: source.workedSolution,
    hint: source.hint,
    commonMistake: source.commonMistake,
    calculatorAllowed: !/non-calculator/i.test(source.calculatorStatus ?? ""),
    sourceLineRange: source.sourceLineRange,
    answerDeclarationShape: source.answerDeclarationShape,
  };
  const fields: CollisionFieldDiff[] = [];
  for (const [field, proposedValue] of Object.entries(proposed)) {
    const existingValue = (existing as unknown as Record<string, unknown>)[field];
    if (existingValue === undefined && proposedValue === undefined) continue;
    if (existingValue !== undefined && proposedValue !== undefined &&
        canonicalSerialize(existingValue) === canonicalSerialize(proposedValue)) continue;
    fields.push({
      field,
      existingValue: diffValue(existingValue),
      proposedValue: diffValue(proposedValue),
      likelyImpact: field === "stage" ? "placement" : field === "acceptedAnswers" ? "accepted_answers" :
        ["correctAnswer", "answerDeclarationShape"].includes(field) ? "marking_strategy" :
        ["questionText", "marks", "calculatorAllowed"].includes(field) ? "assessment_meaning" :
          ["workedSolution", "hint", "commonMistake"].includes(field) ? "content_revision" : "metadata",
    });
  }
  return { questionId: source.id, identical: fields.length === 0, fields, availableVersionDecisions: [] };
}

function numericContract(target: string, accepted: string[]): NumericMarkingContract | undefined {
  if (!/^[-+]?(?:\d+(?:\.\d+)?|\.\d+|\d+\/[-+]?\d+)$/.test(target)) return undefined;
  return { strategy: "numeric", strategyVersion: 1, target, comparison: { type: "exact" }, fixtures: fixtures(unique([target, ...accepted]), "numeric") };
}

function polynomialContract(target: string, accepted: string[]): PolynomialMarkingContract | undefined {
  if (!/[a-z]/i.test(target)) return undefined;
  return { strategy: "polynomial_form", strategyVersion: 1, target, variable: inferVariable(target), fixtures: fixtures(unique([target, ...accepted]), "polynomial_form") };
}

function compositeAlgebraicContract(target: string, accepted: string[]): CompositeAlgebraicEquivalenceMarkingContract | undefined {
  if (!/[a-z]/i.test(target) || /=/.test(target)) return undefined;
  const variable = inferVariable(target);
  const v1: CompositeAlgebraicEquivalenceMarkingContract = { strategy: "composite_algebraic_equivalence", strategyVersion: 1, target, variable, fixtures: fixtures(unique([target, ...accepted]), "composite_algebraic_equivalence") };
  if (markQuestionAnswer({ marking: v1 }, target).outcomeKind === "graded") return v1;
  const v2: CompositeAlgebraicEquivalenceMarkingContract = { strategy: "composite_algebraic_equivalence", strategyVersion: 2, target, variable, fixtures: fixtures(unique([target, ...accepted]), "composite_algebraic_equivalence") };
  if (markQuestionAnswer({ marking: v2 }, target).outcomeKind === "graded") return v2;
  return undefined;
}

function linearEquationContract(target: string, accepted: string[]): LinearEquationEquivalenceMarkingContract | undefined {
  if (!/=/.test(target)) return undefined;
  return { strategy: "linear_equation_equivalence", strategyVersion: 1, target, variables: ["x", "y"], fixtures: lineEquationFixtures(unique([target, ...accepted])) };
}

function coordinatePairContract(target: string, accepted: string[]): CoordinatePairMarkingContract | undefined {
  return { strategy: "coordinate_pair", strategyVersion: 1, target, fixtures: coordinatePairFixtures(unique([target, ...accepted])) };
}

function lineEquationFixtures(correct: string[]): MarkingFixtures {
  return {
    correct: correct.map((input) => ({ input })),
    incorrect: [{ input: "y=0", reason: "value_wrong" }],
    malformed: [{ input: "not-an-equation", reason: "malformed_linear_equation" }],
    unmarkable: [{ input: "y=x^2", reason: "unsupported_mathematical_form" }],
  };
}

function coordinatePairFixtures(correct: string[]): MarkingFixtures {
  return {
    correct: correct.map((input) => ({ input })),
    incorrect: [{ input: "(0,0)", reason: "value_wrong" }],
    malformed: [{ input: "(1,)", reason: "malformed_coordinate_pair" }],
    unmarkable: [{ input: "(x,1)", reason: "unsupported_mathematical_form" }],
  };
}

// Reasons attached below are the exact legal values per strategy in isLegalPersistedMarkerMetadata
// (lib/marking/types.ts) — malformed/unmarkable reasons differ per strategy; "value_wrong" for
// incorrect is legal across every graded, non-guided strategy. The probe inputs ("0"/"1", "++",
// "sin(x)") are unchanged from before and were independently confirmed against the real marker for
// every strategy that reaches this helper (numeric, polynomial_form, composite_algebraic_equivalence
// V1 and V2) to actually produce the outcome the attached reason declares.
const FIXTURE_MALFORMED_REASON = {
  numeric: "malformed_numeric",
  polynomial_form: "malformed_polynomial",
  composite_algebraic_equivalence: "malformed_composite_expression",
} as const;
const FIXTURE_UNMARKABLE_REASON = {
  numeric: "expression_not_permitted",
  polynomial_form: "unsupported_mathematical_form",
  composite_algebraic_equivalence: "unsupported_mathematical_form",
} as const;

function fixtures(correct: string[], strategy?: keyof typeof FIXTURE_MALFORMED_REASON): MarkingFixtures {
  const incorrectInput = correct.includes("0") ? "1" : "0";
  if (!strategy) {
    return { correct: correct.map((input) => ({ input })), incorrect: [{ input: incorrectInput }], malformed: [{ input: "++" }], unmarkable: [{ input: "sin(x)" }] };
  }
  return {
    correct: correct.map((input) => ({ input })),
    incorrect: [{ input: incorrectInput, reason: "value_wrong" }],
    malformed: [{ input: "++", reason: FIXTURE_MALFORMED_REASON[strategy] }],
    unmarkable: [{ input: "sin(x)", reason: FIXTURE_UNMARKABLE_REASON[strategy] }],
  };
}

/**
 * Builds a validated closed-vocabulary contract from a candidate's raw correctAnswer/acceptedAnswers
 * — never routed through normalizeMarkerLexeme (that normaliser is LaTeX/math-lexeme specific and
 * would mangle plain text). Returns undefined if the declared vocabulary fails validation (empty,
 * too many entries, an entry too long, an ambiguous duplicate after normalisation, or a target not
 * present in its own vocabulary) — the caller then falls back to blocking, exactly like the
 * numeric/polynomial/composite ladder does when no contract can be built.
 */
function closedVocabularyTextAnswerContract(candidate: ImportAnswerCandidate): ClosedVocabularyTextAnswerMarkingContract | undefined {
  const target = candidate.correctAnswer;
  const acceptedAnswers = unique(candidate.acceptedAnswers.length ? candidate.acceptedAnswers : [target]);
  const validation = buildVocabulary({ target, acceptedAnswers });
  if (validation.status !== "valid") return undefined;
  return { strategy: "closed_vocabulary_text_answer", strategyVersion: 1, target, acceptedAnswers, fixtures: closedVocabularyFixtures(acceptedAnswers) };
}

function closedVocabularyFixtures(correct: string[]): MarkingFixtures {
  return {
    correct: correct.map((input) => ({ input })),
    incorrect: [{ input: "definitely not in the declared vocabulary", reason: "value_wrong" }],
    malformed: [{ input: "", reason: "malformed_closed_vocabulary_text" }],
    unmarkable: [{ input: String.fromCharCode(7), reason: "expression_not_permitted" }],
  };
}

export function normalizeMarkerLexeme(value: string) {
  let output = stripMathWrapper(value)
    .replace(/^([A-Z])\.\s+/, "")
    .replace(/\\left|\\right/g, "")
    .replace(/\\(?:d?frac)\{([^{}]+)\}\{([^{}]+)\}/g, "$1/$2")
    .replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)")
    .replace(/\^\{([^{}]+)\}/g, "^$1")
    .replace(/\\,/g, "")
    .trim();
  if (output.startsWith("$") && output.endsWith("$")) output = output.slice(1, -1).trim();
  return output;
}

function normalizeFieldLexeme(candidate: ImportAnswerCandidate, value: string) {
  const normalized = normalizeMarkerLexeme(value);
  const type = candidate.type.toLowerCase();
  if (type === "exact") return normalized.replace(/^(?:m|gradient)\s*=\s*/i, "");
  if (type === "algebraic" && !/=/.test(candidate.correctAnswer)) {
    const expression = normalized.replace(/^(?:dy\s*\/\s*dx|f'\s*\(\s*x\s*\))\s*=\s*/i, "");
    const root = /^sqrt\((.+)\)$/.exec(expression);
    return root ? `(${root[1]})^(1/2)` : expression;
  }
  return normalized;
}

function detectCapability(question: ImportQuestionIR, candidate: ImportAnswerCandidate): RequiredCapability | undefined {
  const type = candidate.type.toLowerCase();
  const combined = candidate.correctAnswer;
  if (/graph|sketch/i.test(type) || /draw|sketch.*graph/i.test(question.questionText)) return "graph_response";
  if (!question.graphConfig && /diagram/i.test(question.questionText) && /diagram|shown|above|below/i.test(question.questionText)) return "prompt_diagram";
  if (/coordinate/.test(type) || /^\s*[\\($]\s*\(?\s*-?[\dx]/i.test(combined) && /,\s*-?[\dx]/i.test(combined)) return "structured_coordinate_pair";
  if (/interval|exact_list/.test(type) || /(?:≤|≥|<|>)|\\le|\\ge/.test(combined)) return "interval_set";
  if (/\+\s*[Cc]\b/.test(combined)) return "arbitrary_integration_constant";
  if (/text|nature|classification/.test(type)) return "closed_vocabulary_text_answer";
  if (/=/.test(combined) && (question.interactionType ?? "").toLowerCase() !== "multiple_choice") return "equation_form_answer";
  return undefined;
}

function detectMultiFieldCapability(question: ImportQuestionIR): RequiredCapability {
  const labels = question.answerCandidates.map((candidate) => `${candidate.id} ${candidate.label} ${candidate.type}`).join(" ").toLowerCase();
  if (/coordinate/.test(labels) && /nature|maximum|minimum|inflexion/.test(labels)) return "repeated_coordinate_nature_group";
  return "structured_multi_field_answer";
}

function inferUnsupportedAlgebraCapability(value: string): RequiredCapability | undefined {
  if (/=/.test(value)) return "equation_form_answer";
  if (/\+\s*[Cc]\b/.test(value)) return "arbitrary_integration_constant";
  if (/[()]/.test(value) || /\^-|\^\d+\/\d+|sqrt|\/[a-z]/i.test(value)) return "composite_algebraic_equivalence";
  return undefined;
}

function parseOptions(text: string): QuestionOption[] {
  return text.split("\n").map((line) => /^\s*([A-Z])\.\s+(.+?)\s*$/.exec(line)).filter((match): match is RegExpExecArray => Boolean(match)).map((match) => ({ label: match[2], value: match[1] }));
}

function resolveMultipleChoiceAuthority(value: string, options: QuestionOption[]) {
  const trimmed = value.trim();
  const direct = options.find((option) => option.value === trimmed);
  if (direct) return direct.value;
  const labelled = /^([A-Z])\.\s*([\s\S]+)$/.exec(trimmed);
  if (labelled) {
    const option = options.find((candidate) => candidate.value === labelled[1]);
    if (!option || normalizeOptionText(option.label) !== normalizeOptionText(labelled[2])) return undefined;
    return option.value;
  }
  const normalised = normalizeOptionText(trimmed);
  const matchingLabels = options.filter((option) => normalizeOptionText(option.label) === normalised);
  return matchingLabels.length === 1 ? matchingLabels[0].value : undefined;
}

function normalizeOptionText(value: string) {
  return normalizeMarkerLexeme(value).replace(/\s+/g, "");
}

function inferVariable(value: string) {
  return /[a-z]/i.exec(value.replace(/sqrt/gi, ""))?.[0].toLowerCase() ?? "x";
}

function authoredOrder(sourceOrder: string) {
  const match = /^(F|A|PPQ|Q)(\d{3})$/.exec(sourceOrder);
  const offset = match?.[1] === "F" || match?.[1] === "Q" ? 0 : match?.[1] === "A" ? 1000 : 2000;
  return offset + Number(match?.[2] ?? 0);
}

function impactForField(field: keyof Question): CollisionFieldDiff["likelyImpact"] {
  if (field === "id") return "identity";
  if (["questionVersion", "contentRevision"].includes(field)) return "version_fields";
  if (["skillPathId", "skillPath", "stageId", "stage", "courseArea", "specArea", "subject", "displayOrder"].includes(field)) return "placement";
  if (field === "acceptedAnswers") return "accepted_answers";
  if (["marking", "correctAnswer", "finalAnswer", "answerType", "options"].includes(field)) return "marking_strategy";
  if (["questionText", "marks", "calculatorAllowed", "skill"].includes(field)) return "assessment_meaning";
  if (["workedSolution", "hint", "commonMistake"].includes(field)) return "content_revision";
  if (field === "title") return "presentation";
  return "metadata";
}

function deriveVersionDecisions(
  existing: Question,
  proposed: Question,
  fields: CollisionFieldDiff[],
): CollisionDiff["availableVersionDecisions"] {
  if (!fields.length) return [];
  if (existing.skillPathId !== proposed.skillPathId) return [];
  const material = fields.filter((field) => field.likelyImpact !== "version_fields");
  if (!material.length) return [];
  const practiceRegrouping = material.every((field) =>
    ["stage", "stageId", "displayOrder"].includes(field.field) && field.likelyImpact === "placement") &&
    proposed.stage === "Practice";
  if (practiceRegrouping) return ["practice_regrouping_no_version_bump", "question_version_bump"];
  const questionVersionRequired = material.some((field) =>
    ["accepted_answers", "marking_strategy", "assessment_meaning", "placement", "identity"].includes(field.likelyImpact));
  return questionVersionRequired
    ? ["question_version_bump"]
    : ["content_revision_bump", "question_version_bump"];
}

function hasDuplicates(values: string[]) {
  return new Set(values).size !== values.length;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function diffValue(value: unknown) {
  return value === undefined ? null : value;
}

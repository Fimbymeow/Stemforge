export type QuestionSupportPresentation = {
  showHintPanel: boolean;
  showHintControl: boolean;
  showHintContent: boolean;
};

export function deriveQuestionSupportPresentation({
  hasHint,
  hintViewed,
  solutionViewed,
}: {
  hasHint: boolean;
  hintViewed: boolean;
  solutionViewed: boolean;
}): QuestionSupportPresentation {
  if (!hasHint || solutionViewed) {
    return {
      showHintPanel: false,
      showHintControl: false,
      showHintContent: false,
    };
  }
  return {
    showHintPanel: true,
    showHintControl: !hintViewed,
    showHintContent: hintViewed,
  };
}


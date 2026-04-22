import type { MirrorFeatures, MirrorSessionInput } from "../types/mirrorTypes.js";
import { resolveMirrorSessionId } from "../utils/mirrorSessionId.js";
import { extractAbstraction } from "./extractAbstraction.js";
import { extractCadence } from "./extractCadence.js";
import { extractHesitation } from "./extractHesitation.js";
import { extractRepetition } from "./extractRepetition.js";

export function analyzeText(input: MirrorSessionInput): MirrorFeatures {
  const repetition = extractRepetition(input);
  const cadence = extractCadence(input);
  const abstraction = extractAbstraction(input);
  const hesitation = extractHesitation(input);

  return {
    sessionId: resolveMirrorSessionId(input),
    wordCount: repetition.totalTokenCount,
    sentenceCount: cadence.sentenceCount,
    topRepeatedWords: [...repetition.topRepeatedWords],
    repetitionStats: {
      eligibleTokenCount: repetition.eligibleTokenCount,
      distinctEligibleTokenCount: repetition.distinctEligibleTokenCount
    },
    cadenceProfile: {
      avgSentenceLength: cadence.averageSentenceLengthWords,
      varianceSentenceLength: cadence.sentenceLengthVariance,
      shortSentenceCount: cadence.shortSentenceCount,
      longSentenceCount: cadence.longSentenceCount,
      endCompression: cadence.endCompression,
      endExpansion: cadence.endExpansion,
      meanSentenceLengthFirstQuarterWords: cadence.meanSentenceLengthFirstQuarterWords,
      meanSentenceLengthLastQuarterWords: cadence.meanSentenceLengthLastQuarterWords
    },
    abstractionProfile: {
      abstractCount: abstraction.abstractCount,
      concreteCount: abstraction.concreteCount,
      abstractConcreteRatio: abstraction.abstractConcreteRatio,
      shiftsTowardConcrete: abstraction.shiftsTowardConcrete,
      shiftsTowardAbstract: abstraction.shiftsTowardAbstract
    },
    hesitationProfile: {
      qualifierCount: hesitation.qualifierLexiconMatchCount,
      pivotCount: hesitation.pivotLexiconMatchCount,
      contradictionMarkers: hesitation.contradictionLexiconMatchCount,
      uncertaintyMarkers: hesitation.uncertaintyLexiconMatchCount
    }
  };
}

import { VoiceParsedExercise, Exercise } from '@/types';

const CONJUNCTIONS = /\b(?:then|and then|followed by|next|after that|also did|also)\b|,\s*(?=[a-z])/gi;

function fuzzyMatch(input: string, exercises: Exercise[]): { exercise: Exercise; score: number } | null {
  const normalized = input.toLowerCase().trim();
  if (!normalized) return null;

  let best: { exercise: Exercise; score: number } | null = null;

  for (const ex of exercises) {
    const name = ex.name.toLowerCase();

    if (name === normalized) return { exercise: ex, score: 1.0 };

    if (name.includes(normalized) || normalized.includes(name)) {
      const score = Math.min(normalized.length, name.length) / Math.max(normalized.length, name.length);
      if (!best || score > best.score) {
        best = { exercise: ex, score: Math.max(score, 0.7) };
      }
      continue;
    }

    const words = normalized.split(/\s+/);
    const nameWords = name.split(/\s+/);
    const matchedWords = words.filter((w) => nameWords.some((nw) => nw.includes(w) || w.includes(nw)));
    if (matchedWords.length > 0) {
      const score = matchedWords.length / Math.max(words.length, nameWords.length);
      if (score >= 0.4 && (!best || score > best.score)) {
        best = { exercise: ex, score };
      }
    }
  }

  return best;
}

function parseSegment(segment: string, exercises: Exercise[]): VoiceParsedExercise | null {
  const text = segment.trim().toLowerCase();
  if (text.length < 3) return null;

  let sets = 3;
  let reps = 10;
  let weight: number | undefined;
  let weightUnit: 'kg' | 'lbs' | undefined;
  let duration: number | undefined;

  const setsMatch = text.match(/(\d+)\s*sets?/);
  if (setsMatch) sets = parseInt(setsMatch[1]);

  const repsMatch = text.match(/(\d+)\s*reps?/) || text.match(/sets?\s*of\s*(\d+)/);
  if (repsMatch) reps = parseInt(repsMatch[1]);

  const weightMatch = text.match(/(?:at|@|with|for)\s*(\d+(?:\.\d+)?)\s*(lbs?|pounds?|kg|kilos?|kilogram)?/);
  if (weightMatch) {
    weight = parseFloat(weightMatch[1]);
    const unit = weightMatch[2];
    weightUnit = unit ? (unit.startsWith('k') ? 'kg' : 'lbs') : undefined;
  }

  if (!weightMatch) {
    const standaloneWeight = text.match(/(\d+(?:\.\d+)?)\s*(lbs?|pounds?|kg|kilos?|kilogram)/);
    if (standaloneWeight) {
      weight = parseFloat(standaloneWeight[1]);
      weightUnit = standaloneWeight[2].startsWith('k') ? 'kg' : 'lbs';
    }
  }

  const durationMatch = text.match(/(\d+)\s*(min(?:utes?)?|sec(?:onds?)?|hours?)/);
  if (durationMatch) {
    const val = parseInt(durationMatch[1]);
    const unit = durationMatch[2];
    if (unit.startsWith('h')) duration = val * 3600;
    else if (unit.startsWith('m')) duration = val * 60;
    else duration = val;
  }

  let exerciseName = text
    .replace(/(\d+)\s*sets?\s*(of\s*\d+)?/g, '')
    .replace(/(\d+)\s*reps?/g, '')
    .replace(/(?:at|@|with|for)\s*\d+(?:\.\d+)?\s*(?:lbs?|pounds?|kg|kilos?|kilogram)?/g, '')
    .replace(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg|kilos?|kilogram)/g, '')
    .replace(/(\d+)\s*(?:min(?:utes?)?|sec(?:onds?)?|hours?)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const match = fuzzyMatch(exerciseName, exercises);

  return {
    exerciseName: match ? match.exercise.name : exerciseName,
    matchedExerciseId: match?.exercise.id,
    sets,
    reps,
    weight,
    weightUnit,
    duration,
    confidence: match?.score ?? 0.3,
  };
}

export function parseVoiceInput(transcript: string, exercises: Exercise[]): VoiceParsedExercise[] {
  const segments = transcript.split(CONJUNCTIONS).filter((s) => s && s.trim().length > 2);
  const results: VoiceParsedExercise[] = [];

  for (const segment of segments) {
    const parsed = parseSegment(segment, exercises);
    if (parsed) results.push(parsed);
  }

  return results;
}

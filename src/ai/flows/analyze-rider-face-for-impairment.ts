'use server';
/**
 * @fileOverview Analyzes a rider's face for signs of impairment (intoxication, fatigue).
 *
 * - analyzeRiderFaceForImpairment - A function that handles the face analysis process.
 * - AnalyzeRiderFaceForImpairmentInput - The input type for the analyzeRiderFaceForImpairment function.
 * - AnalyzeRiderFaceForImpairmentOutput - The return type for the analyzeRiderFaceForImpairment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeRiderFaceForImpairmentInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the rider's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeRiderFaceForImpairmentInput = z.infer<
  typeof AnalyzeRiderFaceForImpairmentInputSchema
>;

const AnalyzeRiderFaceForImpairmentOutputSchema = z.object({
  intoxicationDetected: z
    .boolean()
    .describe('Whether or not intoxication is detected in the rider.'),
  fatigueDetected: z
    .boolean()
    .describe('Whether or not fatigue is detected in the rider.'),
  stressDetected: z
    .boolean()
    .describe(
      'Whether or not signs of high stress are detected (e.g., facial tension, furrowed brow).'
    ),
  blinkInstructionFollowed: z
    .boolean()
    .describe(
      'Whether it appears the rider followed the instruction to blink. If eyes are closed, this is likely true.'
    ),
  eyeScleraRednessScore: z
    .number()
    .describe(
      'A score indicating the level of eye sclera redness, a potential sign of intoxication or illness.'
    ),
  facialDroopingDetected: z
    .boolean()
    .describe(
      'Whether or not facial drooping is detected, indicative of dangerous fatigue levels.'
    ),
  microNodsDetected: z
    .boolean()
    .describe('Whether or not micro nods are detected, indicative of fatigue.'),
  pupilReactivityScore: z
    .number()
    .describe(
      'A score indicating the pupil reactivity, where lower reactivity may indicate impairment from intoxication.'
    ),
  feverDetected: z
    .boolean()
    .describe(
      'Whether signs of fever are detected (e.g., flushed skin, excessive sweating).'
    ),
  eyewearDetected: z
    .boolean()
    .describe('Whether the rider is wearing glasses or sunglasses.'),
  mood: z
    .string()
    .describe(
      'The detected mood of the rider (e.g., neutral, happy, sad, angry).'
    ),
});
export type AnalyzeRiderFaceForImpairmentOutput = z.infer<
  typeof AnalyzeRiderFaceForImpairmentOutputSchema
>;

export async function analyzeRiderFaceForImpairment(
  input: AnalyzeRiderFaceForImpairmentInput
): Promise<AnalyzeRiderFaceForImpairmentOutput> {
  return analyzeRiderFaceForImpairmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeRiderFaceForImpairmentPrompt',
  input: {schema: AnalyzeRiderFaceForImpairmentInputSchema},
  output: {schema: AnalyzeRiderFaceForImpairmentOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing facial features for signs of rider impairment, including intoxication, fatigue, stress, and illness like fever. The rider was instructed to blink slowly during the scan and to hold a gentle smile for a better emotional baseline.

**Important Environmental Context:** The riders being analyzed are in India. Environmental factors, particularly high air pollution in major cities (e.g., Delhi, Mumbai), can cause eye redness that is not related to intoxication. You must factor this into your analysis. Do not overweight eye redness as a definitive sign of intoxication; you must correlate it with other signals (like pupil reactivity or behavioral indicators) before making a determination.

Your primary goal is to assess the rider's fitness to operate a vehicle based on the provided image.

Analyze the image and determine the following:

- **Blink Instruction Compliance**: Assess if the rider appears to be following the instruction to blink. If their eyes are closed, it's highly probable they are in mid-blink; set \`blinkInstructionFollowed\` to true. If their eyes are wide open, especially with signs of strain, they may be avoiding blinking to stay awake; consider setting \`blinkInstructionFollowed\` to false.

- **Fatigue Detection**: This is a critical assessment. Use blink compliance as a primary signal. If \`blinkInstructionFollowed\` is false, it strongly suggests fatigue. Also, look for secondary indicators like facial drooping and micro-nods. Set \`fatigueDetected\` based on this combined analysis.

- **Intoxication Detection**: Analyze for signs of intoxication. Use the \`pupilReactivityScore\` and \`eyeScleraRednessScore\` as key indicators. Low pupil reactivity and high redness can suggest intoxication. **Remember to consider the environmental context for eye redness.**

- **Stress Detection**: Analyze for signs of high stress, such as facial tension, a furrowed brow, or a clenched jaw. Set \`stressDetected\` accordingly.

- **Fever Detection**: Look for physical signs of fever like flushed skin, excessive sweating, or glassy-looking eyes.

- **Eyewear & Mood**: Identify if the rider is wearing any eyewear and determine their general mood based on their expression (e.g., neutral, happy, angry).

Here is the rider's facial image: {{media url=photoDataUri}}

Please output your analysis in JSON format. Set the boolean fields to true if the condition is detected, and false otherwise. Provide a score from 0-1 for eyeScleraRednessScore and pupilReactivityScore.
  `,
});

const analyzeRiderFaceForImpairmentFlow = ai.defineFlow(
  {
    name: 'analyzeRiderFaceForImpairmentFlow',
    inputSchema: AnalyzeRiderFaceForImpairmentInputSchema,
    outputSchema: AnalyzeRiderFaceForImpairmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

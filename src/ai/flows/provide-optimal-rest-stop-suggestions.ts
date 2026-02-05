'use server';
/**
 * @fileOverview An AI agent that provides optimal rest stop suggestions for blocked riders.
 *
 * - provideOptimalRestStopSuggestions - A function that handles the rest stop suggestion process.
 * - ProvideOptimalRestStopSuggestionsInput - The input type for the provideOptimalRestStopSuggestions function.
 * - ProvideOptimalRestStopSuggestionsOutput - The return type for the provideOptimalRestStopSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideOptimalRestStopSuggestionsInputSchema = z.object({
  riderLocation: z.string().describe('The current location of the rider.'),
  availableFacilities: z.array(z.string()).describe('A list of available facilities at nearby rest stops.'),
  predictedWaitTimes: z.record(z.string(), z.number()).describe('A map of rest stop IDs to predicted wait times in minutes.'),
});
export type ProvideOptimalRestStopSuggestionsInput = z.infer<typeof ProvideOptimalRestStopSuggestionsInputSchema>;

const ProvideOptimalRestStopSuggestionsOutputSchema = z.object({
  optimalRestStop: z.string().describe('The ID of the optimal rest stop.'),
  reasoning: z.string().describe('The reasoning behind the rest stop suggestion.'),
  voucherCode: z.string().describe('A digital voucher code for a hydration break.'),
});
export type ProvideOptimalRestStopSuggestionsOutput = z.infer<typeof ProvideOptimalRestStopSuggestionsOutputSchema>;

export async function provideOptimalRestStopSuggestions(input: ProvideOptimalRestStopSuggestionsInput): Promise<ProvideOptimalRestStopSuggestionsOutput> {
  return provideOptimalRestStopSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'provideOptimalRestStopSuggestionsPrompt',
  input: {schema: ProvideOptimalRestStopSuggestionsInputSchema},
  output: {schema: ProvideOptimalRestStopSuggestionsOutputSchema},
  prompt: `You are an AI assistant that suggests the optimal rest stop for a rider based on their location, available facilities, and predicted wait times.

Rider Location: {{{riderLocation}}}
Available Facilities: {{#each availableFacilities}}{{{this}}}, {{/each}}
Predicted Wait Times (JSON): {{{predictedWaitTimesJson}}}

You must select only one rest stop.

Return a structured response that matches the output schema.`,
});

const provideOptimalRestStopSuggestionsFlow = ai.defineFlow(
  {
    name: 'provideOptimalRestStopSuggestionsFlow',
    inputSchema: ProvideOptimalRestStopSuggestionsInputSchema,
    outputSchema: ProvideOptimalRestStopSuggestionsOutputSchema,
  },
  async input => {
    // Generate a voucher code (example: replace with actual voucher generation logic)
    const voucherCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const predictedWaitTimesJson = JSON.stringify(input.predictedWaitTimes);
    const {output} = await prompt({...input, voucherCode, predictedWaitTimesJson});
    return output!;
  }
);

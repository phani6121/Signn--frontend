import type { translations } from './translations';
type TranslationKey = keyof typeof translations;

export type BehavioralQuestion = {
    id: string;
    questionKey: TranslationKey;
    options: { value: 'a' | 'b', key: TranslationKey }[];
    correctAnswer: 'a' | 'b';
};

export const behavioralQuestions: BehavioralQuestion[] = [
    {
        id: 'spillout',
        questionKey: 'q_spillout_text',
        options: [
            { value: 'a', key: 'q_spillout_option_a' }, // Correct: Inform support, check if salvageable.
            { value: 'b', key: 'q_spillout_option_b' }  // Incorrect: Ignore it and deliver anyway.
        ],
        correctAnswer: 'a'
    },
    {
        id: 'pickup_delay',
        questionKey: 'q_pickup_delay_text',
        options: [
            { value: 'a', key: 'q_pickup_delay_option_a' }, // Correct: Inform the customer and support about the delay.
            { value: 'b', key: 'q_pickup_delay_option_b' }  // Incorrect: Wait silently and hope it gets ready soon.
        ],
        correctAnswer: 'a'
    },
    {
        id: 'traffic',
        questionKey: 'q_traffic_text',
        options: [
            { value: 'a', key: 'q_traffic_option_a' }, // Correct: Inform the customer of a potential delay.
            { value: 'b', key: 'q_traffic_option_b' }  // Incorrect: Try to make up time by speeding.
        ],
        correctAnswer: 'a'
    },
    {
        id: 'bike_breakdown',
        questionKey: 'q_bike_breakdown_text',
        options: [
            { value: 'a', key: 'q_bike_breakdown_option_a' }, // Correct: Pull over safely and contact rider support immediately.
            { value: 'b', key: 'q_bike_breakdown_option_b' }  // Incorrect: Try to fix it yourself on the side of a busy road.
        ],
        correctAnswer: 'a'
    },
    {
        id: 'wrong_route',
        questionKey: 'q_wrong_route_text',
        options: [
            { value: 'a', key: 'q_wrong_route_option_a' }, // Correct: Stop safely, re-route using the app, and proceed.
            { value: 'b', key: 'q_wrong_route_option_b' }  // Incorrect: Continue in the wrong direction hoping for a shortcut.
        ],
        correctAnswer: 'a'
    },
    {
        id: 'signal_jumping',
        questionKey: 'q_signal_jumping_text',
        options: [
            { value: 'a', key: 'q_signal_jumping_option_a' }, // Correct: Wait for the signal to turn green.
            { value: 'b', key: 'q_signal_jumping_option_b' }  // Incorrect: Jump the signal if no police are visible.
        ],
        correctAnswer: 'a'
    },
    {
        id: 'cust_support',
        questionKey: 'q_cust_support_text',
        options: [
            { value: 'a', key: 'q_cust_support_option_a' }, // Correct: For accidents, order issues, or app problems.
            { value: 'b', key: 'q_cust_support_option_b' }  // Incorrect: To ask for directions to the customer's house.
        ],
        correctAnswer: 'a'
    },
    {
        id: 'reject_pickup',
        questionKey: 'q_reject_pickup_text',
        options: [
            { value: 'a', key: 'q_reject_pickup_option_a' }, // Correct: If the packaging is damaged or leaking.
            { value: 'b', key: 'q_reject_pickup_option_b' }  // Incorrect: If you don't like the type of food.
        ],
        correctAnswer: 'a'
    },
    {
        id: 'packaging',
        questionKey: 'q_packaging_text',
        options: [
            { value: 'a', key: 'q_packaging_option_a' }, // Correct: To ensure it is secure and not leaking before starting the trip.
            { value: 'b', key: 'q_packaging_option_b' }  // Incorrect: Only if the customer complains about it later.
        ],
        correctAnswer: 'a'
    },
    {
        id: 'location_accuracy',
        questionKey: 'q_location_accuracy_text',
        options: [
            { value: 'a', key: 'q_location_accuracy_option_a' }, // Correct: Call the customer to confirm their location if the pin seems wrong.
            { value: 'b', key: 'q_location_accuracy_option_b' }  // Incorrect: Leave the order at the pin location and mark as delivered.
        ],
        correctAnswer: 'a'
    },
    {
        id: 'helmet_safety',
        questionKey: 'q_helmet_safety_text',
        options: [
            { value: 'a', key: 'q_helmet_safety_option_a' }, // Correct: Always wear a helmet that is securely fastened.
            { value: 'b', key: 'q_helmet_safety_option_b' }  // Incorrect: Only wear a helmet when you see police.
        ],
        correctAnswer: 'a'
    },
    {
        id: 'no_smoking',
        questionKey: 'q_no_smoking_text',
        options: [
            { value: 'a', key: 'q_no_smoking_option_a' }, // Correct: No, it is unsafe and strictly prohibited.
            { value: 'b', key: 'q_no_smoking_option_b' }  // Incorrect: Yes, if you are careful and it doesn't distract you.
        ],
        correctAnswer: 'a'
    }
];

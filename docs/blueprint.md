# **App Name**: Signn Gatekeeper

## Core Features:

- Shift Check Initiation: Riders initiate the shift check via a deep link from the partner app.
- AI Vision Analysis: Uses Vertex AI for Firebase to analyze rider's face for impairment (intoxication, fatigue).
- Cognitive Pulse Test: A gamified reaction time test to assess cognitive readiness.
- Authority Engine: Cloud Functions evaluate shift check data against the baseline to determine readiness status (Green, Yellow, Red).
- Readiness Ledger: Firestore database stores all shift check data and authority tokens.
- Manager Dashboard: Desktop dashboard for operations and risk teams with a real-time readiness map and compliance ledger.
- Rest Incentive Program: Display nearby rest zones and hydration voucher upon shift block to incentivize rider care.  An LLM tool could be used to find optimal rest stop locations given various factors.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5), evoking trust, safety, and authority in alignment with the app's function.
- Background color: Light gray (#EEEEEE), provides a neutral backdrop.
- Accent color: Teal (#009688), used for interactive elements and important notifications.
- Body and headline font: 'Inter' (sans-serif), offering a modern, objective look suitable for both desktop and mobile interfaces.
- Use clear, standard icons for status (Green/Yellow/Red), notifications, and menu items.
- Mobile-first, ultra-lightweight design for the rider app; high-security desktop layout for the manager dashboard.
- Subtle animations to guide users through the shift check process and provide feedback.
export interface Technique {
  id: string;
  name: string;
  subtitle: string;
  duration: string;
  category: "breathing" | "grounding" | "physical" | "cognitive" | "social" | "sensory";
  steps: string[];
  science: string;
  bestFor: string[];
}

export const techniques: Technique[] = [
  {
    id: "box-breathing",
    name: "Box Breathing",
    subtitle: "Navy SEAL technique to calm your nervous system",
    duration: "60 sec",
    category: "breathing",
    steps: [
      "Inhale through your nose for 4 seconds",
      "Hold your breath for 4 seconds",
      "Exhale through your mouth for 4 seconds",
      "Hold empty for 4 seconds",
      "Repeat 4 times",
    ],
    science: "Activates the parasympathetic nervous system, lowering cortisol and heart rate within 60 seconds.",
    bestFor: ["anxious", "stressed", "urgent"],
  },
  {
    id: "5-4-3-2-1",
    name: "5-4-3-2-1 Grounding",
    subtitle: "A sensory anchor for acute urges",
    duration: "60 sec",
    category: "grounding",
    steps: [
      "See: Name 5 things you can see",
      "Touch: Name 4 things you can feel",
      "Hear: Name 3 things you can hear",
      "Smell: Name 2 things you can smell",
      "Taste: Name 1 thing you can taste",
    ],
    science: "Forces your brain to shift from emotional (amygdala) to sensory (cortex) processing, disrupting the urge loop.",
    bestFor: ["anxious", "urgent", "overwhelmed"],
  },
  {
    id: "cold-water",
    name: "Cold Water Splash",
    subtitle: "The mammalian dive reflex",
    duration: "30 sec",
    category: "sensory",
    steps: [
      "Splash cold water on your face and wrists",
      "Take 3 slow, deep breaths",
      "Notice the physical sensation",
    ],
    science: "Cold water triggers the mammalian dive reflex, immediately slowing heart rate and activating the vagus nerve.",
    bestFor: ["urgent", "overwhelmed", "angry"],
  },
  {
    id: "urge-surfing",
    name: "Urge Surfing",
    subtitle: "Ride the wave without acting on it",
    duration: "90 sec",
    category: "cognitive",
    steps: [
      "Close your eyes and notice where the urge lives in your body",
      "Breathe into that area",
      "Observe the sensation without judgment",
      "Notice how it changes moment to moment",
      "Watch it peak and subside like a wave",
    ],
    science: "Urges follow a wave pattern — they peak at 20-30 minutes then subside. Observing without acting re-wires the neural pathway.",
    bestFor: ["urgent", "stressed", "bored"],
  },
  {
    id: "push-ups",
    name: "Push-ups to Failure",
    subtitle: "Physical displacement of nervous energy",
    duration: "45 sec",
    category: "physical",
    steps: [
      "Drop and do as many push-ups as you can",
      "Rest 10 seconds",
      "Do one more set",
      "Notice how your focus has shifted",
    ],
    science: "Intense exercise releases dopamine and endorphins through a healthy pathway, replacing the anticipated reward from acting on the urge.",
    bestFor: ["angry", "stressed", "restless"],
  },
  {
    id: "journal-dump",
    name: "Journal Dump",
    subtitle: "Get it out of your head",
    duration: "120 sec",
    category: "cognitive",
    steps: [
      "Open the journal or grab a piece of paper",
      "Write everything you're feeling right now",
      "Don't filter — just write",
      "Read it back to yourself",
      "Close it and take a breath",
    ],
    science: "Externalizing thoughts reduces cognitive load. Writing disrupts the rumination loop and activates the prefrontal cortex.",
    bestFor: ["overwhelmed", "anxious", "lonely"],
  },
  {
    id: "change-scenery",
    name: "Change Scenery",
    subtitle: "Disrupt the environment trigger",
    duration: "60 sec",
    category: "physical",
    steps: [
      "Stand up immediately",
      "Walk to a different room",
      "If possible, go outside",
      "Take 5 deep breaths in the new space",
    ],
    science: "Environmental cues are powerful triggers. Physically moving to a new location breaks the associative link between context and behavior.",
    bestFor: ["bored", "restless", "urgent"],
  },
  {
    id: "text-friend",
    name: "Text an Accountability Partner",
    subtitle: "Social connection breaks isolation",
    duration: "60 sec",
    category: "social",
    steps: [
      "Open a conversation with someone you trust",
      "Send: 'I'm having an urge right now'",
      "Wait for their response",
      "Read their message before acting",
    ],
    science: "Social connection releases oxytocin, which counteracts stress. Naming the urge to another person reduces its power.",
    bestFor: ["lonely", "sad", "overwhelmed"],
  },
  {
    id: "10-minute-rule",
    name: "10-Minute Delay",
    subtitle: "The urge will pass if you let it",
    duration: "600 sec",
    category: "cognitive",
    steps: [
      "Tell yourself: 'I can act on this in 10 minutes'",
      "Set a timer for 10 minutes",
      "Do something else entirely",
      "When the timer goes off, reassess",
    ],
    science: "The prefrontal cortex needs time to override the limbic system. A 10-minute delay is enough for the initial urge intensity to drop by 50%.",
    bestFor: ["urgent", "bored", "restless"],
  },
  {
    id: "music-reset",
    name: "Music Reset",
    subtitle: "Use rhythm to regulate your state",
    duration: "180 sec",
    category: "sensory",
    steps: [
      "Put on headphones",
      "Play a song that matches how you feel",
      "Then play a song that shifts your energy",
      "Focus on the instruments, not the thoughts",
    ],
    science: "Music synchronizes brainwave activity. Upbeat music increases dopamine through anticipation, not acting on urges.",
    bestFor: ["sad", "lonely", "stressed"],
  },
];

export function getTechniquesForMood(mood: string): Technique[] {
  const sorted = [...techniques].sort((a, b) => {
    const aScore = a.bestFor.includes(mood) ? 1 : 0;
    const bScore = b.bestFor.includes(mood) ? 1 : 0;
    return bScore - aScore;
  });
  return sorted.slice(0, 3);
}

export function getTechniqueById(id: string): Technique | undefined {
  return techniques.find((t) => t.id === id);
}

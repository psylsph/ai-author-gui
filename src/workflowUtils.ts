import { WorkflowStep, Chapter, StoryConfig } from './types';

export const STEP_NAMES = {
  1: "Brainstorm & Reflection",
  2: "Intention & Chapter Planning",
  3: "Human vs LLM Critique",
  4: "Final Plan",
  5: "Character Development"
};

export const STEP_FILENAMES = {
  1: "01_brainstorm_and_reflection.md",
  2: "02_intention_and_chapter_planning.md",
  3: "03_human_vs_llm_critique.md",
  4: "04_final_plan.md",
  5: "05_characters.md",
};

export const CHAPTER_WORD_TARGET = 3000;
export const CHAPTER_MIN_WORDS = CHAPTER_WORD_TARGET;
export const CHAPTER_MAX_ATTEMPTS = 3;

export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
}

export function buildStep1Prompt(storyPrompt: string): string {
  return `Initial Writing Prompt:
${storyPrompt}
--
Your task is to create a writing plan for this prompt. The scope will be a short story; do not assume a fixed number of chapters yet.
Your plan should be comprehensive and in this format:
# Brainstorming
<Brainstorm ideas for characters, plot, tone, story beats, and possible pacing. The purpose of brainstorming is to cast a wide net of ideas, not to settle on any specific direction.
Think about various ways you could take the prompt.>
# Reflection
<Reflect out loud on what works and doesn't work in these ideas. The purpose of this reflection is to narrow in on what you think will work best to make a piece that is a. compelling, and b. fits the prompt requirements.
You are not making any decisions just yet, just reflecting.>
Finally, propose the ideal number of chapters for this short story based on the prompt and your analysis.
Output a single line at the end in this exact format so it can be parsed reliably:
CHAPTER_COUNT: <integer>`;
}

export function buildFollowupPrompts(chapterCount: number): string[] {
  const p2 = `Great now let's continue with planning the short story. Output in this format:
# Intention
<State your formulated intentions for the piece, synthesised from the the parts of the brainstorming session that worked, and avoiding the parts that didn't.
Be explicit about the choices you have made about plot, voice, stylistic choices, things you intend to aim for & avoid.>
# Chapter Planning
<Write a brief chapter plan for all ${chapterCount} chapters.>`;

  const p3 = `With a view to making the writing more human, discuss how a human might approach this particular piece (given the original prompt).
Discuss telltale LLM approaches to writing (generally) and ways they might not serve this particular piece. For example, common LLM failings are to write safely, or to always wrap things up with a bow, or trying to write impressively at the expense of readability.
Then do a deep dive on the intention & plan, critiquing ways it might be falling into typical LLM tropes & pitfalls. Brainstorm ideas to make it more human. Be comprehensive. We aren't doing any rewriting of the plan yet, just critique & brainstorming.`;

  const p4 = `Ok now with these considerations in mind, formulate the final plan for the a human like, compelling short piece in ${chapterCount} chapters. Bear in mind the constraints of the piece (each chapter is just 3000 words).
Above all things, the plan must serve the original prompt. We will use the same format as before:
# Intention
<State your formulated intentions for the piece, synthesised from the the parts of the brainstorming session that worked, and avoiding the parts that didn't.
Be explicit about the choices you have made about plot, voice, stylistic choices, things you intend to aim for & avoid.>
# Chapter Planning
<Write a brief chapter plan for all ${chapterCount} chapters.>`;

  const p5 = `Perfect. Now with the outline more crystallised, and bearing in mind the discussion on human writing vs LLM pitfalls, we will flesh out our characters. Lets go through each of our main characters:
- Write about their background, personality, idiosyncrasies, flaws. Be specific and come up with examples to anchor & ground the character's profile (both core and trivial)
- Briefly describe their physicality: appearance, how they carry themselves, express, interact with the world.
- Concisely detail their motives, allegiances and existing relationships. Think from the perspective of the character as a real breathing thinking feeling individual in this world.
- Write a couple quotes of flavour dialogue / internal monologue from the character to experiment with their voice.
Output like this:
# Character 1 name
<character exploration>
# Character 2 name
<character exploration>
 etc`;

  return [p2, p3, p4, p5];
}

export function parseProposedChapters(text: string): number | null {
  const lines = text.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim().replace(/\*/g, '');
    const upperLine = line.toUpperCase();
    if (upperLine.includes('CHAPTER_COUNT:')) {
      const parts = line.split(':');
      if (parts.length === 2) {
        const num = parts[1].trim();
        const parsed = parseInt(num, 10);
        return isNaN(parsed) ? null : parsed;
      }
    }
  }
  return null;
}

export function chapterPrompt(chapterIndex: number, chapterCount: number): string {
  const baseIntro = `Write Chapter ${chapterIndex} of the story, following the approved plan and prior chapters.
- Produce at least ${CHAPTER_MIN_WORDS} words of narrative prose.
- Count only the words in your final story text; do not include planning notes or analysis.
- Output only the polished chapter text (you may open with a 'Chapter ${chapterIndex}' heading if that matches the style), and do not mention the word count or include any commentary.`;

  if (chapterIndex === 1) {
    return `Great. Let's begin the story.\n${baseIntro}`;
  }
  return `Continue with the next installment.\n${baseIntro}`;
}

export function createInitialSteps(): WorkflowStep[] {
  return [
    { id: 1, name: STEP_NAMES[1], content: '', completed: false },
    { id: 2, name: STEP_NAMES[2], content: '', completed: false },
    { id: 3, name: STEP_NAMES[3], content: '', completed: false },
    { id: 4, name: STEP_NAMES[4], content: '', completed: false },
    { id: 5, name: STEP_NAMES[5], content: '', completed: false },
  ];
}

export function createInitialChapters(count: number): Chapter[] {
  const chapters: Chapter[] = [];
  for (let i = 1; i <= count; i++) {
    chapters.push({
      id: i,
      content: '',
      wordCount: 0,
      completed: false
    });
  }
  return chapters;
}

export function createDefaultConfig(): StoryConfig {
  return {
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    temperature: undefined,
    apiKey: '',
    baseUrl: 'https://openrouter.ai/api/v1',
    stream: true
  };
}
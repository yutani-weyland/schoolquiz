/**
 * Question Templates
 * Pre-filled forms for common question types
 */

export interface QuestionTemplate {
  id: string
  name: string
  description: string
  category?: string
  template: {
    text: string // Template with placeholders like {{variable}}
    answer: string
    explanation?: string
    variables?: Record<string, {
      label: string
      type: 'text' | 'number' | 'date' | 'option'
      options?: string[] // For 'option' type
      placeholder?: string
    }>
  }
  example?: {
    text: string
    answer: string
    explanation?: string
  }
}

export const QUESTION_TEMPLATES: QuestionTemplate[] = [
  {
    id: 'trivia-basic',
    name: 'Basic Trivia',
    description: 'Simple question with answer',
    template: {
      text: '{{question}}',
      answer: '{{answer}}',
      explanation: '{{explanation}}',
      variables: {
        question: { label: 'Question', type: 'text', placeholder: 'What is...?' },
        answer: { label: 'Answer', type: 'text', placeholder: 'The answer' },
        explanation: { label: 'Explanation (optional)', type: 'text', placeholder: 'Additional context' },
      },
    },
    example: {
      text: 'What is the capital of France?',
      answer: 'Paris',
      explanation: 'Paris has been the capital since 987 AD.',
    },
  },
  {
    id: 'year-history',
    name: 'Year/History',
    description: 'When did something happen?',
    template: {
      text: 'In what year did {{event}} occur?',
      answer: '{{year}}',
      explanation: '{{context}}',
      variables: {
        event: { label: 'Event', type: 'text', placeholder: 'World War II end' },
        year: { label: 'Year', type: 'number', placeholder: '1945' },
        context: { label: 'Context (optional)', type: 'text', placeholder: 'Additional details' },
      },
    },
    example: {
      text: 'In what year did World War II end?',
      answer: '1945',
      explanation: 'The war ended on September 2, 1945.',
    },
  },
  {
    id: 'person-who',
    name: 'Who/Person',
    description: 'Who did something or who is...',
    template: {
      text: 'Who {{action}}?',
      answer: '{{person}}',
      explanation: '{{context}}',
      variables: {
        action: { label: 'Action/Description', type: 'text', placeholder: 'was the first President of the United States' },
        person: { label: 'Person', type: 'text', placeholder: 'George Washington' },
        context: { label: 'Context (optional)', type: 'text', placeholder: 'Additional details' },
      },
    },
    example: {
      text: 'Who was the first President of the United States?',
      answer: 'George Washington',
      explanation: 'He served from 1789 to 1797.',
    },
  },
  {
    id: 'location-where',
    name: 'Where/Location',
    description: 'Where is something located?',
    template: {
      text: 'Where is {{location}} located?',
      answer: '{{place}}',
      explanation: '{{context}}',
      variables: {
        location: { label: 'Location/Landmark', type: 'text', placeholder: 'Mount Everest' },
        place: { label: 'Answer (Place)', type: 'text', placeholder: 'Nepal/China border' },
        context: { label: 'Context (optional)', type: 'text', placeholder: 'Additional details' },
      },
    },
    example: {
      text: 'Where is Mount Everest located?',
      answer: 'Nepal/China border',
      explanation: 'It sits on the border between Nepal and Tibet.',
    },
  },
  {
    id: 'definition-what',
    name: 'What/Definition',
    description: 'What is something or define it',
    template: {
      text: 'What is {{term}}?',
      answer: '{{definition}}',
      explanation: '{{context}}',
      variables: {
        term: { label: 'Term/Concept', type: 'text', placeholder: 'photosynthesis' },
        definition: { label: 'Definition/Answer', type: 'text', placeholder: 'The process by which plants convert light into energy' },
        context: { label: 'Context (optional)', type: 'text', placeholder: 'Additional details' },
      },
    },
    example: {
      text: 'What is photosynthesis?',
      answer: 'The process by which plants convert light into energy',
      explanation: 'It occurs in the chloroplasts of plant cells.',
    },
  },
  {
    id: 'math-calculation',
    name: 'Math/Calculation',
    description: 'Mathematical question',
    template: {
      text: 'What is {{calculation}}?',
      answer: '{{result}}',
      explanation: '{{method}}',
      variables: {
        calculation: { label: 'Calculation', type: 'text', placeholder: '15% of 200' },
        result: { label: 'Result', type: 'text', placeholder: '30' },
        method: { label: 'Method (optional)', type: 'text', placeholder: '15% of 200 = 0.15 × 200 = 30' },
      },
    },
    example: {
      text: 'What is 15% of 200?',
      answer: '30',
      explanation: '15% of 200 = 0.15 × 200 = 30',
    },
  },
  {
    id: 'multiple-choice',
    name: 'Multiple Choice',
    description: 'Question with multiple options (answer is the correct one)',
    template: {
      text: '{{question}} (A) {{optionA}} (B) {{optionB}} (C) {{optionC}} (D) {{optionD}}',
      answer: '{{correctOption}}',
      explanation: '{{context}}',
      variables: {
        question: { label: 'Question', type: 'text', placeholder: 'Which planet is closest to the Sun?' },
        optionA: { label: 'Option A', type: 'text', placeholder: 'Mercury' },
        optionB: { label: 'Option B', type: 'text', placeholder: 'Venus' },
        optionC: { label: 'Option C', type: 'text', placeholder: 'Earth' },
        optionD: { label: 'Option D', type: 'text', placeholder: 'Mars' },
        correctOption: { label: 'Correct Answer', type: 'option', options: ['A', 'B', 'C', 'D'] },
        context: { label: 'Context (optional)', type: 'text', placeholder: 'Additional details' },
      },
    },
    example: {
      text: 'Which planet is closest to the Sun? (A) Mercury (B) Venus (C) Earth (D) Mars',
      answer: 'A) Mercury',
      explanation: 'Mercury is the closest planet to the Sun.',
    },
  },
  {
    id: 'true-false',
    name: 'True/False',
    description: 'True or false question',
    template: {
      text: 'True or False: {{statement}}',
      answer: '{{answer}}',
      explanation: '{{reason}}',
      variables: {
        statement: { label: 'Statement', type: 'text', placeholder: 'The Earth is flat' },
        answer: { label: 'Answer', type: 'option', options: ['True', 'False'] },
        reason: { label: 'Reason (optional)', type: 'text', placeholder: 'The Earth is spherical' },
      },
    },
    example: {
      text: 'True or False: The Earth is flat',
      answer: 'False',
      explanation: 'The Earth is spherical (oblate spheroid).',
    },
  },
]

/**
 * Fill template with values
 */
export function fillTemplate(template: QuestionTemplate, values: Record<string, string>): {
  text: string
  answer: string
  explanation?: string
} {
  let text = template.template.text
  let answer = template.template.answer
  let explanation = template.template.explanation || ''

  // Replace all variables
  Object.entries(values).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    text = text.replace(regex, value || '')
    answer = answer.replace(regex, value || '')
    if (explanation) {
      explanation = explanation.replace(regex, value || '')
    }
  })

  // Clean up any remaining placeholders
  text = text.replace(/\{\{[^}]+\}\}/g, '').trim()
  answer = answer.replace(/\{\{[^}]+\}\}/g, '').trim()
  explanation = explanation.replace(/\{\{[^}]+\}\}/g, '').trim()

  return {
    text,
    answer,
    explanation: explanation || undefined,
  }
}


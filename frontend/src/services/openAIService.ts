import { ConversationQuestion } from '../components/SpeechInNoiseTest';

const AZURE_OPENAI_KEY = import.meta.env.VITE_AZURE_OPENAI_KEY || '';
const AZURE_OPENAI_ENDPOINT = 'https://ng7g22-ai.openai.azure.com/';
const AZURE_OPENAI_MODEL = 'gpt-35-turbo';

export const generateSpeechInNoiseQuestions = async (count: number = 5): Promise<ConversationQuestion[]> => {
  try {
    // Check if API key is available
    if (!AZURE_OPENAI_KEY) {
      console.error('Azure OpenAI API key is missing');
      return getDefaultQuestions();
    }

    const response = await fetch(`${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_MODEL}/chat/completions?api-version=2023-05-15`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that generates conversation scenarios for hearing tests. Generate realistic conversations between two people in various settings. Each conversation must have exactly two speakers: one male and one female.

CRITICAL RULES:
1. The woman speaker should always be the first speaker in the conversation
2. Questions must EXACTLY match the content of the conversation
3. Questions should only ask about information that is explicitly stated in the conversation
4. The correct answer must be a direct quote or paraphrase of what was said in the conversation
5. Questions must clearly identify which speaker's words or actions they are asking about
6. Each conversation must have at least 2 exchanges
7. Questions must be about specific details mentioned in the conversation
8. Do not make assumptions about what happened - only ask about what was actually said
9. The question should be answerable by listening to the conversation only
10. Questions must use "the man" or "the woman" to identify speakers, not "he" or "she"
11. The first speaker is always the woman, and the second speaker is always the man
12. Questions must be about what was actually said by each speaker, not assumptions

Example of a good conversation and question:
Conversation:
- Female: "Would you like to try the new coffee shop on Main Street?"
- Male: "Yes, I've heard their lattes are amazing. They also have great pastries."

Good question: "What did the man say about the coffee shop's food and drinks?"
Good options: [
  "They have terrible coffee",
  "They have amazing lattes and great pastries",
  "They only serve black coffee",
  "They are too expensive"
]
Correct answer: 1 (because it matches exactly what was said)

Bad question: "What did the woman pass to the man?" (because this wasn't mentioned in the conversation)
Bad question: "What does she want to buy?" (because it doesn't identify the speaker clearly)
Bad question: "What did the man say about the pastries?" (because the man didn't mention pastries)`
          },
          {
            role: 'user',
            content: `Generate ${count} conversation scenarios for a hearing test. Each scenario should include:
            1. A conversation between two people (one male, one female)
            2. A context describing the setting
            3. A question that can be answered by listening to the conversation
            4. Multiple choice options where one option exactly matches what was said
            5. The correct answer (index of the option that matches the conversation)
            
            Format the response as a JSON array of objects with the following structure:
            {
              "id": "unique-id",
              "conversation": [
                {"text": "First speaker's text (female)", "voice": "female"},
                {"text": "Second speaker's text (male)", "voice": "male"}
              ],
              "context": "Setting description",
              "question": "Question that can be answered by listening to the conversation",
              "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
              "correctAnswer": 0
            }`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} ${response.statusText}`, errorText);
      return getDefaultQuestions();
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Clean up the response content
    const cleanedContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    try {
      const questions = JSON.parse(cleanedContent);
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }
      
      // Validate each question
      const validQuestions = questions.filter(q => {
        // Basic structure validation
        if (!q.id || !Array.isArray(q.conversation) || q.conversation.length < 2 || 
            !q.context || !q.question || !Array.isArray(q.options) || 
            q.options.length !== 4 || typeof q.correctAnswer !== 'number' ||
            q.correctAnswer < 0 || q.correctAnswer >= 4) {
          console.log('Invalid structure for question:', q);
          return false;
        }
        
        // Validate that the correct answer matches the conversation content
        const correctOption = q.options[q.correctAnswer];
        const conversationText = q.conversation.map((c: { text: string }) => c.text).join(' ');
        
        // Check if the correct answer is a direct quote or paraphrase of the conversation
        // Make this check more lenient by looking for key phrases rather than exact matches
        const isAnswerValid = conversationText.toLowerCase().includes(correctOption.toLowerCase()) ||
                            correctOption.toLowerCase().includes(conversationText.toLowerCase()) ||
                            // Check if key words from the answer appear in the conversation
                            correctOption.toLowerCase().split(' ').some((word: string) => 
                              word.length > 3 && conversationText.toLowerCase().includes(word)
                            );
        
        if (!isAnswerValid) {
          console.log('Answer does not match conversation for question:', q.question);
          return false;
        }
        
        // Check if the question correctly identifies the speaker
        const questionText = q.question.toLowerCase();
        const hasCorrectSpeakerReference = questionText.includes('the man') || 
                                          questionText.includes('the woman') ||
                                          questionText.includes('the first person') ||
                                          questionText.includes('the second person');
        
        if (!hasCorrectSpeakerReference) {
          console.log('Question does not identify speaker for:', q.question);
          return false;
        }
        
        // Log validation results for debugging
        console.log('Question passed validation:', {
          question: q.question,
          isAnswerValid,
          hasCorrectSpeakerReference,
          correctOption,
          conversationText
        });
        
        return true;
      });
      
      if (validQuestions.length === 0) {
        console.log('No valid questions after validation');
        throw new Error('No valid questions generated');
      }
      
      console.log('Generated questions:', validQuestions);
      return validQuestions;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw response:', cleanedContent);
      return getDefaultQuestions();
    }
  } catch (error) {
    console.error('Error generating questions:', error);
    return getDefaultQuestions();
  }
};

const getDefaultQuestions = (): ConversationQuestion[] => {
  return [
    {
      id: '1',
      conversation: [
        { text: "Would you like to try the new coffee shop on Main Street?", voice: "female" },
        { text: "Yes, I've heard their lattes are amazing. They also have great pastries.", voice: "male" }
      ],
      context: "Two friends discussing a new coffee shop",
      question: "What did the man say about the coffee shop?",
      options: [
        "They have terrible coffee",
        "They have amazing lattes and great pastries",
        "They only serve black coffee",
        "They are too expensive"
      ],
      correctAnswer: 1
    },
    {
      id: '2',
      conversation: [
        { text: "I'm thinking of going to the beach this weekend. Would you like to join?", voice: "female" },
        { text: "That sounds great! What time were you planning to go?", voice: "male" },
        { text: "How about 10 AM on Saturday? We can pack a picnic lunch.", voice: "female" }
      ],
      context: "Two friends planning a beach trip",
      question: "What time did the woman suggest going to the beach?",
      options: [
        "9 AM",
        "10 AM",
        "11 AM",
        "12 PM"
      ],
      correctAnswer: 1
    }
  ];
}; 
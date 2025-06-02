import { genAI } from './setup';

/**
 * Generates meeting notes from a collection of messages
 * @param {Array} messages - Collection of messages from a thread or channel
 * @return {Object} Structured meeting notes including summary, action items, and decisions
 */
async function generateMeetingNotes(messages) {
  try {
    const model = genAI.getGenerativeModel({ model: process.env.NEXT_PUBLIC_GEMINI_MODEL });

    // Format messages for the prompt
    const formattedMessages = messages.map(msg => ({
      sender: msg.sender?.fullName || 'Unknown',
      content: msg.content,
      timestamp: msg.createdAt
    }));

    // Prepare conversation transcript
    const conversationText = formattedMessages
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n');

    const prompt = `Generate comprehensive meeting notes from the following conversation transcript.
    
    CONVERSATION TRANSCRIPT:
    ${conversationText}
    
    Generate structured meeting notes in the following JSON format with no additional text:
    {
      "title": "Meeting Notes: [generate an appropriate title based on the content]",
      "date": "${new Date().toISOString().split('T')[0]}",
      "participants": [array of unique participant names from the transcript],
      "summary": "A concise 2-3 paragraph summary of the key points discussed",
      "topics": [
        {
          "topic": "Name of topic discussed",
          "keyPoints": ["Array of 1-3 key points discussed under this topic"]
        }
      ],
      "decisions": ["Array of decisions made during the meeting"],
      "actionItems": [
        {
          "task": "Description of task",
          "assignee": "Person responsible (if mentioned)",
          "dueDate": "Due date if mentioned, otherwise null"
        }
      ],
      "nextSteps": ["Array of next steps or follow-up items"]
    }
    
    Guidelines:
    1. Extract meeting topics, key decisions, and action items
    2. For each action item, identify the assignee if mentioned
    3. Create a concise summary that captures the essence of the meeting
    4. Include all participants who contributed to the conversation
    5. Only include information directly from the transcript
    6. Format everything in proper JSON
    
    Do not include any other text, only the JSON object.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    try {
      // Remove any potential markdown code block markers
      const cleanJson = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      const parsed = JSON.parse(cleanJson);

      // Validate the response format
      if (!parsed.title || !parsed.summary || !Array.isArray(parsed.topics)) {
        throw new Error('Invalid meeting notes response format');
      }

      return parsed;
    } catch (e) {
      console.error('Failed to parse AI meeting notes:', text);
      throw new Error('Failed to parse AI meeting notes');
    }
  } catch (error) {
    console.error('Error generating meeting notes:', error);
    throw error;
  }
}

export default generateMeetingNotes;

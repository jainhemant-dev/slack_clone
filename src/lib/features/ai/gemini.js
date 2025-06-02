import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export async function parseTask(taskDescription) {
  try {
    const model = genAI.getGenerativeModel({ model: process.env.NEXT_PUBLIC_GEMINI_MODEL });

    const prompt = `Parse the following task description and extract these components:
      - Task Name
      - Assignee (if mentioned)
      - Due Date and Time (if mentioned)
      - Priority (default to P3 if not specified)
      
      Task description: "${taskDescription}"
      
      Format your response EXACTLY as a JSON object with these keys:
      {
        "taskName": "<extracted task name>",
        "assignee": "<assignee name or null>",
        "dueDate": "<ISO date string or null>",
        "priority": "<P1|P2|P3|P4>"
      }
      
      Do not include any other text, only the JSON object.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    try {
      // Remove any potential markdown code block markers
      const cleanJson = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      const parsed = JSON.parse(cleanJson);

      // Validate the response format
      if (!parsed.taskName || typeof parsed.taskName !== 'string') {
        throw new Error('Invalid task name in response');
      }

      // Ensure priority is valid
      if (!['P1', 'P2', 'P3', 'P4'].includes(parsed.priority)) {
        parsed.priority = 'P3'; // Default to P3 if invalid
      }

      return parsed;
    } catch (e) {
      console.error('Failed to parse AI response:', text);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error('Error parsing task:', error);
    throw error;
  }
}

export async function queryOrgBrain(query, channelMessages, pinnedDocs) {
  try {
    const model = genAI.getGenerativeModel({ model: process.env.NEXT_PUBLIC_GEMINI_MODEL });

    // Format the channel messages for context
    const formattedChannels = channelMessages.map(channel => {
      return {
        channelName: channel.name,
        messages: channel.messages.map(msg => ({
          sender: msg.sender?.fullName || 'Unknown',
          content: msg.content,
          timestamp: msg.createdAt,
          isPinned: msg.isPinned
        }))
      };
    });

    // Format pinned documents
    const formattedPinnedDocs = pinnedDocs.map(doc => ({
      title: doc.title,
      content: doc.content,
      channelName: doc.channelName
    }));

    // Count how many messages we actually have for debugging
    const totalMessages = formattedChannels.reduce((sum, channel) => sum + channel.messages.length, 0);
    console.log(`Querying Org Brain with ${totalMessages} messages and ${formattedPinnedDocs.length} pinned docs`);
    
    // Check if we have any data
    const hasData = totalMessages > 0 || formattedPinnedDocs.length > 0;
    
    // Prepare context for the AI
    const contextData = {
      channels: formattedChannels,
      pinnedDocuments: formattedPinnedDocs
    };
    
    // Create a more focused version of the data for the prompt
    const relevantData = [];
    
    // Add relevant channel summaries
    formattedChannels.forEach(channel => {
      if (channel.messages.length > 0) {
        relevantData.push(`Channel: #${channel.channelName}`);
        
        // Add message content from this channel that might relate to the query
        const keywords = query.toLowerCase().split(' ').filter(word => word.length > 3);
        
        channel.messages.forEach(msg => {
          const isRelevant = keywords.some(keyword => 
            msg.content.toLowerCase().includes(keyword) || 
            (msg.isPinned && msg.isPinned === true));
            
          if (isRelevant || msg.isPinned) {
            relevantData.push(`  - ${msg.sender}: ${msg.content}`);
          }
        });
      }
    });
    
    // Add all pinned documents
    if (formattedPinnedDocs.length > 0) {
      relevantData.push('Pinned Documents:');
      formattedPinnedDocs.forEach(doc => {
        relevantData.push(`  - ${doc.title} (in #${doc.channelName}): ${doc.content}`);
      });
    }
    
    // Build the prompt
    const prompt = `You are the Org Brain AI assistant for a workplace messaging platform. 
    You have access to messages from public channels and pinned documents.
    
    Your task is to answer questions about the organization, ongoing projects, and workplace information by analyzing the provided data.
    
    ${hasData ? 'Here is the relevant data from the workspace:' : 'I will provide you with sample data to demonstrate your capabilities:'}
    
    ${relevantData.length > 0 ? relevantData.join('\n') : 'No specific data matched your query, but here\'s what I know about the workspace:'}
    
    Complete context: ${JSON.stringify(contextData)}
    
    User query: "${query}"
    
    Instructions:
    1. Provide a detailed answer to the query using ONLY the information from the provided context
    2. If the query mentions Project Atlas, focus on information about that project
    3. Include specific facts, dates, and quotes from the messages when available
    4. If multiple people have discussed the topic, synthesize their perspectives
    5. Format your response with clear headings, bullet points, and markdown for readability
    6. If the data doesn't contain enough information to fully answer the query, clearly state what is known and what is uncertain
    7. Keep your response concise but comprehensive
    
    Your response should sound natural and helpful, as if you're a knowledgeable team member with access to all workspace conversations.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error querying Org Brain:', error);
    throw error;
  }
}

export async function parseTranscript(transcript) {
  try {
    const model = genAI.getGenerativeModel({ model: process.env.NEXT_PUBLIC_GEMINI_MODEL });

    const prompt = `Extract tasks from the following meeting transcript. For each task, identify:
      - Task Description
      - Assignee
      - Deadline
      - Priority (default to P3)
      
      Meeting Transcript: "${transcript}"
      
      Format your response as a JSON array of task objects with these keys:
      [
        {
          "taskName": "<task description>",
          "assignee": "<assignee name>",
          "dueDate": "<ISO date string or null>",
          "priority": "<P1|P2|P3|P4>"
        }
      ]
      
      Rules:
      1. Extract every task mentioned in the transcript
      2. For each task, the deadline should be a proper ISO date string
      3. Default to P3 priority unless urgency is clearly indicated
      4. Do not include any other text, only the JSON array

      Do not include any other text, only the JSON array.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    try {
      // Remove any potential markdown code block markers
      const cleanJson = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      const parsed = JSON.parse(cleanJson);

      // Validate the response format
      if (!Array.isArray(parsed)) {
        throw new Error('Invalid response format - expected array');
      }

      // Validate and normalize each task
      return parsed.map(task => {
        if (!task.taskName || typeof task.taskName !== 'string') {
          throw new Error('Invalid task name in response');
        }

        // Ensure priority is valid
        if (!['P1', 'P2', 'P3', 'P4'].includes(task.priority)) {
          task.priority = 'P3'; // Default to P3 if invalid
        }

        return task;
      });
    } catch (e) {
      console.error('Failed to parse AI response:', text);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error('Error parsing transcript:', error);
    throw error;
  }
}

export async function analyzeTone(messageContent) {
  try {
    const model = genAI.getGenerativeModel({ model: process.env.NEXT_PUBLIC_GEMINI_MODEL });

    const prompt = `Analyze the tone, sentiment, and impact of the following message in a professional chat context:

    MESSAGE: "${messageContent}"

    Provide your analysis in the following JSON format with no additional text:
    {
      "sentiment": "positive" | "negative" | "neutral",
      "impact": "high" | "medium" | "low",
      "category": "assertive" | "aggressive" | "weak" | "confusing" | "clear" | "friendly" | "professional" | "casual",
      "score": <number between 0-100 indicating overall effectiveness>,
      "feedback": "brief 1-2 sentence explanation of the tone analysis"
    }

    Guidelines for analysis:
    - sentiment: Is the overall emotional tone positive, negative, or neutral?
    - impact: How impactful is this message likely to be? High impact messages are clear, actionable, and engaging.
    - category: What is the predominant tone category?
    - score: Higher scores (70-100) for clear, professional, appropriate messages. Lower scores (0-30) for confusing, inappropriate, or potentially offensive messages.
    - feedback: Provide constructive feedback about the tone.

    Do not include any other text, only the JSON object.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    try {
      // Remove any potential markdown code block markers
      const cleanJson = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      const parsed = JSON.parse(cleanJson);

      // Validate the response format
      if (!parsed.sentiment || !parsed.impact || !parsed.category || !parsed.score) {
        throw new Error('Invalid tone analysis response format');
      }

      // Ensure score is in range
      if (parsed.score < 0 || parsed.score > 100) {
        parsed.score = 50; // Default to neutral if invalid
      }

      return parsed;
    } catch (e) {
      console.error('Failed to parse AI tone analysis:', text);
      throw new Error('Failed to parse AI tone analysis');
    }
  } catch (error) {
    console.error('Error analyzing tone:', error);
    throw error;
  }
}

export async function suggestReply(thread) {
  try {
    const model = genAI.getGenerativeModel({ model: process.env.NEXT_PUBLIC_GEMINI_MODEL });

    // Format the thread messages for the AI
    const formattedThread = thread.map(msg => ({
      sender: msg.sender?.fullName || msg.sender?.name || 'Unknown',
      content: msg.content,
      timestamp: msg.createdAt || msg.timestamp
    }));

    // Create a context string from the messages
    const threadContext = formattedThread.map(msg => 
      `${msg.sender}: ${msg.content}`
    ).join('\n');

    const prompt = `You are an AI assistant in a professional messaging platform. You need to suggest a reply to the conversation thread below.

Thread Conversation:
${threadContext}

Instructions:
1. Analyze the conversation context and suggest an appropriate reply
2. Your reply should be helpful, professional, and directly address the most recent message
3. If there are any questions in the thread, prioritize answering those
4. Keep the tone consistent with the existing conversation
5. Format the reply as plain text that the user can edit if needed
6. Keep the reply concise but comprehensive - typically 1-3 sentences is ideal
7. If the conversation appears to be discussing sensitive or private information, provide a more generic response
8. Do not use generic placeholders like [X] or [Y] in your response

Your response should ONLY include the suggested reply text, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error suggesting reply:', error);
    throw error;
  }
}

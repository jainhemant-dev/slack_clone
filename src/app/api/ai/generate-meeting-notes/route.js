import generateMeetingNotes from "@/lib/features/ai/generateMeetingNotes";
import { NextResponse } from 'next/server';
import inMemoryStore from "@/app/api/threads/_data";


/**
 * Generate meeting notes from a collection of messages in a thread or channel
 * @param {Object} req - Request object containing thread or channel ID
 * @returns {Object} Generated meeting notes
 */
export async function POST(req) {
    try {
      console.log('Generate meeting notes API called');
      const { threadId, channelId, workspaceId } = await req.json();
      
      if (!channelId || !workspaceId) {
        return NextResponse.json(
          { error: "Channel ID and workspace ID are required" },
          { status: 400 }
        );
      }

      let messages = [];
      // If threadId is provided, fetch messages from that thread
      if (threadId) {
        console.log(`Fetching thread messages for thread: ${threadId}`);
        messages = inMemoryStore.messages.filter(msg => 
          msg.channelId === channelId && 
          msg.workspaceId === workspaceId &&
          (msg.id === threadId || msg.parentMessage === threadId)
        );
      } 
      // Otherwise, fetch all messages from the channel
      else {
        console.log(`Fetching channel messages for channel: ${channelId}`);
        messages = inMemoryStore.messages.filter(msg => 
          msg.channelId === channelId && 
          msg.workspaceId === workspaceId &&
          !msg.parentMessage
        )
        .slice(0, 100); // Limit to 100 messages to avoid token limits
      }

      // If no messages found in memory store, try fetching from the demo data
      if (messages.length === 0) {
        console.log('No messages found in memory store, using demo data');
        // Create some demo messages for testing
        messages = [
          {
            id: 'demo1',
            content: 'Hey team, let\'s discuss the new feature implementation.',
            sender: { fullName: 'Alice' },
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            channelId,
            workspaceId
          },
          {
            id: 'demo2',
            content: 'I think we should focus on the user authentication part first.',
            sender: { fullName: 'Bob' },
            createdAt: new Date(Date.now() - 3500000).toISOString(),
            channelId,
            workspaceId
          },
          {
            id: 'demo3',
            content: 'Agreed. We need to implement JWT authentication and session management.',
            sender: { fullName: 'Charlie' },
            createdAt: new Date(Date.now() - 3400000).toISOString(),
            channelId,
            workspaceId
          },
          {
            id: 'demo4',
            content: 'Let\'s set a deadline for next Friday. I\'ll handle the backend part.',
            sender: { fullName: 'Alice' },
            createdAt: new Date(Date.now() - 3300000).toISOString(),
            channelId,
            workspaceId
          },
          {
            id: 'demo5',
            content: 'I can work on the frontend integration. Should we use Redux for state management?',
            sender: { fullName: 'Bob' },
            createdAt: new Date(Date.now() - 3200000).toISOString(),
            channelId,
            workspaceId
          }
        ];
      }

      if (messages.length === 0) {
        return NextResponse.json(
          { error: "No messages found for the specified thread or channel" },
          { status: 404 }
        );
      }

      // Generate meeting notes using Gemini AI
      const meetingNotes = await generateMeetingNotes(messages);

      return NextResponse.json({ meetingNotes }, { status: 200 });
    } catch (error) {
      console.error("Error generating meeting notes:", error);
      return NextResponse.json(
        { error: "Failed to generate meeting notes" },
        { status: 500 }
      );
    }
}

import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Alternative: Google Gemini AI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

class AIService {
  constructor() {
    this.model = process.env.AI_MODEL || 'gpt-3.5-turbo';
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 4000;
    this.temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.7;
  }

  async generateResponseWithOpenAI(messages, options = {}) {
    try {
      const response = await openai.chat.completions.create({
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || this.temperature,
        stream: false,
      });

      return {
        content: response.choices[0].message.content,
        tokens: response.usage.total_tokens,
        model: response.model,
        cost: this.calculateCost(response.usage.total_tokens, response.model),
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async generateResponseWithGemini(messages, options = {}) {
    try {
      // Convert OpenAI format to Gemini format
      const geminiMessages = this.convertToGeminiFormat(messages);
      
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: {
            temperature: options.temperature || this.temperature,
            maxOutputTokens: options.maxTokens || this.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Invalid Gemini response structure:', data);
        throw new Error('Invalid response from Gemini API');
      }
      
      const content = data.candidates[0].content.parts[0].text;
      
      return {
        content: content,
        tokens: data.usageMetadata?.totalTokenCount || 0,
        model: 'gemini-pro',
        cost: 0, // Gemini pricing is different
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async generateResponse(messages, options = {}) {
    const provider = process.env.AI_PROVIDER || 'openai';
    
    switch (provider) {
      case 'openai':
        return await this.generateResponseWithOpenAI(messages, options);
      case 'gemini':
        return await this.generateResponseWithGemini(messages, options);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  convertToGeminiFormat(messages) {
    return messages
      .filter(msg => msg.role !== 'system') // Gemini handles system messages differently
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));
  }

  calculateCost(tokens, model) {
    // OpenAI pricing (approximate)
    const pricing = {
      'gpt-3.5-turbo': 0.002 / 1000, // $0.002 per 1K tokens
      'gpt-4': 0.03 / 1000, // $0.03 per 1K tokens
      'gpt-4-turbo': 0.01 / 1000, // $0.01 per 1K tokens
    };
    
    return (tokens * (pricing[model] || pricing['gpt-3.5-turbo'])).toFixed(6);
  }

  createSystemPrompt(userContext = {}) {
    return `You are a helpful AI assistant integrated into a chat application. 
Your role is to assist users with various tasks, answer questions, and provide helpful information.

User Context:
- User Name: ${userContext.fullName || 'User'}
- App: Chat Application
- Features Available: Messaging, Groups, Posts, Video Calls

Guidelines:
1. Be helpful, friendly, and concise
2. If asked about the chat app features, provide relevant information
3. For technical questions, provide clear and accurate answers
4. If you don't know something, admit it honestly
5. Keep responses conversational and engaging
6. Respect user privacy and don't ask for personal information

Current time: ${new Date().toISOString()}`;
  }

  async generateTitle(messages) {
    try {
      const titlePrompt = `Based on this conversation, generate a short, descriptive title (max 50 characters). Only return the title, nothing else.

Conversation:
${messages.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;

      const response = await this.generateResponse([
        { role: 'user', content: titlePrompt }
      ], { maxTokens: 20, temperature: 0.3 });

      return response.content.trim().replace(/['"]/g, '');
    } catch (error) {
      console.error('Error generating title:', error);
      return 'AI Chat Session';
    }
  }
}

export default new AIService();

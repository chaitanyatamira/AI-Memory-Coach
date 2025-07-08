// services/aiService.js - AI service for OpenAI integration

const OpenAI = require('openai');

class AIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.warn('⚠️  OpenAI API key not configured. AI features will be disabled.');
      this.openai = null;
      this.enabled = false;
    } else {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.enabled = true;
      console.log('✅ OpenAI service initialized');
    }
  }

  isEnabled() {
    return this.enabled;
  }

  /**
   * Summarize a single page visit
   * @param {Object} visit - Page visit object with title, url, textContent
   * @returns {Promise<string>} - Summary text
   */
  async summarizePage(visit) {
    if (!this.enabled) {
      throw new Error('OpenAI service is not enabled. Please configure OPENAI_API_KEY.');
    }

    try {
      const prompt = this.createPageSummaryPrompt(visit);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that helps users remember and learn from web content. Create concise, informative summaries that highlight key learning points."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3,
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error summarizing page:', error);
      throw new Error('Failed to generate page summary');
    }
  }

  /**
   * Generate daily summary from multiple visits
   * @param {Array} visits - Array of page visit objects
   * @param {string} date - Date string for the summary
   * @returns {Promise<Object>} - Summary object with insights
   */
  async generateDailySummary(visits, date) {
    if (!this.enabled) {
      throw new Error('OpenAI service is not enabled. Please configure OPENAI_API_KEY.');
    }

    if (!visits || visits.length === 0) {
      return {
        date,
        summary: "No learning content was recorded for this day.",
        keyTopics: [],
        insights: [],
        totalVisits: 0
      };
    }

    try {
      const prompt = this.createDailySummaryPrompt(visits, date);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an AI learning coach that analyzes daily web browsing patterns to provide insights and summaries. Focus on learning content and provide actionable insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.4,
      });

      const aiResponse = completion.choices[0].message.content.trim();
      
      // Parse the AI response and structure it
      return this.parseDailySummaryResponse(aiResponse, visits, date);
    } catch (error) {
      console.error('Error generating daily summary:', error);
      throw new Error('Failed to generate daily summary');
    }
  }

  /**
   * Extract key topics from content
   * @param {string} content - Text content to analyze
   * @returns {Promise<Array>} - Array of key topics
   */
  async extractKeyTopics(content) {
    if (!this.enabled) {
      throw new Error('OpenAI service is not enabled. Please configure OPENAI_API_KEY.');
    }

    try {
      const prompt = `Extract 3-5 key topics or concepts from the following content. Return only the topics as a comma-separated list:

${content.substring(0, 2000)}...`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert at identifying key topics and concepts from text. Return only the topics as a simple comma-separated list."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.2,
      });

      const response = completion.choices[0].message.content.trim();
      return response.split(',').map(topic => topic.trim()).filter(topic => topic.length > 0);
    } catch (error) {
      console.error('Error extracting key topics:', error);
      return [];
    }
  }

  /**
   * Create prompt for page summarization
   * @private
   */
  createPageSummaryPrompt(visit) {
    return `Please create a concise summary of this web page content:

Title: ${visit.title}
URL: ${visit.url}
Content: ${visit.textContent ? visit.textContent.substring(0, 1500) : 'No content available'}

Focus on:
- Key learning points
- Main concepts or ideas
- Practical takeaways

Keep the summary under 150 words and make it useful for future reference.`;
  }

  /**
   * Create prompt for daily summary
   * @private
   */
  createDailySummaryPrompt(visits, date) {
    const learningVisits = visits.filter(v => v.isLearningContent);
    const visitSummaries = visits.slice(0, 10).map(visit => 
      `- ${visit.title} (${visit.domain}): ${visit.textContent ? visit.textContent.substring(0, 200) + '...' : 'No content'}`
    ).join('\n');

    return `Analyze this day's learning activity and create a comprehensive summary:

Date: ${date}
Total visits: ${visits.length}
Learning content visits: ${learningVisits.length}

Recent visits:
${visitSummaries}

Please provide:
1. A brief summary of the day's learning focus
2. Key topics explored
3. Learning insights or patterns
4. Suggestions for follow-up or deeper learning

Format your response in a structured way that's easy to read and actionable.`;
  }

  /**
   * Parse AI response for daily summary
   * @private
   */
  parseDailySummaryResponse(aiResponse, visits, date) {
    // Extract key topics from visits
    const domains = [...new Set(visits.map(v => v.domain))];
    const learningVisits = visits.filter(v => v.isLearningContent);
    
    // Basic parsing - in a real app, you might want more sophisticated parsing
    const lines = aiResponse.split('\n').filter(line => line.trim());
    
    return {
      date,
      summary: aiResponse,
      keyTopics: domains.slice(0, 5), // Top 5 domains as topics for now
      insights: lines.filter(line => line.includes('insight') || line.includes('pattern') || line.includes('suggest')),
      totalVisits: visits.length,
      learningVisits: learningVisits.length,
      topDomains: domains.slice(0, 3),
      generatedAt: new Date().toISOString()
    };
  }
}

// Export singleton instance
module.exports = new AIService();
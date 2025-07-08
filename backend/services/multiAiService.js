// services/multiAiService.js - Multi-provider AI service with free alternatives

const { GoogleGenerativeAI } = require('@google/generative-ai');

class MultiAIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'gemini';
    this.enabled = false;
    this.client = null;
    
    this.initializeProvider();
  }

  initializeProvider() {
    console.log(`🤖 Initializing AI provider: ${this.provider}`);
    
    switch (this.provider.toLowerCase()) {
      case 'gemini':
        this.initializeGemini();
        break;
      case 'openai':
        this.initializeOpenAI();
        break;
      case 'cohere':
        this.initializeCohere();
        break;
      case 'huggingface':
        this.initializeHuggingFace();
        break;
      default:
        console.warn(`⚠️  Unknown AI provider: ${this.provider}. Falling back to basic summaries.`);
        this.enabled = false;
    }
  }

  initializeGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.warn('⚠️  Gemini API key not configured. Get one free at: https://makersuite.google.com/app/apikey');
      this.enabled = false;
      return;
    }

    try {
      this.client = new GoogleGenerativeAI(apiKey);
      this.model = this.client.getGenerativeModel({ model: "gemini-pro" });
      this.enabled = true;
      console.log('✅ Google Gemini initialized (FREE tier: 15 req/min, 1M tokens/month)');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini:', error.message);
      this.enabled = false;
    }
  }

  initializeOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      console.warn('⚠️  OpenAI API key not configured.');
      this.enabled = false;
      return;
    }

    try {
      const OpenAI = require('openai');
      this.client = new OpenAI({ apiKey });
      this.enabled = true;
      console.log('✅ OpenAI initialized');
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI:', error.message);
      this.enabled = false;
    }
  }

  initializeCohere() {
    // Placeholder for Cohere implementation
    console.log('🚧 Cohere integration coming soon...');
    this.enabled = false;
  }

  initializeHuggingFace() {
    // Placeholder for Hugging Face implementation
    console.log('🚧 Hugging Face integration coming soon...');
    this.enabled = false;
  }

  isEnabled() {
    return this.enabled;
  }

  getProviderInfo() {
    const providers = {
      gemini: {
        name: 'Google Gemini',
        freeLimit: '15 requests/minute, 1M tokens/month',
        signupUrl: 'https://makersuite.google.com/app/apikey',
        cost: 'FREE'
      },
      openai: {
        name: 'OpenAI GPT',
        freeLimit: '$5 free credits (one-time)',
        signupUrl: 'https://platform.openai.com/api-keys',
        cost: 'Pay-per-use after free credits'
      },
      cohere: {
        name: 'Cohere',
        freeLimit: '5M tokens/month',
        signupUrl: 'https://dashboard.cohere.ai/api-keys',
        cost: 'FREE'
      },
      huggingface: {
        name: 'Hugging Face',
        freeLimit: '30K characters/month',
        signupUrl: 'https://huggingface.co/settings/tokens',
        cost: 'FREE'
      }
    };

    return providers[this.provider] || { name: 'Unknown', cost: 'Unknown' };
  }

  /**
   * Summarize a single page visit
   */
  async summarizePage(visit) {
    if (!this.enabled) {
      return this.createFallbackPageSummary(visit);
    }

    try {
      switch (this.provider) {
        case 'gemini':
          return await this.summarizePageWithGemini(visit);
        case 'openai':
          return await this.summarizePageWithOpenAI(visit);
        default:
          return this.createFallbackPageSummary(visit);
      }
    } catch (error) {
      console.error(`Error with ${this.provider} summarization:`, error.message);
      console.log('🔄 Falling back to basic summary...');
      return this.createFallbackPageSummary(visit);
    }
  }

  /**
   * Generate daily summary
   */
  async generateDailySummary(visits, date) {
    if (!this.enabled) {
      return this.createFallbackDailySummary(visits, date);
    }

    try {
      switch (this.provider) {
        case 'gemini':
          return await this.generateDailySummaryWithGemini(visits, date);
        case 'openai':
          return await this.generateDailySummaryWithOpenAI(visits, date);
        default:
          return this.createFallbackDailySummary(visits, date);
      }
    } catch (error) {
      console.error(`Error with ${this.provider} daily summary:`, error.message);
      console.log('🔄 Falling back to basic summary...');
      return this.createFallbackDailySummary(visits, date);
    }
  }

  /**
   * Gemini-specific page summarization
   */
  async summarizePageWithGemini(visit) {
    const prompt = `Please create a concise summary of this web page content:

Title: ${visit.title}
URL: ${visit.url}
Content: ${visit.textContent ? visit.textContent.substring(0, 1500) : 'No content available'}

Focus on:
- Key learning points
- Main concepts or ideas
- Practical takeaways

Keep the summary under 150 words and make it useful for future reference.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  }

  /**
   * Gemini-specific daily summary
   */
  async generateDailySummaryWithGemini(visits, date) {
    const learningVisits = visits.filter(v => v.isLearningContent);
    const visitSummaries = visits.slice(0, 10).map(visit => 
      `- ${visit.title} (${visit.domain}): ${visit.textContent ? visit.textContent.substring(0, 200) + '...' : 'No content'}`
    ).join('\n');

    const prompt = `Analyze this day's learning activity and create a comprehensive summary:

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

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text().trim();
    
    return this.parseDailySummaryResponse(aiResponse, visits, date);
  }

  /**
   * OpenAI-specific implementations (keeping original code)
   */
  async summarizePageWithOpenAI(visit) {
    const prompt = this.createPageSummaryPrompt(visit);
    
    const completion = await this.client.chat.completions.create({
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
  }

  async generateDailySummaryWithOpenAI(visits, date) {
    const prompt = this.createDailySummaryPrompt(visits, date);
    
    const completion = await this.client.chat.completions.create({
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
    return this.parseDailySummaryResponse(aiResponse, visits, date);
  }

  /**
   * Fallback implementations (no AI required)
   */
  createFallbackPageSummary(visit) {
    const content = visit.textContent || '';
    const words = content.split(' ').slice(0, 50).join(' ');
    
    return `📄 Basic Summary for "${visit.title}"

🔗 Source: ${visit.domain}
📅 Visited: ${new Date(visit.timestamp).toLocaleDateString()}

📝 Content Preview: ${words}${content.split(' ').length > 50 ? '...' : ''}

💡 This is a basic summary. Enable AI for detailed insights!
🚀 Get free AI: https://makersuite.google.com/app/apikey`;
  }

  createFallbackDailySummary(visits, date) {
    const learningVisits = visits.filter(v => v.isLearningContent);
    const domains = [...new Set(visits.map(v => v.domain))];
    const topDomains = domains.slice(0, 5);

    const summary = `📊 Daily Learning Summary for ${date}

📈 Statistics:
• Total pages visited: ${visits.length}
• Learning content: ${learningVisits.length}
• Unique domains: ${domains.length}

🌐 Top domains visited:
${topDomains.map(domain => `• ${domain}`).join('\n')}

📚 Recent learning content:
${learningVisits.slice(-3).map(visit => `• ${visit.title} (${visit.domain})`).join('\n')}

💡 This is a basic summary. Enable AI for detailed insights and recommendations!
🚀 Get free AI: https://makersuite.google.com/app/apikey`;

    return {
      date,
      summary,
      keyTopics: topDomains,
      insights: ['Enable AI for personalized insights'],
      totalVisits: visits.length,
      learningVisits: learningVisits.length,
      topDomains: topDomains.slice(0, 3),
      generatedAt: new Date().toISOString(),
      isAiGenerated: false
    };
  }

  /**
   * Helper methods (keeping from original)
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

  parseDailySummaryResponse(aiResponse, visits, date) {
    const domains = [...new Set(visits.map(v => v.domain))];
    const learningVisits = visits.filter(v => v.isLearningContent);
    const lines = aiResponse.split('\n').filter(line => line.trim());
    
    return {
      date,
      summary: aiResponse,
      keyTopics: domains.slice(0, 5),
      insights: lines.filter(line => line.includes('insight') || line.includes('pattern') || line.includes('suggest')),
      totalVisits: visits.length,
      learningVisits: learningVisits.length,
      topDomains: domains.slice(0, 3),
      generatedAt: new Date().toISOString(),
      isAiGenerated: true,
      provider: this.provider
    };
  }

  /**
   * Extract key topics (simplified for fallback)
   */
  async extractKeyTopics(content) {
    if (!this.enabled) {
      // Simple keyword extraction as fallback
      const words = content.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 4);
      
      const wordCount = {};
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
      
      return Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word);
    }

    try {
      switch (this.provider) {
        case 'gemini':
          const prompt = `Extract 3-5 key topics or concepts from the following content. Return only the topics as a comma-separated list:\n\n${content.substring(0, 2000)}...`;
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          const topics = response.text().trim();
          return topics.split(',').map(topic => topic.trim()).filter(topic => topic.length > 0);
        
        default:
          return [];
      }
    } catch (error) {
      console.error('Error extracting topics:', error);
      return [];
    }
  }
}

// Export singleton instance
module.exports = new MultiAIService();
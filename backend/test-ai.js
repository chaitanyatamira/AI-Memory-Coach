// test-ai.js - Test script for AI integration

require('dotenv').config();
const aiService = require('./services/multiAiService');

async function testAI() {
    console.log('🧪 Testing AI Integration...\n');
    
    // Test 1: Check if AI service is enabled
    console.log('1. Checking AI service status...');
    const providerInfo = aiService.getProviderInfo();
    console.log(`   Provider: ${providerInfo.name}`);
    console.log(`   Cost: ${providerInfo.cost}`);
    console.log(`   Free Limit: ${providerInfo.freeLimit}`);
    console.log(`   AI Enabled: ${aiService.isEnabled()}`);
    
    if (!aiService.isEnabled()) {
        console.log(`   ❌ AI service is disabled. Get free API key from:`);
        console.log(`   📝 ${providerInfo.signupUrl}`);
        console.log(`   💡 Or try the fallback summaries (basic but functional)!\n`);
        
        // Test fallback functionality
        console.log('2. Testing fallback functionality...');
    } else {
        console.log('   ✅ AI service is ready!\n');
    }
    
    // Test 2: Test page summarization
    console.log('2. Testing page summarization...');
    const testVisit = {
        id: 1,
        title: 'Introduction to Machine Learning',
        url: 'https://example.com/ml-intro',
        textContent: `Machine learning is a subset of artificial intelligence that focuses on algorithms that can learn from data. 
        It involves training models on datasets to make predictions or decisions without being explicitly programmed for every scenario.
        Key concepts include supervised learning, unsupervised learning, and reinforcement learning. Popular algorithms include
        linear regression, decision trees, neural networks, and support vector machines. Applications range from image recognition
        to natural language processing and recommendation systems.`,
        domain: 'example.com',
        timestamp: new Date().toISOString(),
        isLearningContent: true
    };
    
    try {
        const summary = await aiService.summarizePage(testVisit);
        console.log('   ✅ Page summary generated:');
        console.log(`   "${summary}"\n`);
    } catch (error) {
        console.log('   ❌ Page summarization failed:', error.message);
        return;
    }
    
    // Test 3: Test daily summary
    console.log('3. Testing daily summary...');
    const testVisits = [
        testVisit,
        {
            id: 2,
            title: 'Python Programming Basics',
            url: 'https://example.com/python-basics',
            textContent: 'Python is a high-level programming language known for its simplicity and readability. It supports multiple programming paradigms and has extensive libraries.',
            domain: 'example.com',
            timestamp: new Date().toISOString(),
            isLearningContent: true
        },
        {
            id: 3,
            title: 'Data Structures and Algorithms',
            url: 'https://example.com/dsa',
            textContent: 'Data structures organize data efficiently. Common structures include arrays, linked lists, stacks, queues, trees, and graphs. Algorithms solve computational problems.',
            domain: 'example.com',
            timestamp: new Date().toISOString(),
            isLearningContent: true
        }
    ];
    
    try {
        const dailySummary = await aiService.generateDailySummary(testVisits, new Date().toISOString().split('T')[0]);
        console.log('   ✅ Daily summary generated:');
        console.log(`   Summary: "${dailySummary.summary}"`);
        console.log(`   Key Topics: ${dailySummary.keyTopics.join(', ')}`);
        console.log(`   Total Visits: ${dailySummary.totalVisits}`);
        console.log(`   Learning Visits: ${dailySummary.learningVisits}\n`);
    } catch (error) {
        console.log('   ❌ Daily summary failed:', error.message);
        return;
    }
    
    // Test 4: Test topic extraction
    console.log('4. Testing topic extraction...');
    const testContent = `
        React is a JavaScript library for building user interfaces. It uses a component-based architecture
        where UI is broken down into reusable components. Key concepts include JSX, props, state, hooks,
        and the virtual DOM. React follows a unidirectional data flow and uses reconciliation for efficient
        updates. Popular patterns include higher-order components, render props, and custom hooks.
    `;
    
    try {
        const topics = await aiService.extractKeyTopics(testContent);
        console.log('   ✅ Topics extracted:');
        console.log(`   Topics: ${topics.join(', ')}\n`);
    } catch (error) {
        console.log('   ❌ Topic extraction failed:', error.message);
        return;
    }
    
    console.log('🎉 All AI tests passed! Your AI integration is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('   1. Start your server: npm run dev');
    console.log('   2. Load your extension in Chrome');
    console.log('   3. Visit some learning content');
    console.log('   4. Try the AI features in the extension popup');
}

// Run the test
testAI().catch(console.error);
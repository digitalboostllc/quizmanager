// Simple script to test the batch API
// You can run this from the terminal with:
// node src/scripts/test-batch-api.js

async function testBatchAPI() {
    console.log('🔍 Starting API test...');

    // Test data that matches the expected schema
    const testData = {
        templateIds: ['template-123', 'template-456'],
        count: 5,
        difficulty: 'medium',
        variety: 50,
        language: 'en',
        timeSlotDistribution: [
            {
                date: '2023-06-01',
                slotId: 'morning',
                weight: 1
            },
            {
                date: '2023-06-01',
                slotId: 'evening',
                weight: 2
            }
        ]
    };

    try {
        console.log('📦 Sending test data:', JSON.stringify(testData, null, 2));

        // Make the API request
        const response = await fetch('http://localhost:3000/api/quiz-generation/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData),
        });

        console.log(`📌 Response status: ${response.status} ${response.statusText}`);

        // Parse the response
        const data = await response.json();
        console.log('📊 Response data:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('✅ Test passed!');
        } else {
            console.log('❌ Test failed!');
        }
    } catch (error) {
        console.error('❌ Error during API test:', error);
    }
}

// Run the test
testBatchAPI(); 
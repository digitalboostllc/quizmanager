// Test API endpoint directly using ESM and built-in fetch
// To run: node test-api.mjs

async function testApi() {
    try {
        console.log('Testing API endpoint directly...');

        // Test the templates endpoint
        console.log('Fetching from templates endpoint...');
        const templatesResponse = await fetch('http://localhost:3000/api/templates?limit=10');

        if (!templatesResponse.ok) {
            console.error(`❌ Templates API failed with status ${templatesResponse.status}`);
            console.error(`Response text: ${await templatesResponse.text()}`);
            return;
        }

        const templatesData = await templatesResponse.json();
        console.log(`✅ Templates API returned ${templatesData?.data?.length || 0} templates`);

        if (templatesData?.data?.length > 0) {
            console.log('First template:', templatesData.data[0]);
        } else {
            console.log('No templates found in the response');
        }

    } catch (error) {
        console.error('API test error:', error);
    }
}

testApi(); 
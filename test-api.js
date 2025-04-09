// Test API endpoint directly with http module
const http = require('http');

async function testApi() {
    return new Promise((resolve, reject) => {
        console.log('Testing API endpoint directly...');

        // Test the templates endpoint
        console.log('Fetching from templates endpoint...');

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/templates?limit=10',
            method: 'GET',
        };

        const req = http.request(options, (res) => {
            console.log(`Status Code: ${res.statusCode}`);

            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode !== 200) {
                    console.error(`❌ Templates API failed with status ${res.statusCode}`);
                    console.error(`Response: ${data}`);
                    resolve();
                    return;
                }

                try {
                    const jsonData = JSON.parse(data);
                    console.log(`✅ Templates API returned ${jsonData?.data?.length || 0} templates`);

                    if (jsonData?.data?.length > 0) {
                        console.log('First template:', jsonData.data[0]);
                    } else {
                        console.log('No templates found in the response');
                    }
                    resolve();
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('API test error:', error);
            reject(error);
        });

        req.end();
    });
}

testApi().catch(console.error); 
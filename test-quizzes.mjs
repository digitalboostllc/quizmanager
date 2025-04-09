// Test script to fetch quizzes
const fetchQuizzes = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/quizzes?limit=20&_t=' + Date.now(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log('Successfully fetched quizzes:');
        console.log(JSON.stringify(data, null, 2));
        console.log(`Total quizzes: ${data.data.length}`);

        return data;
    } catch (error) {
        console.error('Error fetching quizzes:', error);
    }
};

fetchQuizzes(); 
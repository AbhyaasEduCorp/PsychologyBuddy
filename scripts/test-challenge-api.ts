import 'dotenv/config';

const CHALLENGE_ID = 'cd8493bb-ad85-48fd-8b12-1722db2b0506';

async function testChallengeAPI() {
  try {
    console.log('Testing challenge API with ID:', CHALLENGE_ID);
    console.log('This test requires the Next.js dev server to be running!\n');
    
    const response = await fetch(`http://localhost:3000/api/challenges/${CHALLENGE_ID}`, {
      headers: {
        'Cookie': 'your-auth-cookie-here' // This won't work without proper auth
      }
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testChallengeAPI();

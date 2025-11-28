const chatParser = require('./backend/services/chatParser');
const path = require('path');

async function testParser() {
    const chatFile = path.join(__dirname, 'uploads/3/9c067fea-4531-4847-a7d5-701588c9be3a/test_extract/WhatsApp Chat with +20 10 02584164.txt');

    console.log('Testing parser with file:', chatFile);

    try {
        const messages = await chatParser.parse(chatFile);
        console.log(`\n✅ Successfully parsed ${messages.length} messages!\n`);

        if (messages.length > 0) {
            console.log('First 3 messages:');
            messages.slice(0, 3).forEach((msg, i) => {
                console.log(`\n${i + 1}. ${msg.senderName}:`);
                console.log(`   Time: ${msg.timestamp}`);
                console.log(`   Type: ${msg.messageType}`);
                console.log(`   Body: ${msg.body.substring(0, 100)}...`);
            });
        }
    } catch (error) {
        console.error('Parser error:', error);
    }
}

testParser();

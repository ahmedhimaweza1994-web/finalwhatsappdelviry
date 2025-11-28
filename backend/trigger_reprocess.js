const Queue = require('bull');
const path = require('path');

const queue = new Queue('chat-parse', {
    redis: {
        host: 'localhost',
        port: 6379
    }
});

async function triggerReprocess() {
    console.log('Adding reprocess job to queue...');

    const uploadDir = path.join(__dirname, '../uploads/3/9c067fea-4531-4847-a7d5-701588c9be3a');
    const job = await queue.add({
        chatId: 1,
        userId: 3,
        uploadUuid: '9c067fea-4531-4847-a7d5-701588c9be3a',
        zipPath: path.join(uploadDir, 'raw.zip')
    });

    console.log(`Job added with ID: ${job.id}`);
    console.log('Worker should process it now...');

    // Wait a bit and check status
    setTimeout(async () => {
        const status = await job.getState();
        console.log(`Job status: ${status}`);
        process.exit(0);
    }, 5000);
}

triggerReprocess().catch(console.error);

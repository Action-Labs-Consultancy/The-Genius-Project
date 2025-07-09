const io = require('socket.io-client');

// Connect to the backend socket
const socket = io('http://localhost:5002');

socket.on('connect', () => {
    console.log('✅ Connected to socket server');
    
    // Test channel data
    const testChannelId = '686e28de8095339acceac677';
    const testUserId = '686e28a58095339acceac675';
    
    // Join the test channel
    socket.emit('join', { channel_id: testChannelId });
    console.log('📥 Joined test channel');
    
    // Send a test message
    setTimeout(() => {
        const messageData = {
            channel_id: testChannelId,
            user_id: testUserId,
            content: 'Test message from Node.js socket client',
            name: 'Socket Test User'
        };
        
        console.log('📤 Sending test message:', messageData);
        socket.emit('send_message', messageData);
    }, 1000);
});

socket.on('receive_message', (data) => {
    console.log('📨 Received message:', data);
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from socket server');
});

socket.on('connect_error', (error) => {
    console.log('🚨 Connection error:', error);
});

// Keep the script running for 10 seconds
setTimeout(() => {
    console.log('🔚 Test complete, disconnecting...');
    socket.disconnect();
    process.exit(0);
}, 10000);

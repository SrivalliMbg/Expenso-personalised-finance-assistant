// Home Frontend JavaScript with Chatbot Integration
document.addEventListener('DOMContentLoaded', function() {
    console.log('Home page loaded');
    
    // Initialize dashboard
    initDashboard();
    
    // Initialize chatbot
    initChatbot();
});

// Dashboard functionality
function initDashboard() {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user) {
        document.getElementById("sidebarUsername").textContent = user.username;
        document.getElementById("totalSpent").textContent = user.total_spent || "0";
        document.getElementById("budget").textContent = user.budget || "0";
        
        // Load initial AI insights
        loadAIInsights();
    } else {
        window.location.href = "/login_page";
    }
}

// Load AI insights
function loadAIInsights() {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const profileData = {
        "Name": user.username,
        "Status": user.status || "professional",
        "Profession": user.profession || "Not specified"
    };
    
    fetch('/api/insights', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: user.id || 'demo_user',
            user_mode: user.status || 'professional',
            profile_data: profileData,
            chat_history: []
        })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('ai-insight').innerHTML = data.response.replace(/\n/g, '<br>');
    })
    .catch(error => {
        console.error('Error loading AI insights:', error);
        document.getElementById('ai-insight').textContent = 'AI insights will appear here once you start using the app.';
    });
}

// Chatbot functionality
function initChatbot() {
    const chatbotContainer = document.getElementById('chatbot-container');
    if (!chatbotContainer) return;
    
    chatbotContainer.innerHTML = `
        <div class="chatbot-widget">
            <div class="chatbot-header">
                <h4>🤖 Chat with Expenso</h4>
                <button class="chatbot-toggle" onclick="toggleChatbot()">💬</button>
            </div>
            <div class="chatbot-body" id="chatbot-body" style="display: none;">
                <div class="chat-messages" id="chat-messages">
                    <div class="message bot-message">
                        <div class="message-content">
                            Hello! I'm your AI financial assistant. Ask me anything about your finances, budgeting, or investment advice!
                        </div>
                    </div>
                </div>
                <div class="chat-input-container">
                    <input type="text" id="chat-input" placeholder="Ask me about your finances..." onkeypress="handleChatKeyPress(event)">
                    <button onclick="sendMessage()" class="send-btn">Send</button>
                </div>
                <div class="quick-actions">
                    <button onclick="askQuickQuestion('How can I improve my savings?')" class="quick-btn">💡 Savings Tips</button>
                    <button onclick="askQuickQuestion('Show me stocks under 500')" class="quick-btn">📈 Stock Ideas</button>
                    <button onclick="askQuickQuestion('Analyze my budget')" class="quick-btn">💰 Budget Analysis</button>
                </div>
            </div>
        </div>
    `;
}

// Toggle chatbot visibility
function toggleChatbot() {
    const chatbotBody = document.getElementById('chatbot-body');
    const toggleBtn = document.querySelector('.chatbot-toggle');
    
    if (chatbotBody.style.display === 'none') {
        chatbotBody.style.display = 'block';
        toggleBtn.textContent = '✕';
        document.getElementById('chat-input').focus();
    } else {
        chatbotBody.style.display = 'none';
        toggleBtn.textContent = '💬';
    }
}

// Handle Enter key in chat input
function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Send message to chatbot
function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessage(message, 'user');
    input.value = '';
    
    // Show typing indicator
    addTypingIndicator();
    
    // Send to API
    const user = JSON.parse(sessionStorage.getItem("user"));
    const profileData = {
        "Name": user.username,
        "Status": user.status || "professional",
        "Profession": user.profession || "Not specified"
    };
    
    fetch('/api/chatbot', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: user.id || 'demo_user',
            message: message,
            user_mode: user.status || 'professional',
            profile_data: profileData,
            chat_history: getChatHistory()
        })
    })
    .then(response => response.json())
    .then(data => {
        removeTypingIndicator();
        addMessage(data.response, 'bot');
    })
    .catch(error => {
        console.error('Error sending message:', error);
        removeTypingIndicator();
        addMessage('Sorry, I\'m having trouble connecting right now. Please try again.', 'bot');
    });
}

// Add message to chat
function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = text.replace(/\n/g, '<br>');
    
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Store in chat history
    addToChatHistory(sender, text);
}

// Add typing indicator
function addTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = '<div class="message-content">🤖 AI is thinking...</div>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Quick question function
function askQuickQuestion(question) {
    const input = document.getElementById('chat-input');
    input.value = question;
    sendMessage();
}

// Chat history management
function addToChatHistory(sender, text) {
    let history = JSON.parse(sessionStorage.getItem('chatHistory') || '[]');
    history.push({
        sender: sender,
        text: text,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 20 messages
    if (history.length > 20) {
        history = history.slice(-20);
    }
    
    sessionStorage.setItem('chatHistory', JSON.stringify(history));
}

function getChatHistory() {
    return JSON.parse(sessionStorage.getItem('chatHistory') || '[]');
}

// Logout confirmation
function confirmLogout() {
    return confirm("Are you sure you want to logout?");
}

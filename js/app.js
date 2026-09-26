let currentUser = null;
let currentChatId = null;
let chats = [];
let attachedFile = null;

window.initAivoraApp = function(user) {
    currentUser = user;
    loadLocalChats();
    renderChatHistory();
};

function loadLocalChats() {
    const saved = localStorage.getItem(`aivora_chats_${currentUser.uid}`);
    chats = saved ? JSON.parse(saved) : [];
}

function saveLocalChats() {
    localStorage.setItem(`aivora_chats_${currentUser.uid}`, JSON.stringify(chats));
}

function createNewChat() {
    currentChatId = Date.now().toString();
    const newChat = {
        id: currentChatId,
        title: 'New Chat',
        messages: []
    };
    chats.unshift(newChat);
    saveLocalChats();
    renderChatHistory();
    switchChat(currentChatId);
}

function switchChat(chatId) {
    currentChatId = chatId;
    const chat = chats.find(c => c.id === chatId);
    
    document.getElementById('currentChatTitle').textContent = chat ? chat.title : 'New Chat';
    
    const welcomeScreen = document.getElementById('welcomeScreen');
    const messageList = document.getElementById('messageList');

    if (!chat || chat.messages.length === 0) {
        welcomeScreen.classList.remove('hidden');
        messageList.classList.add('hidden');
        messageList.innerHTML = '';
    } else {
        welcomeScreen.classList.add('hidden');
        messageList.classList.remove('hidden');
        renderMessages(chat.messages);
    }

    renderChatHistory();
}

function renderChatHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    chats.forEach(chat => {
        const item = document.createElement('div');
        item.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
        item.onclick = () => switchChat(chat.id);

        item.innerHTML = `
            <span><i class="fa-regular fa-message" style="margin-right:8px;"></i>${escapeHtml(chat.title)}</span>
            <i class="fa-solid fa-xmark" style="font-size:0.75rem;" onclick="deleteChat('${chat.id}', event)"></i>
        `;
        historyList.appendChild(item);
    });
}

function deleteChat(chatId, e) {
    e.stopPropagation();
    chats = chats.filter(c => c.id !== chatId);
    saveLocalChats();
    if (currentChatId === chatId) {
        currentChatId = null;
        if (chats.length > 0) switchChat(chats[0].id);
        else createNewChat();
    } else {
        renderChatHistory();
    }
}

async function sendMessage() {
    const input = document.getElementById('composerInput');
    const text = input.value.trim();
    if (!text && !attachedFile) return;

    if (!currentChatId) createNewChat();

    const chat = chats.find(c => c.id === currentChatId);

    // Auto-title from first message
    if (chat.messages.length === 0) {
        chat.title = text.slice(0, 24) || 'New Chat';
    }

    let fullMessageContent = text;
    if (attachedFile) {
        fullMessageContent += `\n[Attached File: ${attachedFile.name}]`;
    }

    // Append User Message
    chat.messages.push({ role: 'user', content: fullMessageContent });
    input.value = '';
    removeSelectedFile();
    autoExpandTextarea(input);
    switchChat(currentChatId);

    // Append Typing Indicator
    appendTypingIndicator();

    try {
        // Render के Live Backend Server का Full URL
const response = await fetch('https://aivora-ai-l5f2.onrender.com/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        message: fullMessageContent,
        history: chat.messages.slice(0, -1)
    })
});
        const data = await response.json();
        removeTypingIndicator();

        if (response.ok) {
            chat.messages.push({ role: 'assistant', content: data.reply });
        } else {
            chat.messages.push({ role: 'assistant', content: `Error: ${data.error || 'Something went wrong.'}` });
        }
    } catch (err) {
        removeTypingIndicator();
        chat.messages.push({ role: 'assistant', content: "Network error. Make sure backend server is running on port 3000." });
    }

    saveLocalChats();
    switchChat(currentChatId);
}

function renderMessages(messages) {
    const messageList = document.getElementById('messageList');
    messageList.innerHTML = '';

    messages.forEach(msg => {
        const wrapper = document.createElement('div');
        wrapper.className = `msg-wrapper ${msg.role === 'user' ? 'user' : 'ai'}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';

        if (msg.role === 'user') {
            bubble.textContent = msg.content;
        } else {
            bubble.innerHTML = marked.parse(msg.content);
        }

        wrapper.appendChild(bubble);
        messageList.appendChild(wrapper);
    });

    hljs.highlightAll();
    messageList.scrollTop = messageList.scrollHeight;
}

function appendTypingIndicator() {
    const messageList = document.getElementById('messageList');
    const wrapper = document.createElement('div');
    wrapper.id = 'typingIndicator';
    wrapper.className = 'msg-wrapper ai';
    wrapper.innerHTML = `<div class="msg-bubble"><i class="fa-solid fa-spinner fa-spin"></i> Thinking...</div>`;
    messageList.appendChild(wrapper);
    messageList.scrollTop = messageList.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

// Helpers
function autoExpandTextarea(element) {
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
    document.getElementById('sendBtn').disabled = !element.value.trim();
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function useSuggestion(text) {
    document.getElementById('composerInput').value = text;
    autoExpandTextarea(document.getElementById('composerInput'));
    sendMessage();
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    attachedFile = file;
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('filePreview').classList.remove('hidden');
}

function removeSelectedFile() {
    attachedFile = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('filePreview').classList.add('hidden');
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function clearCurrentChat() {
    if (currentChatId) deleteChat(currentChatId, new Event('click'));
}

function openSettingsModal() { document.getElementById('settingsModal').classList.remove('hidden'); }
function closeSettingsModal() { document.getElementById('settingsModal').classList.add('hidden'); }

function changeTheme(theme) {
    document.body.className = theme === 'light' ? 'light-theme' : 'dark-theme';
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}












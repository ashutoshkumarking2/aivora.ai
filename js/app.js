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
    const saved = localStorage.getItem(`aivora_chats_${currentUser ? currentUser.uid : 'guest'}`);
    chats = saved ? JSON.parse(saved) : [];
}

function saveLocalChats() {
    localStorage.setItem(`aivora_chats_${currentUser ? currentUser.uid : 'guest'}`, JSON.stringify(chats));
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
        if (welcomeScreen) welcomeScreen.classList.remove('hidden');
        if (messageList) {
            messageList.classList.add('hidden');
            messageList.innerHTML = '';
        }
    } else {
        if (welcomeScreen) welcomeScreen.classList.add('hidden');
        if (messageList) {
            messageList.classList.remove('hidden');
            renderMessages(chat.messages);
        }
    }

    renderChatHistory();
}

function renderChatHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
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
    if (e) e.stopPropagation();
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
    const sendBtn = document.getElementById('sendBtn');
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

    // Disable button & Append Typing Indicator
    if (sendBtn) sendBtn.disabled = true;
    appendTypingIndicator();

    try {
        // 1. Render Backend पर Request भेजें
        const response = await fetch('https://aivora-ai-l5f2.onrender.com/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: fullMessageContent,
                history: chat.messages.slice(0, -1)
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.details || data.error || "Server error occurred");
        }

        // 2. AI का जवाब निकालें
        const botReply = data.reply || data.text || "No response text received.";
        chat.messages.push({ role: 'assistant', content: botReply });

    } catch (error) {
        console.error("Error communicating with AI:", error);
        chat.messages.push({ 
            role: 'assistant', 
            content: `Error: ${error.message}` 
        });
    } finally {
        // 3. Cleanup: Typing indicator हटाएं और UI अपडेट करें
        removeTypingIndicator();
        saveLocalChats();
        switchChat(currentChatId);
        if (sendBtn) sendBtn.disabled = false;
        input.focus();
    }
}

function renderMessages(messages) {
    const messageList = document.getElementById('messageList');
    if (!messageList) return;
    messageList.innerHTML = '';

    messages.forEach(msg => {
        const wrapper = document.createElement('div');
        wrapper.className = `msg-wrapper ${msg.role === 'user' ? 'user' : 'ai'}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';

        if (msg.role === 'user') {
            bubble.textContent = msg.content;
        } else {
            // Marked parser fallback in case window.marked is not defined
            if (typeof marked !== 'undefined') {
                bubble.innerHTML = marked.parse(msg.content);
            } else {
                bubble.textContent = msg.content;
            }
        }

        wrapper.appendChild(bubble);
        messageList.appendChild(wrapper);
    });

    if (typeof hljs !== 'undefined') {
        hljs.highlightAll();
    }
    messageList.scrollTop = messageList.scrollHeight;
}

function appendTypingIndicator() {
    const messageList = document.getElementById('messageList');
    if (!messageList) return;
    
    // Check if already exists
    if (document.getElementById('typingIndicator')) return;

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
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) sendBtn.disabled = !element.value.trim();
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function useSuggestion(text) {
    const input = document.getElementById('composerInput');
    if (input) {
        input.value = text;
        autoExpandTextarea(input);
        sendMessage();
    }
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
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
    const filePreview = document.getElementById('filePreview');
    if (filePreview) filePreview.classList.add('hidden');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

function clearCurrentChat() {
    if (currentChatId) deleteChat(currentChatId, new Event('click'));
}

function openSettingsModal() { 
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('hidden'); 
}

function closeSettingsModal() { 
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.add('hidden'); 
}

function changeTheme(theme) {
    document.body.className = theme === 'light' ? 'light-theme' : 'dark-theme';
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

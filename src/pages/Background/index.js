class BackgroundScript {
  constructor() {
    this.addButtonEventListener();
    this.addClearTextListener();
    this.addGetPromptListener();
  }

  addButtonEventListener() {
    chrome.runtime.onMessage.addListener(async (message, sender, response) => {
      if (message.type === 'GPT_BUTTON_CLICKED') {
        this.text = message.text;
        this.sendChatgptPrompt();
      }
    });
  }

  sendChatgptPrompt() {
    this.getActiveTabInformation((tab) => {
      if (tab) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'NEW_PROMPT',
        });
      } else {
        console.error('No active tab found.');
      }
    });
  }

  getActiveTabInformation(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        callback(tabs[0]);
      } else {
        callback(null);
      }
    });
  }

  addGetPromptListener() {
    chrome.runtime.onMessage.addListener((message, sender, response) => {
      if (message.type === 'GET_PROMPT') {
        response(this.text);
      }
    });
  }

  addClearTextListener() {
    chrome.runtime.onMessage.addListener((message, sender, response) => {
      if (message.type === 'CLEAR_TEXT') {
        this.text = '';
      }
    });
  }
}

const bg = new BackgroundScript();

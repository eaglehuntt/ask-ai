class BackgroundScript {
  constructor() {
    this.addContextMenu(); // Call the addContextMenu method
    this.addButtonEventListener();
    this.addClearTextListener();
    this.addGetPromptListener();
    this.addContextMenuEventListener();
  }

  addContextMenu() {
    chrome.runtime.onInstalled.addListener(() => {
      chrome.contextMenus.create({
        title: 'Ask AI',
        id: 'basic',
        contexts: ['selection'],
      });

      chrome.contextMenus.create({
        title: 'Ask AI with Saved Text',
        id: 'saved',
        contexts: ['selection'],
      });
    });
  }
  addContextMenuEventListener() {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'basic') {
        this.text = info.selectionText;
        this.sendChatgptPrompt();
      } else {
        // do later
      }
      console.log(info);
    });
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
        chrome.tabs.create(
          { url: 'https://chat.openai.com', active: true },
          (tab) => {
            // Perform actions on the newly created tab if needed
          }
        );
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

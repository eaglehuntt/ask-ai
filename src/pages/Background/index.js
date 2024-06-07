class BackgroundScript {
  constructor() {
    this.addContextMenu(); // Set up context menu items
    this.addButtonEventListener(); // Listen for messages related to button clicks
    this.addClearTextListener(); // Listen for messages to clear text
    this.addGetPromptListener(); // Listen for messages to get the current prompt text
    this.addContextMenuEventListener(); // Handle context menu item clicks
  }

  // Create context menu items when the extension is installed
  addContextMenu() {
    chrome.runtime.onInstalled.addListener(() => {
      chrome.contextMenus.create({
        title: 'Text Only',
        id: 'basic',
        contexts: ['selection'], // Context menu item appears when text is selected
      });

      chrome.contextMenus.create({
        title: 'With Recipe',
        id: 'saved',
        contexts: ['selection'], // Context menu item appears when text is selected
      });

      chrome.contextMenus.create({
        title: 'Settings',
        id: 'settings',
        contexts: ['selection'], // Context menu item appears when text is selected
      });
    });
  }

  // Method to handle clicks on context menu items
  addContextMenuEventListener() {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'basic') {
        // If the 'Text Only' item was clicked
        this.text = info.selectionText; // Store the selected text
        this.sendChatgptPrompt(); // Send the stored text to ChatGPT
      } else if (info.menuItemId === 'settings') {
        // If the 'Settings' item was clicked
        chrome.runtime.openOptionsPage(); // Open the extension's options page
      } else if (info.menuItemId === 'saved') {
        // If the 'With Recipe' item was clicked
        chrome.storage.sync.get(['savedPrompt']).then((result) => {
          this.text = result.savedPrompt + info.selectionText; // Append selected text to saved prompt
          this.sendChatgptPrompt(); // Send the combined text to ChatGPT
        });
      }
    });
  }

  // Method to listen for messages indicating that a GPT button was clicked. This will be used for future updates
  addButtonEventListener() {
    chrome.runtime.onMessage.addListener(async (message, sender, response) => {
      if (message.type === 'GPT_BUTTON_CLICKED') {
        this.text = message.text; // Store the text from the message
        this.sendChatgptPrompt(); // Send the stored text to ChatGPT
      }
    });
  }

  // Method to open chatGPT
  sendChatgptPrompt() {
    this.getActiveTabInformation((tab) => {
      if (tab) {
        // Open a new tab with ChatGPT's URL
        chrome.tabs.create(
          { url: 'https://chat.openai.com', active: true },
          (tab) => {}
        );
      } else {
        console.error('No active tab found.'); // Log an error if no active tab is found
      }
    });
  }

  // Method to get information about the active tab
  getActiveTabInformation(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        callback(tabs[0]); // Pass the active tab to the callback
      } else {
        callback(null); // Pass null if no active tab is found
      }
    });
  }

  // Method to listen for messages requesting the current prompt text. This is called when the content script successfully loads chatgpt
  addGetPromptListener() {
    chrome.runtime.onMessage.addListener((message, sender, response) => {
      if (message.type === 'GET_PROMPT') {
        response(this.text); // Respond with the stored text
      }
    });
  }

  // Method to listen for messages requesting to clear the stored text (Will be used in future updates)
  addClearTextListener() {
    chrome.runtime.onMessage.addListener((message, sender, response) => {
      if (message.type === 'CLEAR_TEXT') {
        this.text = ''; // Clear the stored text.
      }
    });
  }
}
const bg = new BackgroundScript();

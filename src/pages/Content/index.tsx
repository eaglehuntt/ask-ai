/*
ContentScirpt workflow:

  1. When the CS is initialized, a GPT button is created and appends itself to the YouTube toolbar. 
  
  2. The CS polls the current tab's URL every 500ms to check if the URL has changed. If so reinitialize the object. The functions are designed in a a way that the CS will not have unexpected behavior (ideally). 

  3. [ GPT_BUTTON_CLICKED ] : Sent when user clicks the GPT button.

  4. [ CLICK_CC_BUTTON ] : Received from BGS.

  5. CS automatically clicks the Closed Captions button in the YouTube toolbar. This causes YouTube to fetch the transcript from the API.
  
  6. [ SAFE_FOR_GPT_PROMPT ] : Sent to BGS after we can ensure that YouTube has sent the transcript API request.

  7. [ NEW_GPT_PROMPT ] : Received from BGS once it has parsed the transcript JSON and has it as a string

  8. [ GET_TRANSCRIPT ] : Sent to BGS and waits for its response. 
  
  9. Goes to ChatGPT and pastes the response string into the chatbar.

TODO: 
  - Refactor initializeContentScript, GET_TRANSCRIPT is being called twice
  - Bug: Sometimes GPT button does not show up in toolbar
  - expand chatgpt chatbar? (bug?)
  
*/

class ContentScript {
  private gptButtonContainer: HTMLDivElement | undefined;
  private gptButton: HTMLImageElement | undefined;
  private currentUrl: string | undefined;

  constructor() {
    this.addNewGptPromptListener();

    this.currentUrl = window.location.href;
    this.setAction();

    // Poll the URL for changes every 500 milliseconds (adjust the interval as needed)
    setInterval(() => {
      this.checkUrlChange();
    }, 500);

    console.log('Working... kind of');
  }

  private setAction() {
    // Refactor

    setTimeout(() => {
      this.addGptButton();
    }, 3000);

    if (window.location.href !== this.currentUrl) {
      this.currentUrl = window.location.href;
    } else if (window.location.href.includes('chat.openai.com')) {
      this.pasteGptPrompt();
    }
  }

  private checkUrlChange() {
    if (window.location.href !== this.currentUrl) {
      this.setAction();
    }
  }

  private addNewGptPromptListener() {
    chrome.runtime.onMessage.addListener((message, sender, response) => {
      const { type, text } = message;
      console.log('got new prompt message');
      if (type === 'NEW_PROMPT') {
        console.log('this.sendGptPrompt');
        this.sendGptPrompt();
      }
    });
  }

  private pasteGptPrompt() {
    chrome.runtime.sendMessage({ type: 'GET_PROMPT' }, (response) => {
      setTimeout(() => {
        const promptArea = document.getElementById(
          'prompt-textarea'
        ) as HTMLTextAreaElement;

        if (promptArea) {
          setTimeout(() => {
            promptArea.value = response;
            // chrome.runtime.sendMessage({ type: 'CLEAR_TEXT' });
          }, 1000);
        }
      }, 1000);
    });
  }

  private addGptButton() {
    if (!this.gptButtonContainer) {
      this.gptButtonContainer = document.createElement('div');
    }

    if (!this.gptButton) {
      this.gptButton = document.createElement('img');
      this.gptButton.style.cursor = 'pointer';
      this.gptButton.src = chrome.runtime.getURL('icon-34.png'); // Update the image URL
      this.gptButton.className = 'ytp-button ' + 'gpt-button';
      this.gptButton.title = 'Start a ChatGPT prompt';

      this.gptButton.style.position = 'fixed';
      this.gptButton.style.top = '10px';
      this.gptButton.style.left = '10px';
      this.gptButton.style.zIndex = '9999';
      this.gptButton.style.width = '50px';
    }

    if (!this.gptButtonContainer.contains(this.gptButton)) {
      this.gptButtonContainer.appendChild(this.gptButton);

      if (
        this.currentUrl &&
        !this.currentUrl.includes('https://chat.openai.com/')
      ) {
        document.body.appendChild(this.gptButtonContainer);
      }

      this.gptButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({
          type: 'GPT_BUTTON_CLICKED',
          text: 'placeholder text',
        });
      });
    }
  }

  private sendGptPrompt() {
    // Open a new tab with your target URL
    const newTab = window.open('https://chat.openai.com/', '_blank');
  }
}

const contentScript = new ContentScript();

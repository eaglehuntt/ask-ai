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

  private async setAction() {
    // Refactor

    setTimeout(() => {
      this.addGptButton();
    }, 1000);

    let dynamicElement: any;

    if (window.location.href !== this.currentUrl) {
      this.currentUrl = window.location.href;
    } else if (window.location.href.includes('chat.openai.com')) {
      await this.pasteGptPrompt();
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

  private async pasteGptPrompt(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      function simulateTyping(
        text: string,
        targetElement: HTMLTextAreaElement
      ) {
        return new Promise<void>((resolve, reject) => {
          async function typeCharacter(char: string, index: number) {
            setTimeout(function () {
              targetElement.value += char;

              targetElement.dispatchEvent(
                new KeyboardEvent('keydown', {
                  key: char,
                  keyCode: char.charCodeAt(0),
                  code: `Key${char.toUpperCase()}`,
                })
              );

              targetElement.dispatchEvent(
                new KeyboardEvent('keypress', {
                  key: char,
                  keyCode: char.charCodeAt(0),
                  code: `Key${char.toUpperCase()}`,
                })
              );

              targetElement.dispatchEvent(
                new KeyboardEvent('input', { bubbles: true })
              );

              setTimeout(function () {
                targetElement.dispatchEvent(
                  new KeyboardEvent('keyup', {
                    key: char,
                    keyCode: char.charCodeAt(0),
                    code: `Key${char.toUpperCase()}`,
                  })
                );
              }, 10);

              if (index + 1 < text.length) {
                typeCharacter(text[index + 1], index + 1);
              } else {
                resolve(); // Resolve the promise when typing is complete
              }
            }, 10);
          }

          typeCharacter(text[0], 0);
        });
      }

      chrome.runtime.sendMessage({ type: 'GET_PROMPT' }, (response) => {
        setTimeout(() => {
          const promptArea = document.getElementById(
            'prompt-textarea'
          ) as HTMLTextAreaElement;

          if (promptArea) {
            setTimeout(async () => {
              await simulateTyping(response, promptArea);
              // chrome.runtime.sendMessage({ type: 'CLEAR_TEXT' });
              setTimeout(() => {
                let x: any = document.getElementsByClassName(
                  'absolute bottom-1.5 right-2 rounded-lg border border-black bg-black p-0.5 text-white transition-colors enabled:bg-black disabled:text-gray-400 disabled:opacity-10 dark:border-white dark:bg-white dark:hover:bg-white md:bottom-3 md:right-3'
                )[0];
                x.click();
                resolve(); // Resolve the outer promise when everything is complete
              }, 100);
            }, 1000);
          }
        }, 1000);
      });
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
        console.log('clicked');
        // You can also send a message to the background script if needed
        chrome.runtime.sendMessage({
          type: 'GPT_BUTTON_CLICKED',
          text: 'whats 9+10?',
        });
      });
    }
  }

  private sendGptPrompt() {
    // Open a new tab with your target URL
    // const newTab = window.open('https://chat.openai.com/', '_blank');
  }
}

const contentScript = new ContentScript();

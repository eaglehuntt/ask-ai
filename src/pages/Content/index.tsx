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
  private currentUrl: string | undefined;

  constructor() {
    this.currentUrl = window.location.href;
    this.setAction();

    // Poll the URL for changes every 500 milliseconds (adjust the interval as needed)
    setInterval(() => {
      this.checkUrlChange();
    }, 500);
  }

  private async setAction() {
    // Refactor

    // setTimeout(() => {
    //   this.addGptButton();
    // }, 1000);

    let dynamicElement: any;

    if (window.location.href !== this.currentUrl) {
      this.currentUrl = window.location.href;
    } else if (window.location.href.includes('chatgpt.com')) {
      console.log('pasting');
      await this.pasteGptPrompt();
    }
  }

  private checkUrlChange() {
    if (window.location.href !== this.currentUrl) {
      this.setAction();
    }
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
                let sendButton: any = document.querySelector(
                  '[data-testid="fruitjuice-send-button"]'
                );
                sendButton.click();
                resolve(); // Resolve the outer promise when everything is complete
              }, 100);
            }, 2000);
          }
        }, 1000);
      });
    });
  }
}

const contentScript = new ContentScript();

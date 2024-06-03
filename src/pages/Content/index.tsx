class ContentScript {
  private currentUrl: string | undefined;

  constructor() {
    this.currentUrl = window.location.href;
    this.setAction();

    // Poll the URL for changes every 500 milliseconds
    setInterval(() => {
      this.checkUrlChange();
    }, 500);
  }

  // This determines the "mode" the content script is in.
  // Either in standby or paste.
  // Only does something if currentUrl is chatgpt.com
  private async setAction() {
    if (window.location.href !== this.currentUrl) {
      this.currentUrl = window.location.href;
    } else if (window.location.href.includes('chatgpt.com')) {
      console.log('pasting');
      await this.retryPasteGptPrompt();
    }
  }

  // Check url and determine what "mode" to take
  private checkUrlChange() {
    if (window.location.href !== this.currentUrl) {
      this.setAction();
    }
  }

  // Wrapper method to attempt to paste highlighted text.
  // If this fails, it will retry for a specified interval.
  private async retryPasteGptPrompt(retries = 5, interval = 1000) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await this.pasteGptPrompt();
        return; // Exit if the function succeeds
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        if (attempt < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, interval));
        }
      }
    }
    console.error(`All ${retries} attempts failed.`);
  }

  private async pasteGptPrompt(): Promise<void> {
    /* 
      This method is the extensions main functionality. It looks sort of complex but can be broken down into 3 main steps:

      1. Get user's highlighted text with Chrome API and get the prompt text area
      2. Simulate typing the text
      3. Finally, click the sendButton then resolve the outer promise
    
    */

    // Wrap in a promise so we can await this in the retryPastGptPrompt()
    return new Promise<void>((resolve, reject) => {
      /* 
        STEP 1. Get user's highlighted text with Chrome API and get the prompt text area
      */

      // Use Chrome API to get the user's highlight text from the backgroundScript
      chrome.runtime.sendMessage({ type: 'GET_PROMPT' }, (response) => {
        if (!response) {
          console.error('No response received from GET_PROMPT');
          reject('No response received from GET_PROMPT');
          return;
        }

        // Wait for a duration then attempt to get the prompt text area in the HTML. This a workaround because waiting for page load seemed to be unreliable

        setTimeout(() => {
          // Store the prompt area as a TypeScript HTML element
          const promptArea = document.getElementById(
            'prompt-textarea'
          ) as HTMLTextAreaElement;

          // Reject the promise if if do not find the prompt area
          if (!promptArea) {
            console.error('Prompt textarea not found');
            reject('Prompt textarea not found');
            return;
          }

          /* 
            STEP 2. Simulate typing the text
          */
          setTimeout(async () => {
            try {
              await this.simulateTyping(response, promptArea);
            } catch (error) {
              console.error('Error during simulateTyping:', error);
              reject(error);
              return;
            }

            // chrome.runtime.sendMessage({ type: 'CLEAR_TEXT' }); // this is only here so I remember the CLEAR_TEXT message in the future

            /* 
              STEP 3. Click the sendButton then resolve the outer promise

              Currently, chatgpt has 2 different interfaces with alternate data-testid's. It changes depending if the user is logged in or not, so this is a hacky way to fix the bug. 
            */
            setTimeout(() => {
              let sendButton = document.querySelector(
                '[data-testid="fruitjuice-send-button"]'
              ) as any;

              if (!sendButton) {
                try {
                  sendButton = document.querySelector(
                    '[data-testid="send-button"]'
                  ) as any;
                  sendButton.click();
                } catch {
                  console.error('Send button not found');
                  reject('Send button not found');
                }
                return;
              } else {
                sendButton.click();
              }

              resolve();

              // Adjust delays for each step in ms
            }, 100); // 1. Click sendButton
          }, 1000); // 2. Simulate typing
        }, 1000); // 3. Get sendButton
      });
    });
  }

  private simulateTyping(text: string, targetElement: HTMLTextAreaElement) {
    /* 

    I eventually want to refactor this to simulate a "paste" because when there is a large amount of text highlighted the user experience is awful. 

    But, I found the current solution on Stackoverflow  https://stackoverflow.com/questions/596481/is-it-possible-to-simulate-key-press-events-programmatically

    */

    // Return a promise that will be resolved when the typing simulation is complete
    return new Promise<void>((resolve, reject) => {
      // Async recursive function to type each character with a delay
      async function typeCharacter(char: string, index: number) {
        // Set a timeout to simulate typing delay
        setTimeout(function () {
          // Append the character to the target HTML element's value
          targetElement.value += char;

          // Dispatch a 'keydown' event to simulate pressing a key down
          targetElement.dispatchEvent(
            new KeyboardEvent('keydown', {
              key: char, // Key value
              keyCode: char.charCodeAt(0), // Key code
              code: `Key${char.toUpperCase()}`, // Physical key code
            })
          );

          // Dispatch a 'keypress' event to simulate key press, confirming we actually pressed it
          targetElement.dispatchEvent(
            new KeyboardEvent('keypress', {
              key: char,
              keyCode: char.charCodeAt(0),
              code: `Key${char.toUpperCase()}`,
            })
          );

          // Dispatch an 'input' event to simulate text input
          targetElement.dispatchEvent(
            new KeyboardEvent('input', { bubbles: true })
          );

          // Set a short timeout before dispatching the 'keyup' event (keydown and keyup physically cannot occur at the same time)
          setTimeout(function () {
            // Dispatch a 'keyup' event to simulate releasing a key
            targetElement.dispatchEvent(
              new KeyboardEvent('keyup', {
                key: char,
                keyCode: char.charCodeAt(0),
                code: `Key${char.toUpperCase()}`,
              })
            );
          }, 10);

          // If there are more characters to type, do a recursive function call
          if (index + 1 < text.length) {
            typeCharacter(text[index + 1], index + 1);
          } else {
            resolve(); // Resolve the promise when typing is complete
          }
        }, 10);
      }

      // Start typing the first character to start the function call stack
      typeCharacter(text[0], 0);
    });
  }
}

const contentScript = new ContentScript();

import React, { useState, useEffect } from 'react';
import './Options.css';

const Options = () => {
  const [textField, setTextField] = useState('');
  const [savedMessage, setSavedMessage] = useState(false);
  const [savedPrompt, setSavedPrompt] = useState('');

  // Fetch saved prompt on page load
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_SAVED_PROMPT' }, (response) => {
      if (response && response.prompt) {
        setSavedPrompt(response.prompt);
      } else {
        setSavedPrompt('No saved prompt');
      }
    });
  }, []);

  useEffect(() => {
    if (textField === '') return;

    const timer = setTimeout(() => {
      setSavedMessage(true);
      setSavedPrompt(textField); // Update the saved prompt with the textField value
      chrome.runtime.sendMessage({ type: 'SAVE_PROMPT', prompt: textField });
    }, 1000);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      setSavedMessage(false);
    };
  }, [textField]);

  const handleTextFieldChange = (event) => {
    setTextField(event.target.value);
  };

  return (
    <>
      <div className="container">
        <h1 id="title">Custom Prompt</h1>
        <div id="subtitle">
          Tip: This will add a message before your highlighted text is sent to
          AI
        </div>
        <div id="input-container">
          <input
            id="input-field"
            type="text"
            value={textField}
            onChange={handleTextFieldChange}
          />
          <div
            className={`saved-message ${savedMessage ? 'fade-in' : 'fade-out'}`}
          >
            Saved
          </div>
        </div>
        <div id="saved-prompt">{savedPrompt}</div>
      </div>
    </>
  );
};

export default Options;

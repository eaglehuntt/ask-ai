import React, { useState, useEffect } from 'react';
import './Options.css';
import { Checkmark } from 'react-checkmark';
import ReactiveButton from 'reactive-button';

const Options = () => {
  const [textField, setTextField] = useState('');
  const [savedPrompt, setSavedPrompt] = useState('');
  const [saveButtonState, setSaveButtonState] = useState('idle');
  const [fade, setFade] = useState(true); // State to control the fade effect

  useEffect(() => {
    restoreOptions();
    getSavedPrompt();
  }, []);

  const saveOptions = () => {
    setFade(false); // Start the fade-out effect
    chrome.storage.sync.set({ savedPrompt: textField }, () => {
      setTimeout(() => {
        setSaveButtonState('success');
        restoreOptions();
        getSavedPrompt();
        setFade(true); // Start the fade-in effect
      }, 1000);
    });
  };

  const restoreOptions = () => {
    chrome.storage.sync.get({ savedPrompt: '' }, (items) => {
      setTextField(items.savedPrompt);
    });
  };

  const getSavedPrompt = () => {
    chrome.storage.sync.get(['savedPrompt'], (result) => {
      setSavedPrompt(result.savedPrompt);
    });
  };

  const handleSaveButton = () => {
    setSaveButtonState('loading');
    saveOptions();
  };

  const handleTextFieldChange = (event) => {
    setTextField(event.target.value);
  };

  return (
    <>
      <div className="container">
        <h1 id="title">Edit Recipe</h1>
        <div id="subtitle">
          Tip: This will add a message before your highlighted text is sent to
          AI
        </div>
        <div id="input-container">
          <textarea
            id="input-field"
            type="text"
            value={textField}
            onChange={handleTextFieldChange}
            rows={3}
          />
          <div className="save-button">
            <ReactiveButton
              size="normal"
              onClick={handleSaveButton}
              idleText="Save"
              loadingText="Loading"
              successText={'Success'}
              buttonState={saveButtonState} // Pass the button state as a prop
              messageDuration={1000}
              outline={true}
              color="blue"
              rounded={true}
              block={true}
              className=""
            />
          </div>
        </div>
        <div className="preview-container">
          <h3>Preview:</h3>
          <div id={`saved-prompt`} className={fade ? 'fade-in' : 'fade-out'}>
            {savedPrompt ? savedPrompt + ' {Highlighted text}' : ''}
          </div>
        </div>
      </div>
    </>
  );
};

export default Options;

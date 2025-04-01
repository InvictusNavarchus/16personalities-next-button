// ==UserScript==
// @name         16Personalities - Enhanced Navigation
// @namespace    http://tampermonkey.net/
// @version      0.2.0
// @description  Adds 'Next', 'Go to Second-to-Last Page', and 'Go to Last Page' buttons to the top of the 16Personalities test.
// @author       Invictus (modified by AI)
// @match        https://www.16personalities.com/free-personality-test
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const CHECK_INTERVAL = 500; // How often to check for elements (milliseconds)
    const MAX_CHECKS = 20; // How many times to check before giving up
    const AUTO_PAGE_INTERVAL = 200; // Delay between clicks for auto-paging (milliseconds)
    const SECOND_LAST_PAGE_PERCENTAGE = 80; // Target percentage for the second-to-last page

    let autoPagingIntervalId = null; // To store the interval ID for auto-paging functions
    let activeAutoButton = null; // To keep track of which auto-button was clicked

    /**
     * Waits for an element to appear in the DOM.
     * @param {string} selector - The CSS selector for the element.
     * @param {function} callback - The function to execute once the element is found.
     * @param {number} [checkCount=0] - Internal counter for checks.
     */
    function waitForElement(selector, callback, checkCount = 0) {
        const element = document.querySelector(selector);
        if (element) {
            callback();
        } else if (checkCount < MAX_CHECKS) {
            setTimeout(() => waitForElement(selector, callback, checkCount + 1), CHECK_INTERVAL);
        } else {
            console.warn(`Quiz Enhancer: Element "${selector}" not found after ${MAX_CHECKS * CHECK_INTERVAL}ms.`);
        }
    }

    /**
     * Finds the original button at the bottom of the form.
     * @returns {HTMLElement|null} The button element or null if not found.
     */
    function getOriginalButton() {
        return document.querySelector('form[data-quiz] .action-row button');
    }

    /**
      * Finds the percentage display element.
      * @returns {HTMLElement|null} The percentage element or null if not found.
      */
    function getPercentageElement() {
        return document.querySelector('#progress-wrapper .percentage');
    }

    /**
     * Re-enables the top buttons and clears the interval after an auto-paging action.
     * @param {HTMLElement} nextBtn - The top 'Next' button.
     * @param {HTMLElement} secondLastBtn - The 'Go to Second-to-Last Page' button.
     * @param {HTMLElement} lastBtn - The 'Go to Last Page' button.
     */
    function finishAutoPagingAction(nextBtn, secondLastBtn, lastBtn) {
        if (autoPagingIntervalId) {
            clearInterval(autoPagingIntervalId);
            autoPagingIntervalId = null;
        }
        // Re-enable all buttons
        if (nextBtn) nextBtn.disabled = false;
        if (secondLastBtn) secondLastBtn.disabled = false;
        if (lastBtn) lastBtn.disabled = false;

        // Reset the text of the button that was active
        if (activeAutoButton) {
            if (activeAutoButton === secondLastBtn) {
                 activeAutoButton.textContent = `Go to ${SECOND_LAST_PAGE_PERCENTAGE}% Page`;
            } else if (activeAutoButton === lastBtn) {
                 activeAutoButton.textContent = 'Go to Last Page';
            }
             activeAutoButton = null; // Clear the active button tracker
        }
         console.log("Quiz Enhancer: Auto-paging action finished or stopped.");
    }

    /**
     * Creates and adds the top navigation buttons.
     */
    function addTopButtons() {
        const form = document.querySelector('form[data-quiz]');
        const originalActionRow = document.querySelector('form[data-quiz] .action-row');
        const originalButton = getOriginalButton(); // Get it once for class copying

        // Ensure the form and original button container exist, and we haven't added buttons already
        if (!form || !originalActionRow || !originalButton || document.getElementById('tm-top-buttons-container')) {
             if (document.getElementById('tm-top-buttons-container')) {
                console.log("Quiz Enhancer: Top buttons already exist.");
             } else {
                console.warn("Quiz Enhancer: Form or original action row/button not found initially.");
             }
            return;
        }

        console.log("Quiz Enhancer: Adding top buttons...");

        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'tm-top-buttons-container';
        buttonContainer.style.marginBottom = '20px';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.flexWrap = 'wrap';

        // --- Create Top "Next" Button ---
        const newNextButton = document.createElement('button');
        newNextButton.textContent = 'Next (Top)';
        newNextButton.type = 'button';
        originalButton.classList.forEach(cls => newNextButton.classList.add(cls));
        newNextButton.style.position = 'relative';
        newNextButton.style.width = 'auto';
        newNextButton.addEventListener('click', () => {
            const currentOriginalButton = getOriginalButton();
            if (currentOriginalButton && currentOriginalButton.textContent.trim() === 'Next') {
                console.log("Quiz Enhancer: Clicking original button via Top Next.");
                currentOriginalButton.click();
            } else if (currentOriginalButton) {
                 console.log("Quiz Enhancer: Top Next clicked, but original button is not 'Next' (likely end).");
            } else {
                console.warn("Quiz Enhancer: Original button not found when clicking Top Next.");
            }
        });

        // --- Create "Go to Second-to-Last Page" Button ---
        const newSecondLastButton = document.createElement('button');
        newSecondLastButton.textContent = `Go to ${SECOND_LAST_PAGE_PERCENTAGE}% Page`;
        newSecondLastButton.type = 'button';
        originalButton.classList.forEach(cls => newSecondLastButton.classList.add(cls));
        newSecondLastButton.style.position = 'relative';
        newSecondLastButton.style.width = 'auto';
        // Optional styling:
        // newSecondLastButton.style.backgroundColor = '#6a5acd'; // Slate Blue

        newSecondLastButton.addEventListener('click', () => {
            if (autoPagingIntervalId) return; // Another auto-page action is already running

            console.log(`Quiz Enhancer: Starting 'Go to ${SECOND_LAST_PAGE_PERCENTAGE}% Page'...`);
            activeAutoButton = newSecondLastButton; // Mark this as the active button
            newNextButton.disabled = true;
            newSecondLastButton.disabled = true;
            newLastButton.disabled = true; // Disable other buttons too
            newSecondLastButton.textContent = `Going to ${SECOND_LAST_PAGE_PERCENTAGE}%...`;

            autoPagingIntervalId = setInterval(() => {
                const currentOriginalButton = getOriginalButton();
                const percentageElement = getPercentageElement();

                if (!currentOriginalButton || !percentageElement) {
                    console.warn("Quiz Enhancer: Original button or percentage element disappeared. Stopping.");
                    finishAutoPagingAction(newNextButton, newSecondLastButton, newLastButton);
                    return;
                }

                // Check percentage first
                const percentageText = percentageElement.textContent.trim();
                const currentPercentage = parseInt(percentageText.replace('%', ''), 10);

                if (!isNaN(currentPercentage) && currentPercentage >= SECOND_LAST_PAGE_PERCENTAGE) {
                    console.log(`Quiz Enhancer: Reached or passed ${SECOND_LAST_PAGE_PERCENTAGE}%. Stopping.`);
                    finishAutoPagingAction(newNextButton, newSecondLastButton, newLastButton);
                    return;
                }

                // Check button text if percentage condition not met
                const buttonText = currentOriginalButton.textContent.trim();
                if (buttonText === 'Next') {
                    console.log(`Quiz Enhancer: Clicking Next (auto for ${SECOND_LAST_PAGE_PERCENTAGE}%)...`);
                    currentOriginalButton.click();
                } else {
                    // Button changed to something else (like 'See results' or an error state)
                     console.warn(`Quiz Enhancer: Original button text is "${buttonText}" before reaching ${SECOND_LAST_PAGE_PERCENTAGE}%. Stopping.`);
                     finishAutoPagingAction(newNextButton, newSecondLastButton, newLastButton);
                }

            }, AUTO_PAGE_INTERVAL);
        });


        // --- Create "Go to Last Page" Button ---
        const newLastButton = document.createElement('button');
        newLastButton.textContent = 'Go to Last Page';
        newLastButton.type = 'button';
        originalButton.classList.forEach(cls => newLastButton.classList.add(cls));
         newLastButton.style.position = 'relative';
         newLastButton.style.width = 'auto';
        // Optional styling:
        // newLastButton.style.backgroundColor = '#5a4e9a';

        newLastButton.addEventListener('click', () => {
            if (autoPagingIntervalId) return; // Another auto-page action is already running

            console.log("Quiz Enhancer: Starting 'Go to Last Page'...");
            activeAutoButton = newLastButton; // Mark this as the active button
            newNextButton.disabled = true;
            newSecondLastButton.disabled = true; // Disable other buttons too
            newLastButton.disabled = true;
            newLastButton.textContent = 'Going to last...';

            autoPagingIntervalId = setInterval(() => {
                const currentOriginalButton = getOriginalButton();

                if (!currentOriginalButton) {
                    console.warn("Quiz Enhancer: Original button disappeared during 'Go to Last Page'. Stopping.");
                    finishAutoPagingAction(newNextButton, newSecondLastButton, newLastButton);
                    return;
                }

                const buttonText = currentOriginalButton.textContent.trim();
                if (buttonText === 'See results') {
                    console.log("Quiz Enhancer: Reached 'See results' button.");
                    finishAutoPagingAction(newNextButton, newSecondLastButton, newLastButton);
                } else if (buttonText === 'Next') {
                     console.log("Quiz Enhancer: Clicking Next (auto for Last Page)...");
                    currentOriginalButton.click();
                } else {
                     console.warn(`Quiz Enhancer: Original button text is now "${buttonText}". Stopping.`);
                     finishAutoPagingAction(newNextButton, newSecondLastButton, newLastButton);
                }

            }, AUTO_PAGE_INTERVAL);
        });

        // --- Add buttons to container and container to form ---
        buttonContainer.appendChild(newNextButton);
        buttonContainer.appendChild(newSecondLastButton); // Add the new button here
        buttonContainer.appendChild(newLastButton);
        form.prepend(buttonContainer);

        console.log("Quiz Enhancer: Top buttons added successfully.");
    }

    // --- Start the process ---
    waitForElement('form[data-quiz] .action-row button', addTopButtons);

})();
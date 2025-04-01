// ==UserScript==
// @name         16Personalities - Next Button
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @description  Adds 'Next' and 'Go to Last Page' buttons to the top of a specific quiz form.
// @author       Invictus
// @match        https://www.16personalities.com/free-personality-test
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const CHECK_INTERVAL = 500; // How often to check for elements (milliseconds)
    const MAX_CHECKS = 20; // How many times to check before giving up
    const LAST_PAGE_INTERVAL = 200; // Delay between clicks for 'Go to Last Page' (milliseconds)

    let lastPageIntervalId = null; // To store the interval ID for the 'Last Page' function

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
     * Re-enables the top buttons and clears the interval.
     * @param {HTMLElement} nextBtn - The top 'Next' button.
     * @param {HTMLElement} lastBtn - The 'Go to Last Page' button.
     */
    function finishLastPageAction(nextBtn, lastBtn) {
        if (lastPageIntervalId) {
            clearInterval(lastPageIntervalId);
            lastPageIntervalId = null;
        }
        if (nextBtn) nextBtn.disabled = false;
        if (lastBtn) {
            lastBtn.disabled = false;
            lastBtn.textContent = 'Go to Last Page';
        }
         console.log("Quiz Enhancer: 'Go to Last Page' action finished or stopped.");
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
        buttonContainer.style.marginBottom = '20px'; // Add some space below the buttons
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px'; // Space between buttons
        buttonContainer.style.justifyContent = 'center'; // Center the buttons
        buttonContainer.style.flexWrap = 'wrap'; // Allow wrapping on smaller screens


        // --- Create Top "Next" Button ---
        const newNextButton = document.createElement('button');
        newNextButton.textContent = 'Next (Top)';
        newNextButton.type = 'button'; // Important: Prevent form submission
        // Copy classes for styling (adjust if necessary)
        originalButton.classList.forEach(cls => newNextButton.classList.add(cls));
        newNextButton.style.position = 'relative'; // Override potential fixed positioning if copied
        newNextButton.style.width = 'auto'; // Let button size naturally


        newNextButton.addEventListener('click', () => {
            const currentOriginalButton = getOriginalButton();
            if (currentOriginalButton) {
                console.log("Quiz Enhancer: Clicking original button via Top Next.");
                currentOriginalButton.click();
            } else {
                console.warn("Quiz Enhancer: Original button not found when clicking Top Next.");
            }
        });

        // --- Create "Go to Last Page" Button ---
        const newLastButton = document.createElement('button');
        newLastButton.textContent = 'Go to Last Page';
        newLastButton.type = 'button'; // Important: Prevent form submission
        // Copy classes for styling (adjust if necessary)
        originalButton.classList.forEach(cls => newLastButton.classList.add(cls));
         newLastButton.style.position = 'relative'; // Override potential fixed positioning
         newLastButton.style.width = 'auto'; // Let button size naturally
        // Optional: Make it visually distinct
        // newLastButton.style.backgroundColor = '#5a4e9a'; // Slightly different purple


        newLastButton.addEventListener('click', () => {
            if (lastPageIntervalId) return; // Already running

            console.log("Quiz Enhancer: Starting 'Go to Last Page'...");
            newLastButton.disabled = true;
            newNextButton.disabled = true; // Disable next button too
            newLastButton.textContent = 'Going to last...';

            lastPageIntervalId = setInterval(() => {
                const currentOriginalButton = getOriginalButton();

                if (!currentOriginalButton) {
                    console.warn("Quiz Enhancer: Original button disappeared during 'Go to Last Page'. Stopping.");
                    finishLastPageAction(newNextButton, newLastButton);
                    return;
                }

                // Check button text to see if it's the last page
                const buttonText = currentOriginalButton.textContent.trim();
                if (buttonText === 'See results') {
                    console.log("Quiz Enhancer: Reached 'See results' button.");
                    finishLastPageAction(newNextButton, newLastButton);
                } else if (buttonText === 'Next') {
                    // Only click if it's still a 'Next' button
                     console.log("Quiz Enhancer: Clicking Next (auto)...");
                    currentOriginalButton.click();
                } else {
                    // Button changed to something unexpected
                     console.warn(`Quiz Enhancer: Original button text is now "${buttonText}". Stopping.`);
                     finishLastPageAction(newNextButton, newLastButton);
                }

            }, LAST_PAGE_INTERVAL);
        });

        // --- Add buttons to container and container to form ---
        buttonContainer.appendChild(newNextButton);
        buttonContainer.appendChild(newLastButton);
        form.prepend(buttonContainer); // Add the container at the beginning of the form

        console.log("Quiz Enhancer: Top buttons added successfully.");
    }

    // --- Start the process ---
    // Wait for the original button to exist before adding the new ones
    waitForElement('form[data-quiz] .action-row button', addTopButtons);

})();

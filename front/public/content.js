

/*let lastText = "";
let isProcessing = false;

function getFacebookInput() {
  const input = document.querySelector('div[role="textbox"], textarea');
  return input ? input.innerText || input.value : "";
}

function processText(text) {
  // ตัดให้เหลือ 120 ตัวอักษร
  let processedText = text.slice(0, 120);
  // แปลงเป็นตัวพิมพ์เล็ก
  processedText = processedText.toLowerCase();
  // ลบอิโมจิ (ใช้ regex เพื่อลบ Unicode อิโมจิ)
  processedText = processedText.replace(
    /[\p{Emoji}\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu,
    ""
  );
  // ลบ whitespace ส่วนเกินและเก็บเป็นประโยคเดียว
  processedText = processedText.trim();
  return processedText;
}

function sendToModel(text) {
  if (isProcessing || !text) return;

  isProcessing = true;
  chrome.runtime.sendMessage(
    {
      message: "check_toxicity",
      text: text,
    },
    (response) => {
      isProcessing = false;
      if (response.error) {
        console.error("Error:", response.error);
        chrome.runtime.sendMessage({
          message: "toxicity_result",
          result: "เกิดข้อผิดพลาดในการตรวจสอบ",
          originalText: text,
        });
        return;
      }
      chrome.runtime.sendMessage({
        message: "toxicity_result",
        result: response.result,
        originalText: text,
      });
    }
  );
}

function observeInput() {
  const observer = new MutationObserver(() => {
    const rawText = getFacebookInput();
    const processedText = processText(rawText);
    if (processedText !== lastText) {
      lastText = processedText;
      sendToModel(processedText);
    }
  });

  const input = document.querySelector('div[role="textbox"], textarea');
  if (input) {
    observer.observe(input, { childList: true, characterData: true, subtree: true });
  }
}

window.addEventListener("load", () => {
  setTimeout(observeInput, 1000);
});

*/

let lastText = "";
let observer = null;
let inputElement = null;

function getFacebookInput() {
  const selectors = [
    'div[role="textbox"]',
    'textarea',
    'div[contenteditable="true"]',
    '[data-lexical-editor="true"]',
    'div[aria-label*="Write a comment"]',
    'div[aria-label*="Message"]',
    'div[data-testid="status-attachment-mentions-input"]'
  ];
  
  for (let selector of selectors) {
    const input = document.querySelector(selector);
    if (input && (input.innerText || input.value || input.textContent)) {
      console.log(`Found input with selector: ${selector}, text sample: "${(input.innerText || input.value || input.textContent).slice(0, 20)}..."`);
      return input;
    }
  }
  console.log('No valid input element found with any selector');
  return null;
}


function splitSentences(text) {
  const sentences = text.match(/[^.!?\n]+[.!?\n]?/g) || [text];
  console.log('Split sentences:', sentences);
  return sentences;
}

function processText(text) {
  if (typeof text !== "string") return "";
  let processedText = text.slice(0, 120);
  processedText = processedText.toLowerCase();
  processedText = processedText.replace(
    /[\p{Emoji}\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu,
    ""
  );
  processedText = processedText.trim();
  console.log("Processed text:", processedText);
  return processedText;
}

function highlightAllSentences(element, sentences) {
  if (!element || !sentences) {
    console.log('Highlight failed: Missing element or sentences');
    return;
  }
  
  let html = element.innerHTML || sentences.join("");
  let hasChanges = false;
  
  sentences.forEach((sentence) => {
    const escapedSentence = sentence.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedSentence, "g");
    if (html.match(regex)) {
      html = html.replace(regex, `<span style="background-color: yellow; color: black; padding: 2px; border-radius: 3px;">${sentence}</span>`);
      hasChanges = true;
      console.log(`Highlighted sentence: ${sentence}`);
    }
  });
  
  if (hasChanges && html !== element.innerHTML) {
    try {
      element.innerHTML = html;
      console.log('Successfully applied highlight to all sentences');
    } catch (e) {
      console.error('Failed to apply highlight:', e);
    }
  } else {
    console.log('No highlight applied or no change needed');
  }
}

function sendToModel(sentences, element) {
  if (!sentences || sentences.length === 0) {
    console.log('No sentences to send to model');
    return;
  }

  const results = new Array(sentences.length).fill(null);
  
  sentences.forEach((sentence, index) => {
    const processedText = processText(sentence);
    if (!processedText) return;

    console.log(`Sending to model: ${processedText} (index: ${index})`);
    chrome.runtime.sendMessage(
      {
        message: "check_toxicity",
        text: processedText,
        originalSentence: sentence,
        sentenceIndex: index
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('SendMessage error:', chrome.runtime.lastError.message);
          return;
        }
        if (response.error) {
          console.error("Error from background:", response.error);
          chrome.runtime.sendMessage({
            message: "update_result",
            result: typeof response.error === "string" ? response.error : "เกิดข้อผิดพลาดในการตรวจสอบ",
            originalText: sentence,
            toxicWords: [],
            isToxic: false
          });
          return;
        }
        
        const isToxic = response.toxicWords && response.toxicWords.length > 0;
        results[index] = { toxicWords: response.toxicWords || [], isToxic };
        console.log(`Received response for sentence ${index}:`, response);
        
        chrome.runtime.sendMessage({
          message: "update_result",
          result: typeof response.result === "string" ? response.result : "ข้อมูลไม่ถูกต้อง",
          originalText: sentence,
          toxicWords: response.toxicWords || [],
          isToxic: isToxic
        });
      }
    );
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedProcess = debounce((input) => {
  const rawText = input.innerText || input.value || input.textContent || "";
  if (!rawText.trim()) {
    console.log('No text to process');
    return;
  }
  
  const processedText = processText(rawText);
  if (processedText !== lastText) {
    lastText = processedText;
    console.log('Text changed, processing:', processedText);
    const sentences = splitSentences(rawText);
    highlightAllSentences(input, sentences); // Highlight ทันทีทุกประโยค
    sendToModel(sentences, input); // ส่งไปตรวจ toxic
  } else {
    console.log('Text unchanged:', processedText);
  }
}, 500);

function setupObserver(target) {
  if (observer) {
    observer.disconnect();
    console.log('Disconnected previous observer');
  }
  
  observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'characterData' || mutation.type === 'attributes') {
        shouldProcess = true;
        console.log('Mutation detected:', mutation.type, 'target:', mutation.target);
      }
    });
    if (shouldProcess) {
      debouncedProcess(target);
    } else {
      console.log('No relevant mutation detected');
    }
  });
  
  observer.observe(target, { 
    childList: true, 
    characterData: true, 
    subtree: true,
    attributes: true
  });
  
  console.log('Observer set up on:', target);
}

function observeInput() {
  inputElement = getFacebookInput();
  if (inputElement) {
    setupObserver(inputElement);
    ['input', 'keyup', 'paste', 'change'].forEach(eventType => {
      inputElement.addEventListener(eventType, () => debouncedProcess(inputElement), { capture: true });
    });
    console.log('Event listeners added to input:', inputElement);
  } else {
    console.log('No input element found, retrying...');
  }
}

function checkAndObserve() {
  console.log('Checking for Facebook input at:', new Date().toLocaleTimeString());
  inputElement = getFacebookInput();
  if (inputElement && inputElement !== document.body) {
    observeInput();
  } else {
    console.log('Input not found, scheduling retry in 2s...');
    setTimeout(checkAndObserve, 2000);
  }
}

// เริ่มตรวจสอบทันทีและใช้ polling
window.addEventListener("load", () => {
  console.log('Window loaded, starting extension at:', new Date().toLocaleTimeString());
  setTimeout(checkAndObserve, 1000);
});

setInterval(() => {
  if (!inputElement || !document.contains(inputElement)) {
    console.log('Input element lost or removed, rechecking at:', new Date().toLocaleTimeString());
    checkAndObserve();
  }
}, 3000);

// Debug: Log all potential inputs
console.log('All potential inputs:', document.querySelectorAll('div[role="textbox"], textarea, div[contenteditable="true"]'));
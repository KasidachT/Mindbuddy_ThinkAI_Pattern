

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
let debounceTimeout = null;
let currentURL = window.location.href;

function getFacebookInput() {
  const selectors = [
    'div[role="textbox"]',
    'textarea',
    'div[contenteditable="true"]',
    '[data-lexical-editor="true"]',
    'div[aria-label*="Write a comment"]',
    'div[aria-label*="แสดงความคิดเห็น"]',
    'div[aria-label*="Message"]',
    'div[aria-label*="แชท"]',
    'div[data-testid="status-attachment-mentions-input"]',
    'div[data-testid="add_comment_input"]',
    'input[type="search"]',
    'input[data-testid="search_input"]',
    'div[aria-label*="Create a post"]',
    'div[aria-label*="คุณกำลังคิดอะไร"]',
    'div[aria-label*="What\'s on your mind"]',
    'div[data-contents="true"][role="textbox"]',
    '[data-testid="post_composer_input"]'
  ];
  
  console.log('Scanning selectors for input...');
  
  let allInputs = [];
  for (let selector of selectors) {
    const inputs = document.querySelectorAll(selector);
    console.log(`Selector "${selector}" matched ${inputs.length} elements`);
    inputs.forEach((input, i) => {
      const textSample = (input.value || input.innerText || input.textContent || '').slice(0, 20);
      console.log(`  - Element ${i}: tag=${input.tagName}, type=${input.type}, role=${input.getAttribute('role')}, text="${textSample}", focused=${document.activeElement === input}`);
      allInputs.push(input);
    });
  }
  
  // Prioritize focused element หรือ element ที่มี text
  const focusedElement = document.activeElement;
  if (focusedElement && allInputs.includes(focusedElement)) {
    const textSample = (focusedElement.value || focusedElement.innerText || focusedElement.textContent || '').slice(0, 20);
    console.log(`Prioritizing focused element: ${focusedElement}, text: "${textSample}"`);
    return focusedElement;
  }
  
  // ถ้าไม่มี focused, เลือก element ที่มี text มากที่สุด
  let selectedInput = null;
  let maxLength = 0;
  allInputs.forEach(input => {
    const text = input.value || input.innerText || input.textContent || '';
    if (text.trim().length > maxLength) {
      maxLength = text.trim().length;
      selectedInput = input;
    }
  });
  
  if (selectedInput) {
    const textSample = (selectedInput.value || selectedInput.innerText || selectedInput.textContent || '').slice(0, 20);
    console.log(`Selected input with longest text: ${selectedInput}, text: "${textSample}"`);
    return selectedInput;
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
  
  let processedText = text.replace(/\s+/g, ' ').trim();
  processedText = processedText.replace(/[\u00A0\u200B\uFEFF]/g, '');
  processedText = processedText.slice(0, 120);
  processedText = processedText.toLowerCase();
  processedText = processedText.replace(
    /[\p{Emoji}\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu,
    ""
  );
  processedText = processedText.trim();
  
  console.log(`Raw text: "${text}" (length: ${text.length})`);
  console.log(`Processed text: "${processedText}" (length: ${processedText.length})`);
  return processedText;
}

function highlightAllSentences(element) {
  if (!element || !element.textContent.trim()) {
    console.log('Highlight failed: Missing element or no text');
    return;
  }

  if (element.tagName.toLowerCase() === 'input' && element.type === 'search') {
    const value = element.value;
    if (!value) return;
    try {
      element.style.backgroundColor = 'yellow';
      console.log('Applied highlight to search input');
    } catch (e) {
      console.error('Failed to highlight search input:', e);
    }
    return;
  }

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  const text = element.textContent;
  const sentences = splitSentences(text);

  try {
    element.innerHTML = text.replace(/\s+/g, ' ').trim();
    sentences.forEach((sentence, index) => {
      const span = document.createElement('span');
      span.style.backgroundColor = 'yellow';
      span.style.color = 'black';
      span.style.padding = '2px';
      span.style.borderRadius = '3px';
      span.textContent = sentence;
      if (index < sentences.length - 1) span.appendChild(document.createTextNode(' '));
      range.insertNode(span);
      range.setStartAfter(span);
    });
    console.log('Successfully applied highlight to all sentences');
  } catch (e) {
    console.error('Failed to apply highlight:', e);
  }
}

function sendToModel(sentences, element) {
  if (!sentences || sentences.length === 0) {
    console.log('No sentences to send to model');
    return;
  }

  let hasOverallToxic = false; // Flag สำหรับตรวจว่ามี toxic ในประโยคใดบ้าง
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
        if (isToxic) hasOverallToxic = true; // ตั้ง flag ถ้ามี toxic อย่างน้อย 1 ประโยค
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

  // ส่ง flag หลังวนลูปเสร็จ (ใช้ setTimeout เพื่อรอ callback ทั้งหมด)
  Promise.all(
  sentences.map((sentence, index) => {
    return new Promise((resolve) => {
      const processedText = processText(sentence);
      if (!processedText) return resolve(false);

      chrome.runtime.sendMessage(
        {
          message: "check_toxicity",
          text: processedText,
          originalSentence: sentence,
          sentenceIndex: index,
        },
        (response) => {
          if (chrome.runtime.lastError || response?.error) {
            return resolve(false);
          }
          const isToxic = response.toxicWords && response.toxicWords.length > 0;
          resolve(isToxic);
        }
      );
    });
  })
).then((results) => {
  // ถ้าอย่างน้อย 1 ประโยค toxic → +1 เท่านั้น
  if (results.some((r) => r)) {
    chrome.runtime.sendMessage({ message: "increment_toxic_count" });
  }
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
  let rawText = input.type === 'search' ? input.value : (input.innerText || input.value || input.textContent || "");
  rawText = rawText.replace(/\s+/g, ' ').trim();
  
  if (!rawText) {
    console.log('No text to process after trim');
    return;
  }
  
  const processedText = processText(rawText);
  if (processedText !== lastText) {
    lastText = processedText;
    console.log('Text changed, processing:', processedText);
    highlightAllSentences(input);
    const sentences = splitSentences(rawText);
    sendToModel(sentences, input);
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
    // รีเซ็ต lastText และ debounce timeout เมื่อเปลี่ยน input element
    lastText = "";
    if (debounceTimeout) clearTimeout(debounceTimeout);
    
    setupObserver(inputElement);
    // ลบ listener เก่าและเพิ่มใหม่
    ['input', 'keyup', 'paste', 'change'].forEach(eventType => {
      inputElement.removeEventListener(eventType, debouncedProcess, { capture: true });
      inputElement.addEventListener(eventType, () => debouncedProcess(inputElement), { capture: true });
    });
    console.log('Re-setup observer and listeners on new input:', inputElement);
  } else {
    console.log('No input element found, retrying...');
  }
}

function checkAndObserve() {
  console.log('Checking for Facebook input at:', new Date().toLocaleTimeString());
  const newURL = window.location.href;
  const newInput = getFacebookInput();
  
  // ตรวจสอบ URL เปลี่ยน
  if (newURL !== currentURL) {
    console.log('URL changed from', currentURL, 'to', newURL, '- Re-scanning inputs');
    currentURL = newURL;
    lastText = "";
    if (inputElement) {
      if (observer) observer.disconnect();
      ['input', 'keyup', 'paste', 'change'].forEach(eventType => {
        if (inputElement) inputElement.removeEventListener(eventType, debouncedProcess, { capture: true });
      });
    }
    inputElement = null;
  }
  
  if (newInput) {
    if (newInput !== inputElement) {
      console.log('New input detected, re-setting up...');
      inputElement = newInput;
    }
    observeInput(); // Force re-setup ทุกครั้งที่พบ input
  } else {
    console.log('Input not found, scheduling retry in 2s...');
    setTimeout(checkAndObserve, 2000);
  }
}

// เริ่มตรวจสอบทันทีและใช้ polling
window.addEventListener("load", () => {
  console.log('Window loaded, starting extension at:', new Date().toLocaleTimeString());
  currentURL = window.location.href;
  setTimeout(checkAndObserve, 1000);
});

// Polling ทุก 1 วินาที
setInterval(() => {
  console.log('Force check interval at:', new Date().toLocaleTimeString());
  checkAndObserve();
}, 1000);

// Detect การสลับ tab หรือ focus
window.addEventListener('focus', () => {
  console.log('Window focused - Re-scanning inputs');
  setTimeout(checkAndObserve, 500);
});

// Detect การคลิกเพื่อ re-scan
window.addEventListener('click', (e) => {
  if (e.target.matches('div[role="textbox"], div[contenteditable], input[type="search"], div[data-testid*="input"]')) {
    console.log('Click detected on potential input area:', e.target);
    setTimeout(checkAndObserve, 100);
  }
}, true);

// Debug: Log all potential inputs
console.log('All potential inputs:', document.querySelectorAll('div[role="textbox"], textarea, div[contenteditable="true"], input[type="search"]'));
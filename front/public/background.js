/*
// จำลองโมเดลด้วยกฎง่าย ๆ (แทนการใช้ TensorFlow.js หรือโมเดลจริง)
// ถ้ามีโมเดลที่ฝึกแล้ว ให้แทนที่ด้วยการเรียก TensorFlow.js

const toxicWords = ["โง่", "งี่เง่า", "แย่", "ห่วย", "บ้า"];

function checkToxicity(text) {
  const lowerText = text.toLowerCase();
  const isToxic = toxicWords.some((word) => lowerText.includes(word));
  if (isToxic) {
    let newText = text;
    toxicWords.forEach((word) => {
      const regex = new RegExp(word, "gi");
      newText = newText.replace(regex, "ดี");
    });
    return `ข้อความที่แนะนำ: ${newText}`;
  }
  return "สามารถใช้ข้อความนี้ได้";
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "check_toxicity") {
    try {
      const result = checkToxicity(request.text);
      sendResponse({ result });
    } catch (error) {
      console.error("Error:", error);
      sendResponse({ error: "เกิดข้อผิดพลาดในการตรวจสอบ" });
    }
    return true; // ระบุว่าเป็น asynchronous response
  }
});
*/

// Mockup
// ไม่ต้อง import TensorFlow.js เพราะไม่ใช้โมเดลจริง
// let model = null;
// let tokenizer = null;

// async function loadModel() { ... } // ลบออก

/*
function suggestNonToxicText(text) {
  if (typeof text !== "string") return "ข้อความไม่ถูกต้อง";
  let newText = text;
  const toxicWords = ["โง่", "งี่เง่า", "แย่"];
  toxicWords.forEach((word) => {
    const regex = new RegExp(word, "gi");
    newText = newText.replace(regex, "ดี");
  });
  return newText;
}

function mockPredict(text) {
  if (typeof text !== "string") return "ข้อมูลไม่ถูกต้อง";
  const toxicWords = ["โง่", "งี่เง่า", "แย่"];
  const hasToxic = toxicWords.some((word) => text.includes(word.toLowerCase()));
  return hasToxic
    ? `ข้อความที่แนะนำ: ${suggestNonToxicText(text)}`
    : "สามารถใช้ข้อความนี้ได้";
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "check_toxicity") {
    try {
      if (typeof request.text !== "string") {
        sendResponse({ error: "ข้อความที่ส่งมาไม่ถูกต้อง" });
        return true;
      }

      const result = mockPredict(request.text);
      sendResponse({ result });
    } catch (error) {
      console.error("Error:", error);
      sendResponse({ error: `เกิดข้อผิดพลาดในการตรวจสอบ: ${error.message}` });
    }
    return true;
  }
});

*/

function suggestNonToxicText(text) {
  if (typeof text !== "string") return "ข้อความไม่ถูกต้อง";
  let newText = text;
  const toxicWords = ["โง่", "งี่เง่า", "แย่"];
  toxicWords.forEach((word) => {
    const regex = new RegExp(word, "gi");
    newText = newText.replace(regex, "ดี");
  });
  console.log("Suggested text:", newText);
  return newText;
}

function mockPredict(text) {
  if (typeof text !== "string") return { result: "ข้อมูลไม่ถูกต้อง", toxicWords: [] };
  const toxicWordsList = ["โง่", "งี่เง่า", "แย่"];
  const foundToxicWords = toxicWordsList.filter((word) => text.toLowerCase().includes(word.toLowerCase()));
  const hasToxic = foundToxicWords.length > 0;
  return {
    result: hasToxic
      ? `ข้อความที่แนะนำ: ${suggestNonToxicText(text)}`
      : "สามารถใช้ข้อความนี้ได้",
    toxicWords: foundToxicWords,
  };
}

// ฟังก์ชันนับสถิติ: นับ +1 ต่อการพิมพ์ที่มี toxic อย่างน้อย 1 ประโยค
function updateToxicCount() {
  chrome.storage.local.get(["toxicReplacements"], (result) => {
    let data = result.toxicReplacements || {};
    let today = new Date().toISOString().split('T')[0];
    data[today] = (data[today] || 0) + 1;
    chrome.storage.local.set({ toxicReplacements: data }, () => {
      console.log(`Updated toxic count for ${today}: ${data[today]} (การพิมพ์ที่มี toxic)`);
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "check_toxicity") {
    try {
      if (typeof request.text !== "string") {
        sendResponse({ error: "ข้อความที่ส่งมาไม่ถูกต้อง" });
        return true;
      }
      const prediction = mockPredict(request.text);
      console.log('Background response:', prediction);
      sendResponse({ result: prediction.result, toxicWords: prediction.toxicWords });
    } catch (error) {
      console.error("Error in mockPredict:", error);
      sendResponse({ error: `เกิดข้อผิดพลาด: ${error.message}` });
    }
    return true;
  } else if (request.message === "update_result") {
    chrome.storage.local.set({
      lastInputText: request.originalText,
      lastResult: request.result,
      toxicWords: request.toxicWords,
    }, () => {
      sendResponse({ status: "updated" });
    });
    return true;
  } else if (request.message === "increment_toxic_count") {
    // รับ message ใหม่จาก content: นับ +1 ต่อการพิมพ์ที่มี toxic
    updateToxicCount();
    sendResponse({ status: "count_updated" });
    return true;
  }
});
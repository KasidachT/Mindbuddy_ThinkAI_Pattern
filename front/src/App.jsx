/*
import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  const [inputText, setInputText] = useState("");
  const [displayText, setDisplayText] = useState("");

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    setDisplayText(text);
  };

  return (
    <div
      className="flex flex-col items-center min-h-[400px] w-[375px] bg-gray-100 p-4" // ลบ min-h-screen, justify-center; เพิ่ม fixed min-h และ width สำหรับ popup 
    >
      <div
        className="bg-white border border-gray-200 rounded-lg shadow-md p-5 flex  items-center flex-col min-h-[400px] w-full " // w-full เพื่อเต็ม container 
      >
        <h1
          className="text-2xl font-bold text-blue-600 text-center mb-4" // ลด text-4xl เป็น text-2xl เพื่อพอดี popup 
        >
          Hello TailwindCSS YeeeHA!!!!
        </h1>

        <p className="text-lg text-gray-700 text-center mb-4">
          ตอนนี้คุณใช้ Tailwind ได้แล้ว!
        </p>

        {//<input
          //type="text"
          //value={inputText}
          //onChange={handleInputChange}
          //placeholder="Input your text...."
          //className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs mb-4" /* เพิ่ม mb-4 เพื่อ space ใต้ input */
///>

/*
        {inputText && (
          <p className="text-lg text-gray-700 text-center">
            คุณพิมพ์: {displayText}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
*/

import React from "react"; // Import React ทั้งตัว
import { useState, useEffect } from "react";
import "./App.css";

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-700 text-center">
          เกิดข้อผิดพลาด: {this.state.error?.message || "ไม่สามารถแสดงผลได้"}
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [inputText, setInputText] = useState("");
  const [modelResult, setModelResult] = useState("");
  const [toxicWords, setToxicWords] = useState([]);

  useEffect(() => {
    const fetchData = () => {
      chrome.storage.local.get(
        ["lastInputText", "lastResult", "toxicWords"],
        (result) => {
          setInputText(result.lastInputText || "");
          setModelResult(result.lastResult || "");
          setToxicWords(result.toxicWords || []);
        }
      );
    };

    fetchData();

    const onStorageChange = (changes, area) => {
      if (area === "local") {
        if (changes.lastInputText)
          setInputText(changes.lastInputText.newValue || "");
        if (changes.lastResult)
          setModelResult(changes.lastResult.newValue || "");
        if (changes.toxicWords)
          setToxicWords(changes.toxicWords.newValue || []);
      }
    };

    chrome.storage.onChanged.addListener(onStorageChange);

    return () => chrome.storage.onChanged.removeListener(onStorageChange);
  }, []);

  return (
    <ErrorBoundary>
      <div className="flex flex-col items-center min-h-[400px] w-[375px] bg-gray-100 p-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-md p-5 flex items-center flex-col min-h-[400px] w-full">
          <h1 className="text-2xl font-bold text-blue-600 text-center mb-4">
            MindBuddy
          </h1>
          <p className="text-lg text-gray-700 text-center mb-4">
            ผลลัพธ์ล่าสุดจากข้อความ Facebook
          </p>
          {inputText ? (
            <div className="text-lg text-gray-700 text-center mb-4 max-h-24 overflow-y-auto">
              <strong>ประโยคที่พิมพ์:</strong> {inputText}
            </div>
          ) : (
            <p className="text-lg text-gray-500 text-center mb-4">
              ยังไม่มีข้อความที่ตรวจสอบ
            </p>
          )}
          {modelResult && (
            <p
              className={`text-lg text-center mb-4 ${
                modelResult === "สามารถใช้ข้อความนี้ได้"
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              <strong>ผลลัพธ์:</strong> {modelResult}
            </p>
          )}
          {toxicWords.length > 0 && (
            <p className="text-lg text-orange-700 text-center">
              <strong>คำที่อาจไม่เหมาะสม:</strong> {toxicWords.join(", ")}
            </p>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;

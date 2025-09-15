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
      className="flex flex-col items-center min-h-[400px] w-[375px] bg-gray-100 p-4" /* ลบ min-h-screen, justify-center; เพิ่ม fixed min-h และ width สำหรับ popup */
    >
      <div
        className="bg-white border border-gray-200 rounded-lg shadow-md p-5 flex  items-center flex-col min-h-[400px] w-full " /* w-full เพื่อเต็ม container */
      >
        <h1
          className="text-2xl font-bold text-blue-600 text-center mb-4" /* ลด text-4xl เป็น text-2xl เพื่อพอดี popup */
        >
          Hello TailwindCSS YeeeHA!!!!
        </h1>

        <p className="text-lg text-gray-700 text-center mb-4">
          ตอนนี้คุณใช้ Tailwind ได้แล้ว!
        </p>

        {/* <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Input your text...."
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs mb-4" /* เพิ่ม mb-4 เพื่อ space ใต้ input */
        /> */}

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

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
import Chart from "chart.js/auto"; // Import Chart.js (สมมติ bundle แล้ว)
import "./App.css";

// Component สำหรับกราฟสถิติ (หน้า chart)
function StatsChart({ onBack }) {
  const [viewType, setViewType] = useState("daily"); // "daily", "monthly", "yearly"
  const [chartData, setChartData] = useState(null);
  const [chartInstance, setChartInstance] = useState(null);

  useEffect(() => {
    const fetchAndProcessData = () => {
      chrome.storage.local.get(["toxicReplacements"], (result) => {
        let dailyData = result.toxicReplacements || {};
        let dates = Object.keys(dailyData).sort(); // เรียงวันที่

        if (dates.length === 0) {
          setChartData(null);
          return;
        }

        let labels = [];
        let counts = [];
        let title = "";

        if (viewType === "daily") {
          labels = dates.slice(-30);
          counts = labels.map((date) => dailyData[date]);
          title = "กราฟแท่งรายวัน: การเปลี่ยนคำ Toxic";
        } else if (viewType === "monthly") {
          let monthlyData = {};
          dates.forEach((dateStr) => {
            let date = new Date(dateStr);
            let monthKey = `${getMonthName(date)} ${date.getFullYear()}`;
            monthlyData[monthKey] =
              (monthlyData[monthKey] || 0) + dailyData[dateStr];
          });
          labels = Object.keys(monthlyData).sort();
          counts = labels.map((month) => monthlyData[month]);
          title = "กราฟแท่งรายเดือน: การเปลี่ยนคำ Toxic";
        } else if (viewType === "yearly") {
          let yearlyData = {};
          dates.forEach((dateStr) => {
            let date = new Date(dateStr);
            let yearKey = date.getFullYear().toString();
            yearlyData[yearKey] =
              (yearlyData[yearKey] || 0) + dailyData[dateStr];
          });
          labels = Object.keys(yearlyData).sort();
          counts = labels.map((year) => yearlyData[year]);
          title = "กราฟแท่งรายปี: การเปลี่ยนคำ Toxic";
        }

        const config = {
          type: "bar",
          data: {
            labels: labels,
            datasets: [
              {
                label: 'จำนวนการเปลี่ยนคำ Toxic เป็น "ดี"',
                data: counts,
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: "จำนวนครั้ง" },
              },
              x: {
                title: {
                  display: true,
                  text:
                    viewType === "daily"
                      ? "วันที่"
                      : viewType === "monthly"
                      ? "เดือน"
                      : "ปี",
                },
              },
            },
            plugins: {
              title: { display: true, text: title },
            },
          },
        };
        setChartData(config);
      });
    };

    fetchAndProcessData();

    function getMonthName(date) {
      const months = [
        "มกราคม",
        "กุมภาพันธ์",
        "มีนาคม",
        "เมษายน",
        "พฤษภาคม",
        "มิถุนายน",
        "กรกฎาคม",
        "สิงหาคม",
        "กันยายน",
        "ตุลาคม",
        "พฤศจิกายน",
        "ธันวาคม",
      ];
      return months[date.getMonth()];
    }
  }, [viewType]);

  useEffect(() => {
    if (chartInstance) {
      chartInstance.destroy();
    }
    if (chartData) {
      const ctx = document.getElementById("toxicChart").getContext("2d");
      const newChart = new Chart(ctx, chartData);
      setChartInstance(newChart);
    }
  }, [chartData]);

  return (
    <div className="flex flex-col items-center min-h-[400px] w-[375px] bg-gray-100 p-4">
      <div className="bg-white border border-gray-200 rounded-lg shadow-md p-5 flex items-center flex-col min-h-[400px] w-full">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            marginBottom: "16px",
          }}
        >
          <button
            onClick={onBack}
            style={{
              backgroundColor: "#3B82F6",
              color: "white",
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            ← กลับ
          </button>
          <h1
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: "#2563EB",
              margin: 0,
            }}
          >
            สถิติ MindBuddy
          </h1>
          <div></div> {/* Spacer */}
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ marginRight: "8px" }}>มุมมอง: </label>
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value)}
            style={{
              border: "1px solid #D1D5DB",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            <option value="daily">รายวัน</option>
            <option value="monthly">รายเดือน</option>
            <option value="yearly">รายปี</option>
          </select>
        </div>
        {chartData ? (
          <div style={{ width: "100%", height: "192px" }}>
            <canvas id="toxicChart"></canvas>
          </div>
        ) : (
          <p style={{ color: "#6B7280" }}>ไม่มีข้อมูลสถิติ</p>
        )}
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: "#EF4444", textAlign: "center" }}>
          เกิดข้อผิดพลาด: {this.state.error?.message || "ไม่สามารถแสดงผลได้"}
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [showStats, setShowStats] = useState(false);
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

  if (showStats) {
    return (
      <ErrorBoundary>
        <StatsChart onBack={() => setShowStats(false)} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "400px",
          width: "375px",
          backgroundColor: "#F3F4F6",
          padding: "16px",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            minHeight: "400px",
            width: "100%",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#2563EB",
              textAlign: "center",
              marginBottom: "16px",
            }}
          >
            MindBuddy
          </h1>
          <p
            style={{
              fontSize: "18px",
              color: "#374151",
              textAlign: "center",
              marginBottom: "16px",
            }}
          >
            ผลลัพธ์ล่าสุดจากข้อความ Facebook
          </p>
          {inputText ? (
            <div
              style={{
                fontSize: "18px",
                color: "#374151",
                textAlign: "center",
                marginBottom: "16px",
                maxHeight: "96px",
                overflowY: "auto",
              }}
            >
              <strong>ประโยคที่พิมพ์:</strong> {inputText}
            </div>
          ) : (
            <p
              style={{
                fontSize: "18px",
                color: "#9CA3AF",
                textAlign: "center",
                marginBottom: "16px",
              }}
            >
              ยังไม่มีข้อความที่ตรวจสอบ
            </p>
          )}
          {modelResult && (
            <p
              style={{
                fontSize: "18px",
                textAlign: "center",
                marginBottom: "16px",
                color:
                  modelResult === "สามารถใช้ข้อความนี้ได้"
                    ? "#059669"
                    : "#EF4444",
              }}
            >
              <strong>ผลลัพธ์:</strong> {modelResult}
            </p>
          )}
          {toxicWords.length > 0 && (
            <p
              style={{
                fontSize: "18px",
                color: "#EA580C",
                textAlign: "center",
              }}
            >
              <strong>คำที่อาจไม่เหมาะสม:</strong> {toxicWords.join(", ")}
            </p>
          )}
          {/* ปุ่มสลับไปหน้าสถิติ */}
          <button
            onClick={() => {
              console.log("Button clicked - switching to stats"); // Debug log
              setShowStats(true);
            }}
            style={{
              marginTop: "16px",
              backgroundColor: "#059669",
              color: "white",
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#047857")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#059669")}
          >
            ดูสถิติการใช้งาน
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;

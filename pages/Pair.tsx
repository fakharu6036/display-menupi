import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

const PairPage = () => {
  const router = useRouter();
  const { device_id, token } = router.query;
  const [screens, setScreens] = useState([]);
  const [selectedScreen, setSelectedScreen] = useState("");
  const [publicCode, setPublicCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch user's screens
    fetch("/api/screens", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setScreens(data.screens || []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const payload = {
      device_id: device_id || token,
      ...(selectedScreen ? { screen_id: selectedScreen } : {}),
      ...(publicCode ? { public_code: publicCode } : {}),
    };
    const res = await fetch("/api/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage(data.message);
    } else {
      setMessage(data.error || "Pairing failed");
    }
  };

  // Helper: get device label for confirmation
  const getScreenName = (id: string) => {
    const found = screens.find((s: any) => s.id == id);
    return found ? found.name : id;
  };

  // Show confirmation with screen name if possible
  const renderMessage = () => {
    if (!message) return null;
    if (message.startsWith("This TV is now connected to")) {
      // Extract screen name from backend message
      const match = message.match(/This TV is now connected to (.+)/);
      const screenName = match ? match[1] : "";
      return (
        <div className="mt-4 text-center font-semibold text-green-700">
          <span role="img" aria-label="success">
            ✅
          </span>{" "}
          {`This TV is now connected to `}
          <span className="font-bold">{screenName}</span>
        </div>
      );
    }
    return (
      <div className="mt-4 text-center font-semibold text-red-600">
        {message}
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Pair This TV</h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2">Select a Screen:</label>
        <select
          className="w-full mb-4 p-2 border rounded"
          value={selectedScreen}
          onChange={(e) => setSelectedScreen(e.target.value)}
        >
          <option value="">-- Choose --</option>
          {screens.map((screen) => (
            <option key={screen.id} value={screen.id}>
              {screen.name}
            </option>
          ))}
        </select>
        <div className="my-4 text-center text-gray-500">OR</div>
        <label className="block mb-2">Enter Public Player Code:</label>
        <input
          className="w-full mb-4 p-2 border rounded"
          value={publicCode}
          onChange={(e) => setPublicCode(e.target.value.toUpperCase())}
          placeholder="e.g. 1A2B3C"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          disabled={loading || (!selectedScreen && !publicCode)}
        >
          {loading ? "Pairing..." : "Pair TV"}
        </button>
      </form>
      {renderMessage()}
    </div>
  );
};

export default PairPage;

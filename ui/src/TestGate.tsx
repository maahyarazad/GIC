import React, { useState, FormEvent, ChangeEvent } from "react";

const TEST_USER = "user_1";
const TEST_PASSWORD = "7Kp!mQ9#Lx2@Tn";

type TestGateProps = {
  onSuccess: () => void;
};

const TestGate: React.FC<TestGateProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (username === TEST_USER && password === TEST_PASSWORD) {
      localStorage.setItem("test-gate-auth", "true");
      onSuccess();
      return;
    }

    setError("Invalid credentials");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
        padding: "20px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#fff",
          padding: "32px",
          borderRadius: "12px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ marginBottom: "8px" }}>Tester Access</h2>
        <p style={{ marginBottom: "20px", color: "#666" }}>
          Enter the test credentials to continue.
        </p>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setUsername(e.target.value)
            }
            placeholder="Username"
            style={{
              width: "100%",
              height: "44px",
              padding: "0 12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            placeholder="Password"
            style={{
              width: "100%",
              height: "44px",
              padding: "0 12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        {error && (
          <div style={{ color: "red", marginBottom: "16px" }}>{error}</div>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            height: "44px",
            border: "none",
            borderRadius: "8px",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Continue
        </button>
      </form>
    </div>
  );
};

export default TestGate;
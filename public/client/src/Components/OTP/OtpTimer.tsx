import React, { useState, useEffect } from "react";

// ----------------------------
// Props types
// ----------------------------
interface OtpTimerProps {
  initialSeconds?: number;
  loginResponseData?: any; // You can replace `any` with your actual response type
  onResend?: (data: any) => void;
  onExpiredChange?: (expired: boolean) => void;
}

const OtpTimer: React.FC<OtpTimerProps> = ({
  initialSeconds = 59,
  loginResponseData = {},
  onResend,
  onExpiredChange,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);
  const [expired, setExpired] = useState<boolean>(false);

  // ----------------------------
  // Countdown logic
  // ----------------------------
  useEffect(() => {
    if (secondsLeft === 0) {
      setExpired(true);
      onExpiredChange?.(true);
      return;
    }

    const timerId = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [secondsLeft, onExpiredChange]);

  // ----------------------------
  // Handle resend
  // ----------------------------
  const handleResend = () => {
    setSecondsLeft(initialSeconds);
    setExpired(false);
    onResend?.(loginResponseData);
  };

  // ----------------------------
  // Format seconds as mm:ss
  // ----------------------------
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mt-2">
      {!expired ? (
        <span>OTP expires in: {formatTime(secondsLeft)} minutes</span>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          className="btn btn-link"
        >
          Resend OTP
        </button>
      )}
    </div>
  );
};

export default OtpTimer;

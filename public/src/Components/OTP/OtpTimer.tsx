import React, { useState, useEffect,forwardRef , useImperativeHandle} from "react";

// ----------------------------
// Props types
// ----------------------------
interface OtpTimerProps {
  initialSeconds: number;
  loginResponseData?: any; // You can replace `any` with your actual response type
  onResend?: (data: any) => void;
  onExpiredChange?: (expired: boolean) => void;
}


export interface OtpTimerRef {
  resetTimer: () => void;
}


const OtpTimer = forwardRef<OtpTimerRef, OtpTimerProps>((props, ref) => {
  const [secondsLeft, setSecondsLeft] = useState(props.initialSeconds || 300);
  const [expired, setExpired] = useState<boolean>(false);

  // ----------------------------
  // Countdown logic
  // ----------------------------
  useEffect(() => {
    if (secondsLeft === 0) {
      setExpired(true);
      props.onExpiredChange?.(true);
      return;
    }

    const timerId = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [secondsLeft, props.onExpiredChange]);

  // ----------------------------
  // Handle resend
  // ----------------------------
  const handleResend = () => {
    setSecondsLeft(props.initialSeconds);
    setExpired(false);
    props.onResend?.(props.loginResponseData);
  };

  // ----------------------------
  // Format seconds as mm:ss
  // ----------------------------
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };


   useImperativeHandle(ref, () => ({
    resetTimer: () => {
      setSecondsLeft(props.initialSeconds || 300);
      setExpired(false);
    },
  }));


  return (
    <div className="mt-2">
      {!expired ? (
        <span >OTP expires in: <strong className="text-contrast">{formatTime(secondsLeft)}</strong> minutes</span>
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
});

export default OtpTimer;

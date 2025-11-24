import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";

// ----------------------------
// Ref methods exposed to parent
// ----------------------------
export interface OtpInputRef {
  clear: () => void;
  blurAll: () => void;
}

// ----------------------------
// Props for the component
// ----------------------------
interface OtpInputProps {
  length?: number; // number of OTP digits
  onChange?: (value: string) => void; // fires on every input change
  onComplete?: (value: string) => void; // fires when OTP is fully filled
}

const OtpInput = forwardRef<OtpInputRef, OtpInputProps>(
  ({ length = 5, onChange, onComplete }, ref) => {
    const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
    const completedRef = useRef(false);

    // ----------------------------
    // Handle input change
    // ----------------------------
    const handleChange = (element: HTMLInputElement, index: number) => {
      const value = element.value.replace(/[^0-9]/g, "");
      if (!value) return;

      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      onChange?.(newOtp.join(""));

      if (value && index < length - 1) {
        inputsRef.current[index + 1]?.focus();
      }
    };

    // ----------------------------
    // Handle backspace navigation
    // ----------------------------
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === "Backspace") {
        const newOtp = [...otp];
        if (otp[index]) {
          newOtp[index] = "";
          setOtp(newOtp);
          onChange?.(newOtp.join(""));
          completedRef.current = false;
        } else if (index > 0) {
          inputsRef.current[index - 1]?.focus();
        }
      }
    };

    // ----------------------------
    // Detect OTP complete
    // ----------------------------
    useEffect(() => {
      if (otp.every((digit) => digit !== "") && !completedRef.current) {
        completedRef.current = true;
        onComplete?.(otp.join(""));
      }
    }, [otp, onComplete]);

    // ----------------------------
    // Expose methods to parent
    // ----------------------------
    useImperativeHandle(ref, () => ({
      clear: () => {
        const cleared = new Array(length).fill("");
        setOtp(cleared);
        completedRef.current = false;
        onChange?.("");
        inputsRef.current[0]?.focus();
      },
      blurAll: () => {
        inputsRef.current.forEach((input) => input?.blur());
      },
    }));

    return (
      <div style={{ display: "flex", gap: "8px" }}>
        {otp.map((digit, idx) => (
          <input
            key={idx}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            ref={(el) => (inputsRef.current[idx] = el)}
            onChange={(e) => handleChange(e.target, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className="otp-box"
            style={{
              width: "2em",
              height: "2em",
              fontSize: "1.25em",
              textAlign: "center",
            }}
          />
        ))}
      </div>
    );
  }
);

OtpInput.displayName = "OtpInput";

export default OtpInput;

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";

const AlertDialogContext = createContext(null);

export const AlertDialogProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [actionTitle, setActionTitle] = useState("Confirm");
  const [btnStyle, setBtnStyle] = useState({
    text: "Proceed",
    color: "#1976d2",
  });

  const onProceedRef = useRef(null);
  const onCancelRef = useRef(null);

  const openDialog = useCallback(
    (msg, title, style, onProceed, onCancel) => {
      setMessage(msg || "");
      setActionTitle(title || "Confirm");
      setBtnStyle(style || { text: "Proceed", color: "#1976d2" });
      onProceedRef.current = onProceed;
      onCancelRef.current = onCancel;
      setOpen(true);
    },
    []
  );

  const handleCancel = () => {
    setOpen(false);
    onCancelRef.current?.();
  };

  const handleProceed = () => {
    setOpen(false);
    onProceedRef.current?.();
  };

  return (
    <AlertDialogContext.Provider value={{ openDialog }}>
      {children}

      {open && (
        <div style={styles.overlay}>
          <div style={styles.dialog}>
            <h3 style={styles.title}>{actionTitle}</h3>

            <p style={styles.message}>{message}</p>

            <div style={styles.actions}>
              <button
                onClick={handleCancel}
                style={{ ...styles.button, ...styles.cancelButton }}
              >
                Cancel
              </button>

              <button
                onClick={handleProceed}
                style={{
                  ...styles.button,
                  borderColor: btnStyle.color,
                  color: btnStyle.color,
                }}
              >
                {btnStyle.text}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertDialogContext.Provider>
  );
};

// Custom hook
export const useAlertDialog = () => {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error(
      "useAlertDialog must be used within an AlertDialogProvider"
    );
  }
  return context;
};

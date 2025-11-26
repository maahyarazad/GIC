import React, { ButtonHTMLAttributes, useEffect } from "react";
import "./Button.css";

type ButtonProps = {
  loading?: boolean; // controlled loading state from parent
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({
  children,
  loading = false,
  disabled,
  onClick,
  className = "",
  ...rest
}: ButtonProps) {



    useEffect(()=>{
        
    }, [loading])

  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`application-button ${className}`}
      {...rest} // allow type="submit", id, etc.
    >
      {loading ? <span className="loader-btn"></span> : children}
    </button>
  );
}

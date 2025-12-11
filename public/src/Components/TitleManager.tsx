import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface TitleManagerProps {
  children: React.ReactNode;
}

export default function TitleManager({ children }: TitleManagerProps) {
  const location = useLocation();

  useEffect(() => {
    const segments = location.pathname
      .split("/")
      .filter(Boolean);

    const capitalizedSegments = segments.map((segment) =>
      segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    );

    const formattedPath = capitalizedSegments.join(" | ");

    document.title = formattedPath
      ? `GEC Mobile Application – Admin Panel | ${formattedPath}`
      : "GEC Mobile Application – Admin Panel";
  }, [location.pathname]);

  return <>{children}</>;
}

import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { UserProfilesDataGrid } from "@/Components/Dashboard/User/Profile";
import JsonViewer from "@/Components/Dashboard/JsonViewer/JsonViewer";
import FileManagement from "@/Components/Dashboard/FileManagement/FileManagement";
import EmailTemplatesDataGrid from "@/Components/Dashboard/EmailTemplate/EmailTemplate";
import UserProfileForm from "@/Components/Dashboard/UserProfileForm/UserProfileForm";
import { NewsletterSubscribers } from "@/Components/Dashboard/NewsletterSubscribers/NewsletterSubscribers";
import LogoutComponent from "./Logout";
import "./Dashboard.css";

// --- Types ---
type MenuItem =
  | "users"
  | "sitedata"
  | "file_management"
  | "email_management"
  | "newsletter_subscribers"
  | "profile"
  | "logout";

// --- Menu access control ---
const accessControl: Record<MenuItem, string[]> = {
  users: ["admin"],
  sitedata: ["admin", "procurement"],
  file_management: ["admin", "procurement"],
  email_management: ["admin", "procurement"],
  newsletter_subscribers: ["admin", "procurement"],
  profile: ["user"],
  logout: ["admin", "user", "procurement"],
};

// --- Menu titles ---
const menuTitles: Record<MenuItem, string> = {
  users: "User Profiles",
  sitedata: "Website Data",
  file_management: "File Management",
  email_management: "Email Templates",
  newsletter_subscribers: "Email Subscribers",
  profile: "Profile",
  logout: "Logout",
};

// --- Default tab based on role ---
const getDefaultTab = (role: string): MenuItem => {
  switch (role) {
    case "admin":
      return "users";
    case "procurement":
      return "sitedata";
    case "user":
    default:
      return "profile";
  }
};

const Dashboard: React.FC = () => {
  const userProfile = useSelector((state: any) => state.auth?.user);
  const userRole = userProfile?.role || "user";

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem>(
    getDefaultTab(userRole)
  );
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const handleMenuClick = (item: MenuItem) => {
    
    setSelectedMenu(item);

    if (mounted && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // --- Component map ---
  const componentMap: Record<MenuItem, React.ReactNode> = useMemo(
    () => ({
      users: <UserProfilesDataGrid />,
      sitedata: <JsonViewer />,
      file_management: <FileManagement />,
      email_management: <EmailTemplatesDataGrid />,
      newsletter_subscribers: <NewsletterSubscribers />,
      profile: <UserProfileForm initialProfile={userProfile} />,
      logout: <LogoutComponent />,
    }),
    [userProfile]
  );

  // --- Filter menu items by role ---
  const filteredMenuItems = useMemo(
    () =>
      (Object.keys(componentMap) as MenuItem[]).filter((item) =>
        accessControl[item]?.includes(userRole)
      ),
    [componentMap, userRole]
  );

  const selectedComponent =
    filteredMenuItems.includes(selectedMenu)
      ? componentMap[selectedMenu]
      : null;

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <button
          className="close-btn"
          onClick={toggleSidebar}
          aria-label="Close sidebar"
        >
          ×
        </button>

        <nav>
          <ul>
            {filteredMenuItems.map((item) => (
              <li
                key={item}
                className={selectedMenu === item ? "active" : ""}
                onClick={() => handleMenuClick(item)}
                role="button"
                tabIndex={0}
              >
                {menuTitles[item]}
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <button
          className="open-sidebar-btn"
          onClick={toggleSidebar}
          aria-label="Open sidebar"
        >
          ☰
        </button>

        {selectedComponent}
      </main>
    </div>
  );
};

export default Dashboard;

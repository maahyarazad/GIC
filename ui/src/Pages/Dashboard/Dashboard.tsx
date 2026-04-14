import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

import { UserProfilesDataGrid } from "@/Components/Dashboard/User/Profile";
import { ContactUsRequests } from "@/Components/Dashboard/ContactUsRequests/ContactUsRequests";
import JsonViewer from "@/Components/Dashboard/JsonViewer/JsonViewer";
import FileManagement from "@/Components/Dashboard/FileManagement/FileManagement";
import EmailTemplatesDataGrid from "@/Components/Dashboard/EmailTemplate/EmailTemplate";
import UserProfileForm from "@/Components/Dashboard/UserProfileForm/UserProfileForm";
import EconomicInsights from "@/Components/EconomicInsights/EconomicInsights";
import Continent from "@/Components/Dashboard/Continent/Continent";
import { NewsletterSubscribers } from "@/Components/Dashboard/NewsletterSubscribers/NewsletterSubscribers";
import LogoutComponent from "./Logout";
import "./Dashboard.css";
import { usePage } from "../../providers/PageContext";
import UnderDevelopment from "../UnderDevelopment/UnderDevelopment";
import Events from "@/Components/Dashboard/Events/Events";
import type { RootState } from "../../store";

type MenuItem =
  | "requests"
  | "users"
  | "events"
  | "blog"
  | "sitedata"
  | "file_management"
  | "email_management"
  | "newsletter_subscribers"
  | "continent"
  | "profile"
  | "economic_insights"
  | "logout";

const accessControl: Record<MenuItem, string[]> = {
  requests: ["admin"],
  users: ["admin"],
  events: ["user", "admin", "procurement"],
  blog: ["admin", "procurement"],
  sitedata: ["admin", "procurement"],
  file_management: ["admin", "procurement"],
  email_management: ["admin", "procurement"],
  newsletter_subscribers: ["admin", "procurement"],
  continent: ["admin", "procurement"],
  profile: ["user"],
  economic_insights: ["user", "admin", "procurement"],
  logout: ["admin", "user", "procurement"],
};

const menuTitles: Record<MenuItem, string> = {
  requests: "Member Requests",
  users: "Member Profiles",
  events: "Events",
  blog: "Blog",
  sitedata: "Website Data",
  file_management: "File Management",
  email_management: "Email Templates",
  newsletter_subscribers: "Email Subscribers",
  continent: "Manage Countries",
  profile: "Profile",
  economic_insights: "Economic Insights",
  logout: "Logout",
};

const getDefaultTab = (role: string): MenuItem => {
  switch (role) {
    case "admin":
      return "continent";
    case "procurement":
      return "sitedata";
    case "user":
    default:
      return "profile";
  }
};

const isValidMenuItem = (value: string | null): value is MenuItem => {
  return [
    "requests",
    "users",
    "events",
    "blog",
    "sitedata",
    "file_management",
    "email_management",
    "newsletter_subscribers",
    "continent",
    "profile",
    "economic_insights",
    "logout",
  ].includes(value || "");
};

const Dashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const userProfile = useSelector((state: RootState) => state.auth?.user);
  const authLoading = useSelector((state: RootState) => state.auth?.loading);
  const { activePage } = usePage();

  const userRole = userProfile?.role;

  const componentMap: Record<MenuItem, React.ReactNode> = {
    requests: <ContactUsRequests />,
    users: <UserProfilesDataGrid />,
    events: <Events />,
    blog: <UnderDevelopment withLockOverlay={false} />,
    sitedata: <JsonViewer />,
    file_management: <FileManagement />,
    email_management: <EmailTemplatesDataGrid />,
    newsletter_subscribers: <NewsletterSubscribers />,
    continent: <Continent />,
    profile: <UserProfileForm initialProfile={userProfile} />,
    economic_insights: <EconomicInsights />,
    logout: <LogoutComponent />,
  };

  const filteredMenuItems = useMemo(() => {
    if (!userRole) return [];
    return (Object.keys(componentMap) as MenuItem[]).filter((item) =>
      accessControl[item]?.includes(userRole)
    );
  }, [userRole]);

  const defaultTab = useMemo<MenuItem | null>(() => {
    if (!userRole) return null;

    const roleDefault = getDefaultTab(userRole);
    return filteredMenuItems.includes(roleDefault)
      ? roleDefault
      : filteredMenuItems[0] ?? null;
  }, [userRole, filteredMenuItems]);

  const tabFromQuery = searchParams.get("tab");

  const resolvedTab = useMemo<MenuItem | null>(() => {
    // do not resolve anything until auth is ready
    if (authLoading || !userRole) return null;

    if (
      isValidMenuItem(tabFromQuery) &&
      filteredMenuItems.includes(tabFromQuery)
    ) {
      return tabFromQuery;
    }

    return defaultTab;
  }, [authLoading, userRole, tabFromQuery, filteredMenuItems, defaultTab]);

  useEffect(() => {
    // never rewrite the URL until auth is fully known
    if (authLoading || !userRole || !resolvedTab) return;

    const currentTab = searchParams.get("tab");
    if (currentTab === resolvedTab) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", resolvedTab);
    setSearchParams(nextParams, { replace: true });
  }, [authLoading, userRole, resolvedTab, searchParams, setSearchParams]);

  const handleMenuClick = (item: MenuItem) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", item);
    setSearchParams(nextParams, { replace: true });

    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // avoid rendering wrong tab while auth is still resolving
  if (authLoading || !userRole || !resolvedTab) {
    return null;
  }

  const selectedComponent = componentMap[resolvedTab];

  return (
    <div className={`dashboard ${activePage === "/dashboard" ? "active" : ""}`}>
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <button
          className="close-btn"
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label="Close sidebar"
        >
          ×
        </button>

        <div className="nav">
          <ul>
            {filteredMenuItems.map((item) => (
              <li
                key={item}
                className={resolvedTab === item ? "active" : ""}
                onClick={() => handleMenuClick(item)}
                role="button"
                tabIndex={0}
              >
                {menuTitles[item]}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="main-content">
        <button
          className="open-sidebar-btn"
          onClick={() => setSidebarOpen((prev) => !prev)}
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
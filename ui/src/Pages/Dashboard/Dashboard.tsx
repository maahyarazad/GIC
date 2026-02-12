import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { UserProfilesDataGrid } from "@/Components/Dashboard/User/Profile";
import JsonViewer from "@/Components/Dashboard/JsonViewer/JsonViewer";
import FileManagement from "@/Components/Dashboard/FileManagement/FileManagement";
import EmailTemplatesDataGrid from "@/Components/Dashboard/EmailTemplate/EmailTemplate";
import UserProfileForm from "@/Components/Dashboard/UserProfileForm/UserProfileForm";
import EconomicInsights from "@/Components/EconomicInsights/EconomicInsights";
import Continent from "@/Components/Dashboard/Continent/Continent";
import { NewsletterSubscribers } from "@/Components/Dashboard/NewsletterSubscribers/NewsletterSubscribers";
import LogoutComponent from "./Logout";
import "./Dashboard.css";
import { useRouter } from "reac";

// --- Types ---
type MenuItem =
    | "users"
    | "sitedata"
    | "file_management"
    | "email_management"
    | "newsletter_subscribers"
    | "continent"
    | "profile"
    | "economic_insights"
    | "logout";

// --- Menu access control ---
const accessControl: Record<MenuItem, string[]> = {
    users: ["admin"],
    sitedata: ["admin", "procurement"],
    file_management: ["admin", "procurement"],
    email_management: ["admin", "procurement"],
    newsletter_subscribers: ["admin", "procurement"],
    continent: ["admin", "procurement"],
    profile: ["user"],
    economic_insights: ["user","admin", "procurement"],
    logout: ["admin", "user", "procurement"],
};

// --- Menu titles ---
const menuTitles: Record<MenuItem, string> = {
    users: "User Profiles",
    sitedata: "Website Data",
    file_management: "File Management",
    email_management: "Email Templates",
    newsletter_subscribers: "Email Subscribers",
    continent: "Manage Continents",
    profile: "Profile",
    economic_insights: "Economic Insights",
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

import { setReady } from '../../features/appSlice';
import { useDispatch } from "react-redux";
const Dashboard: React.FC = () => {


    const dispatch = useDispatch();
    React.useEffect(() => {
        dispatch(setReady(true));

    }, [dispatch])


    useEffect(() => {
        const onPopState = () => {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get("tab") as MenuItem;
            if (tab) setSelectedMenu(tab);
        };

        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    const userProfile = useSelector((state: any) => state.auth?.user);
    const userRole = userProfile?.role || "user";


    // Read initial tab from query param
    const getTabFromQuery = () => {
        const params = new URLSearchParams(window.location.search);
        return (params.get("tab") as MenuItem) || getDefaultTab(userRole);
    };


    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState<MenuItem>(getTabFromQuery());
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => setMounted(true), []);

    const toggleSidebar = () => setSidebarOpen((prev) => !prev);

    const handleMenuClick = (item: MenuItem) => {
        setSelectedMenu(item);

        // Only update history if window is available
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            params.set("tab", item);
            window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
        }

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
            continent: <Continent />,
            profile: <UserProfileForm initialProfile={userProfile} />,
            economic_insights: <EconomicInsights />,
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

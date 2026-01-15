import React, { useState, useEffect, useRef } from "react";
import { UserProfilesDataGrid } from '@/Components/Dashboard/User/Profile'
import JsonViewer from '@/Components/Dashboard/JsonViewer/JsonViewer'
import FileManagement from '@/Components/Dashboard/FileManagement/FileManagement'
import EmailTemplatesDataGrid from '@/Components/Dashboard/EmailTemplate/EmailTemplate'
import UserProfileForm from '@/Components/Dashboard/UserProfileForm/UserProfileForm'
import { NewsletterSubscribers } from "@/Components/Dashboard/NewsletterSubscribers/NewsletterSubscribers";
import { useSelector } from 'react-redux';
import LogoutComponent from "./Logout";
import './Dashboard.css'



const getDefaultTab = (role: string): MenuItem => {
  switch (role) {
    case "admin":
      return "users";
    case "procurement":
      return "file_management";
    case "user":
    default:
      return "profile";
  }
};

// Define all your menu items consistently:
type MenuItem =
    | "users"
    | "sitedata"
    | "file_management"
    | "email_management"
    | "newsletter_subscribers"
    | "profile"
    | "logout"


// Access control map — ensure keys match MenuItem exactly:
const accessControl: Record<MenuItem, string[]> = {
    users: ["admin"],
    sitedata: ["admin", "procurement"],
    file_management: ["admin", "procurement"],
    email_management: ["admin", "procurement"],
    newsletter_subscribers: ["admin", "procurement"],
    profile: ["user"],
    logout: ["admin", "user", "procurement"],

};


const menuTitles: Record<MenuItem, string> = {
    users: "User Profiles",
    sitedata: "Website Data",
    file_management: "File Management",
    email_management: "Email Templates",
    newsletter_subscribers: "Email Subscribers",
    logout: "Logout",
    profile: "Profile",
};


const Dashboard: React.FC = () => {


    const userProfile = useSelector((state: any) => state.auth?.user);
    const userRole = userProfile?.role || "user";
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState<MenuItem>(getDefaultTab(userRole));




    // Map menu items to React nodes:
    const componentMap: Record<MenuItem, React.ReactNode> = {
        users: <UserProfilesDataGrid />,
        sitedata: <JsonViewer />,
        file_management: <FileManagement />,
        email_management: <EmailTemplatesDataGrid />,
        newsletter_subscribers: <NewsletterSubscribers />,
        profile: <UserProfileForm initialProfile={userProfile} />,
        logout: <LogoutComponent />

    };

    // Filter menu items based on access control
    const filteredMenuItems = (Object.keys(componentMap) as MenuItem[]).filter(
        (item) => accessControl[item]?.includes(userRole)
    );


    // Sidebar toggle
    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    const handleMenuClick = (item: MenuItem) => {
        setSelectedMenu(item);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    // Sliding selector
    const selectorRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Array<HTMLLIElement | null>>([]);

    useEffect(() => {
        const selectedIndex = filteredMenuItems.indexOf(selectedMenu);
        const el = itemRefs.current[selectedIndex];
        const selector = selectorRef.current;

        if (el && selector) {
            selector.style.width = `${el.offsetWidth}px`;
            selector.style.transform = `translateY(${el.offsetTop}px)`;
        }
    }, [selectedMenu, filteredMenuItems]);

    
    const selectedComponent =
        selectedMenu && filteredMenuItems.includes(selectedMenu)
            ? componentMap[selectedMenu]
            : null;


    useEffect(() => {
        if (userRole === "user") {
            setSelectedMenu("profile"); // must be a MenuItem string
        }
    }, [userRole]);


    return (
        <div className="dashboard">
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
                        <div className="selector" ref={selectorRef}></div>
                        {filteredMenuItems.map((item, idx) => (
                            <li
                                key={item}
                                ref={(el) => (itemRefs.current[idx] = el)}
                                className={selectedMenu === item ? "active" : ""}
                                onClick={() => handleMenuClick(item)}
                                style={{ cursor: "pointer" }}
                            >
                                {menuTitles[item]}
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

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
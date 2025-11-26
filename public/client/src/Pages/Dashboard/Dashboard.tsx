import React, { useState } from "react";
import {UserProfilesDataGrid} from '../../Components/Dashboard/User/Profile'
import JsonViewer from '../../Components/Dashboard/JsonViewer/JsonViewer'
import FileManagement from '../../Components/Dashboard/FileManagement/FileManagement'
import EmailTemplatesDataGrid from '../../Components/Dashboard/EmailTemplate/EmailTemplate'
import { useSelector } from 'react-redux';
import './Dashboard.css'

const MenuItemSample = () => <div>Content for Menu Sample</div>;

// Define all your menu items consistently:
type MenuItem =
  | "users"
  | "sitedata"
  | "file_management"
  | "email_management"
  // | "manage_profile"
  // | "item5"
  // | "item6"
  // | "item7"
  // | "item8"
  // | "item9"
  // | "item10";

// Access control map — ensure keys match MenuItem exactly:
const accessControl: Record<MenuItem, string[]> = {
  users: ["admin"],       
  sitedata: ["admin"],
  file_management: ["admin"],
  email_management: ["admin"],
 
};

// Map menu items to React nodes:
const componentMap: Record<MenuItem, React.ReactNode> = {
  users: <UserProfilesDataGrid />,
  sitedata: <JsonViewer />,
  file_management: <FileManagement />,
  email_management: <EmailTemplatesDataGrid />,
  
};


const menuTitles: Record<MenuItem, string> = {
  users: "User Profiles",
  sitedata: "Website Data",
  file_management: "File Management",
  email_management: "Email Templates",
};


 const Dashboard: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem>("users");
  const userProfile = useSelector((state: any) => state.auth?.user);
  const userRole = userProfile?.role || "user"; // default to 'user' or guest

  // Filter menu items based on access control and user role
  const filteredMenuItems = (Object.keys(componentMap) as MenuItem[]).filter(
    (item) => accessControl[item]?.includes(userRole)
  );

  // If selectedMenu is not accessible, reset to null (or first allowed item if you want)
  React.useEffect(() => {
    if (!filteredMenuItems.includes(selectedMenu)) {
      setSelectedMenu(filteredMenuItems[0] ?? null as any);
    }
  }, [filteredMenuItems, selectedMenu]);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const handleMenuClick = (item: MenuItem) => {
    setSelectedMenu(item);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Get the component to render, or null if not accessible
  const selectedComponent = selectedMenu && filteredMenuItems.includes(selectedMenu)
    ? componentMap[selectedMenu]
    : null;

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
            {filteredMenuItems.map((item) => (
              <li
                key={item}
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
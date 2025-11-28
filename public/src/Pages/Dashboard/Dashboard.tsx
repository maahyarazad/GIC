import React, { useState , useEffect, useRef} from "react";
import {UserProfilesDataGrid} from '../../Components/Dashboard/User/Profile'
import JsonViewer from '../../Components/Dashboard/JsonViewer/JsonViewer'
import FileManagement from '../../Components/Dashboard/FileManagement/FileManagement'
import EmailTemplatesDataGrid from '../../Components/Dashboard/EmailTemplate/EmailTemplate'
import { useSelector } from 'react-redux';
import LogoutComponent from "./Logout";
import './Dashboard.css'

const MenuItemSample = () => <div>Content for Menu Sample</div>;

// Define all your menu items consistently:
type MenuItem =
  | "users"
  | "sitedata"
  | "file_management"
  | "email_management"
  | "logout"


// Access control map — ensure keys match MenuItem exactly:
const accessControl: Record<MenuItem, string[]> = {
  users: ["admin"],       
  sitedata: ["admin"],
  file_management: ["admin"],
  email_management: ["admin"],
  logout: ["admin", "user"],
 
};

// Map menu items to React nodes:
const componentMap: Record<MenuItem, React.ReactNode> = {
  users: <UserProfilesDataGrid />,
  sitedata: <JsonViewer />,
  file_management: <FileManagement />,
  email_management: <EmailTemplatesDataGrid />,
  logout: <LogoutComponent />
  
};


const menuTitles: Record<MenuItem, string> = {
  users: "User Profiles",
  sitedata: "Website Data",
  file_management: "File Management",
  email_management: "Email Templates",
  logout: "Logout",
};


const Dashboard: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem>("users");

  const userProfile = useSelector((state: any) => state.auth?.user);
  const userRole = userProfile?.role || "user";

  // Filter menu items based on access control
  const filteredMenuItems = (Object.keys(componentMap) as MenuItem[]).filter(
    (item) => accessControl[item]?.includes(userRole)
  );

  // Reset selectedMenu if current menu is not accessible
  // useEffect(() => {
  //   if (!filteredMenuItems.includes(selectedMenu)) {
  //     setSelectedMenu(filteredMenuItems[0] ?? null as any);
  //   }
  // }, [filteredMenuItems, selectedMenu]);

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
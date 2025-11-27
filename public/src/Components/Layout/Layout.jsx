import React from "react";
import "./Layout.css"; // Optional for extra styling

const Layout = ({ children }) => {
  return (
    <div className="default-layout">
      <div className="layout-background" />
      <main className="layout-content">{children}</main>
    </div>
  );
};

export default Layout;

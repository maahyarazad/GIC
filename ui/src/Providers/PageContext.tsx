

import React, { createContext, useContext, useState, ReactNode } from "react";

// ----- Context Types -----
interface PageContextType {
    activePage: string;
    showPage: (name: string) => void;
}

// ----- Create Context -----
const PageContext = createContext<PageContextType | undefined>(undefined);

// ----- Provider Component -----
interface PageProviderProps {
    children: ReactNode;
    initialPage?: string;
}

export const PageProvider: React.FC<PageProviderProps> = ({ children, initialPage = "home" }) => {
    const [activePage, setActivePage] = useState<string>(initialPage);

    const showPage = (name: string) => {
        setActivePage(name);

        if (typeof window !== "undefined") {
            window.scrollTo(0, 0);
        }
    };

    return (
        <PageContext.Provider value={{ activePage, showPage }}>
            {children}
        </PageContext.Provider>
    );
};

// ----- Custom Hook -----
export const usePage = (): PageContextType => {
    const context = useContext(PageContext);
    if (!context) {
        throw new Error("usePage must be used within a PageProvider");
    }
    return context;
};

import { useState, useEffect } from "react"


import './ArrowDown.css'

export default function ArrowDown() {

    const [isVisible, setIsVisible] = useState(true);
    const toggleVisibility = () => {
        setIsVisible(window.scrollY < 200);
    };
   

        const handleScroll = () => {
            toggleVisibility();
    

        };
    
        
    
        useEffect(() => {
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        }, []);
    return (
        <div className={`${isVisible ? "" : "hidden"}`}>

            <div 

            className="arrow">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    )
}


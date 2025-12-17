import { useState, useEffect } from "react"


import './ArrowDown.css'

export default function ArrowDown() {

    const [scrolled, setScrolled] = useState(false);



    const handleScroll = () => { setScrolled(window.pageYOffset > 100); };


    console.log(window.pageYOffset > 100);
    console.log(window.pageYOffset);
    useEffect(() => {
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    return (
        <div className={`arrow-container`}>

            <div

                className={`${scrolled ? "invisible" : ""} arrow`}>
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    )
}


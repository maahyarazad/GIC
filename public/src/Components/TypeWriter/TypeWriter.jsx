import { useEffect, useState } from "react";
import './TypeWriter.css';
import Ollama_Microphone from "../Ollama_Microphone/Ollama_Microphone";

const TypeWriter = () => {
    const slogans = [
        "We Design .",
        "We Develop  .",
        "We Strategize  .",
        "We Maintain  ."
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % slogans.length);
        }, 3000);

        return () => clearInterval(interval);
    }, []);


    return (
        <>
            <div className="typewriter-container">
                <div className="typewriter">
                    <div>
                        <p style={{
                            width: `${slogans[currentIndex].length + 1}ch`,

                        }}
                        >{slogans[currentIndex]}</p>
                        
                    </div>

                </div>
                  <div className="d-flex justify-content-center">

                            <Ollama_Microphone />
                        </div>      
            </div>
            
        </>
    );
};

export default TypeWriter;

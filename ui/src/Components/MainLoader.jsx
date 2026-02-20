import React, { useState, useEffect } from 'react';


const MainLoader = () => {
    
    return (
        <section style={{ height: '100dvh', backgroundColor: 'var(--primary-gray-color)', color: 'white' }} className="align-items-center d-flex flex-column hero justify-content-center">
            <h1 className='text-center'>Welcome to German Indusry Club</h1>
            <p className="loading-text">
                Loading content<span className="dots" aria-hidden="true"></span>
            </p>

        </section>
        // <div className='loader-container'>   
        //     <span className="loader"></span>
        // </div>
    )
}


export default MainLoader
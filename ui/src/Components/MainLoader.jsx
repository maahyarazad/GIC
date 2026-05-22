import React, { useState, useEffect } from 'react';
import mainGOCLogo from  '../../public/gic-logo-main.png';

import './MainLoader.css'
const MainLoader = () => {
    
    return (
        <section style={{ height: '100dvh', backgroundColor: '#090201', color: 'white' }} className="align-items-center d-flex flex-column hero justify-content-center">
        {/* <section style={{ height: '100dvh', color: 'white' }} className=" hero-unveiling align-items-center d-flex flex-column hero justify-content-center"> */}
            {/* <h1 className='text-center mt-3'>Unveiling soon</h1>
            <h1 className='text-center invisible' >Welcome to German Indusry Club</h1> */}
          
       
            <img src={mainGOCLogo}  height={100}/>
            <p className="loading-text">
                Loading content<span className="dots" aria-hidden="true"></span>
            </p>

        </section>
    )
}


export default MainLoader
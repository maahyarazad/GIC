import React, { useState, useEffect } from 'react';


 const MainLoader= ()=>{
    return (
        <div suppressHydrationWarning className='loader-container'>   
            <span className="loader"></span>
        </div>
    )
}


export default MainLoader
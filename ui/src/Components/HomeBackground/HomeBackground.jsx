import { useContext, useState, useCallback } from "react";
    import { useDispatch } from "react-redux";
import { setReady } from '../../features/appSlice'; // adjust path
import { EnvContext } from '../../EnvContext';
import ArrowDown from '@/Components/ArrowDown/ArrowDown';

const HomeBackground = ({ background }) => {
  const env = useContext(EnvContext);
  const dispatch = useDispatch();

  const [videoLoaded, setVideoLoaded] = useState(false);

  const handleVideoLoaded = useCallback(() => {
    setVideoLoaded(true);
    
    dispatch(setReady(true));
    
  }, [dispatch]);

  return (
    <div>
      <video autoPlay loop muted playsInline
        style={{
          position: "absolute",
          width: "100%",
          height: "95%",
          objectFit: "cover",
          top: 0,
          left: 0,
        }} 
        onLoadedData={handleVideoLoaded}
      >
        <source src={`${env.VITE_SERVER_API_URL}/uploads/${background}`} type="video/mp4" fetchPriority='high'/>
        Your browser does not support the video tag.
      </video>
      <ArrowDown />
    </div>
  );
};

export default HomeBackground;

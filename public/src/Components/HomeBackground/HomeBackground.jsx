const HomeBackground = ({background}) => {

    return (
      <div>
        <video
            autoPlay
            loop
            muted
            playsInline
            style={{
            position: "absolute",
            width: "100%",
            height: "95%",
            objectFit: "cover", // makes sure video covers the container nicely
            top: 0,
            left: 0,
            }}
        >
            <source src={`${import.meta.env.VITE_SERVER_API_URL}/uploads/${background}`} type="video/mp4" />
            Your browser does not support the video tag.
        </video>
        </div>

    );
};

export default HomeBackground;

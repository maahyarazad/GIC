interface LoaderProps {
  size?: number;
  borderWidth?: number;
}

const Loader = ({ size = 20, borderWidth = 3 }: LoaderProps) => {
  return (
    <div className="application-loader">
      <span
        className="loader"
        style={{ width: size, height: size, borderWidth }}
      />
    </div>
  );
};

export default Loader;
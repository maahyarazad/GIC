import React, { useState, useEffect, useContext } from "react";
import { loginUser, LoginModel } from "../../api/auth";
import "./Boardroom.css";
import { useSelector, useDispatch } from "react-redux";
import { useToast } from "../../providers/ToastContext";
import { login, setLoadingFalse, setLoadingTrue } from "../../features/authSlice";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { RootState } from "../../store";
import Button  from "../../Components/Button/Button";
import LockOverlay from '../../Components/LockOverlay/LockOverlay'
import './Boardroom.css';



import { EnvContext } from '@/EnvContext';
interface Props {
  siteData: any;
}

const Boardroom: React.FC<Props> = ({siteData}) => {
     const env = useContext(EnvContext);


  const dispatch = useDispatch();
  const { show } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useSelector((state: RootState) => state.auth.user);
  const loading = useSelector((state: RootState) => state.auth.loading);



  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      
    }
  }, [loading, user, location.pathname]);


interface BoardroomEvent {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
}

interface BoardroomProps {
  boardroom: BoardroomEvent[];
}


  return (
    <div className="boardroom">
        <LockOverlay/>
      {siteData.boardroom.map(({ id, imageUrl, title, description }) => (
        <div className="boardroom__item" key={id}>
          <img src={`${env.VITE_SERVER_API_URL}/uploads/${imageUrl}`} alt={title} className="boardroom__image" />
          <div className="boardroom__overlay">
            <h3 className="boardroom__title">{title}</h3>
            <p className="boardroom__description">{description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Boardroom;

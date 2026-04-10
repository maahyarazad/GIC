import React from "react";

type Props = {
    event: any;
    _onClick : (page: String) => void
}

const EventCard : React.FC<Props> = ({ event, _onClick }) => (
  <div className="ev-card" style={event.cardStyle} onClick={()=> _onClick(event.page)} >
    <div className="ev-vis" style={event.visStyle}>
      <div className="ev-city">{event.city}</div>
      <div className="ev-date" style={event.dateStyle}>
        <div className="ev-day">{event.day}</div>
        <div className="ev-mon">{event.monthLabel}</div>
      </div>
    </div>

    <div className="ev-ct">
      <div className="ev-type">{event.type}</div>
      <div className="ev-title">{event.title}</div>
      <p className="ev-desc">{event.description}</p>

      <div className="ev-meta">
        {event.meta.map((item, index) => (
          <div key={index} className="ev-mi">
            {item}
          </div>
        ))}
      </div>
    </div>
  </div>
);


export default EventCard;
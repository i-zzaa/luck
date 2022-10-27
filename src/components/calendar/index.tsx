import  {  useRef } from "react";
import '@fullcalendar/react/dist/vdom';

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

import "@fullcalendar/common/main.min.css";
import "@fullcalendar/daygrid/main.min.css";
import "@fullcalendar/timegrid/main.min.css";

// import FullCalendar from "@fullcalendar/react"; // must go before plugins
// import { FullCalendar } from 'primereact/fullcalendar';
// import { EventService } from '../service/EventService';
// import dayGridPlugin from '@fullcalendar/daygrid';
// import timeGridPlugin from '@fullcalendar/timegrid';
// import interactionPlugin from "@fullcalendar/interaction";
// import '@fullcalendar/core/main.css';
// import "@fullcalendar/daygrid/main.css";
// import "@fullcalendar/timegrid/main.css";
// import ptLocale from "@fullcalendar/common/locales/pt";


// import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from "@fullcalendar/list";
// import resourceTimelinePlugin from '@fullcalendar/resource-timeline';

export const CalendarComponent = ({ events, openModalEdit }: any) => {
  const calendarRef = useRef(null);

  return (
    <div>
      <div className="card">
        <FullCalendar
          plugins={[dayGridPlugin,listPlugin,  timeGridPlugin ]}
          locale="pt"
          // locales={[ptLocale]}
          initialView="dayGridMonth"
          events={events}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,listWeek",
          }}
          ref={calendarRef}
          eventClick={openModalEdit}
          // eventChange={openModalEdit}
          dayMaxEventRows={true}
          views={{
            timeGrid: {
              dayMaxEventRows: 6,
            },
          }}
        />


      </div>
    </div>
  );
};
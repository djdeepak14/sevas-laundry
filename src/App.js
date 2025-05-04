import React, { useState } from 'react';
import './App.css';

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const machines = ["Washer 1", "Washer 2", "Dryer 1", "Dryer 2"];

// Dynamic time slot generation
const generateTimeSlots = (startHour, endHour) => {
  const slots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    slots.push(`${hour}:00`);
  }
  return slots;
};

const App = () => {
  const [selected, setSelected] = useState([]); // Track selected slots
  const [washerBookings, setWasherBookings] = useState(0); // Track number of washers booked in a week
  const timeSlots = generateTimeSlots(8, 22); // Generate time slots from 8 AM to 10 PM

  // Function to toggle selection and lock dryer for the next hour
  const toggleSelect = (id) => {
    const [day, time, machine] = id.split('-');
    const isWasher = machine.includes("Washer");
    const isDryer = machine.includes("Dryer");

    // Prevent booking more than 2 washers per week
    if (washerBookings >= 2 && isWasher && !selected.includes(id)) {
      alert("You can only book 2 washers per week.");
      return;
    }

    // Handle selecting a washer and automatically selecting the corresponding dryer for next hour
    if (isWasher) {
      const nextHourTime = `${parseInt(time.split(':')[0], 10) + 1}:00`; // Next hour
      const nextHourId = `${day}-${nextHourTime}-${machine.replace('Washer', 'Dryer')}`;

      setSelected(prev => {
        // If the washer or dryer is already selected, do nothing
        if (prev.includes(id)) {
          return prev;
        }

        // Update the selection array and count washer bookings
        const newSelected = [...prev, id, nextHourId];

        // Update the washer booking count (only increment when a washer is selected)
        if (!prev.includes(id)) {
          setWasherBookings(prevBookings => prevBookings + 1);
        }

        return newSelected;
      });
    } else if (isDryer) {
      // Prevent selecting a dryer if it's already locked
      setSelected(prev => {
        // If the dryer is already selected, do nothing
        if (prev.includes(id)) {
          return prev;
        }
        // Return updated state with the newly selected dryer
        return [...prev, id];
      });
    }

    // Check if 1 washer and 1 dryer are selected and lock the ability to select more
    if (washerBookings >= 2) {
      alert("You have booked 2 washers and dryers for the week. You can't book more.");
    }
  };

  return (
    <div className="container">
      <img src="/sevas.png" alt="Sevas Logo" className="logo" />
      <h1 className="heading">Sevas Online Laundry Booking System</h1>

      <div className="schedule">
        {weekdays.map(day => (
          <div key={day} className="day-section">
            <h2 className="day-header">{day}</h2>
            <div className="machine-grid">
              {machines.map(machine => (
                <div key={machine} className="machine-column">
                  <div className="machine-label">{machine}</div>
                  <div className="time-scroll">
                    {timeSlots.map(time => {
                      const id = `${day}-${time}-${machine}`;
                      return (
                        <button
                          key={id}
                          className={`time-slot ${selected.includes(id) ? 'selected' : ''}`}
                          onClick={() => toggleSelect(id)}
                          disabled={washerBookings >= 2 && machine.includes("Washer") && !selected.includes(id)}  // Prevent booking more than 2 washers
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;

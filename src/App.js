import React, { useState, useEffect } from 'react';
import './App.css';

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const machines = [
  { name: "Washer 1", type: "washer" },
  { name: "Washer 2", type: "washer" },
  { name: "Dryer 1", type: "dryer" },
  { name: "Dryer 2", type: "dryer" },
];
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const generateTimeSlots = (startHour, endHour) => {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour}:00 - ${hour + 1}:00`);
  }
  return slots;
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const App = () => {
  const today = new Date(2025, 4, 6); // May 6, 2025, 12:42 AM EEST
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // May (4)
  const [currentYear, setCurrentYear] = useState(today.getFullYear()); // 2025
  const [selectedDay, setSelectedDay] = useState(null); // { date, dayName }
  const [bookings, setBookings] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('sevasBookings');
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedSlots, setSelectedSlots] = useState(() => {
    const saved = localStorage.getItem('sevasSelectedSlots');
    return saved ? JSON.parse(saved) : {};
  });

  const timeSlots = generateTimeSlots(8, 22); // 8 AM to 10 PM
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  // Save bookings and selectedSlots to localStorage
  useEffect(() => {
    localStorage.setItem('sevasBookings', JSON.stringify(bookings));
    localStorage.setItem('sevasSelectedSlots', JSON.stringify(selectedSlots));
  }, [bookings, selectedSlots]);

  const handleMonthChange = (direction) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDay(null);
  };

  const handleDayClick = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    const dayName = weekdays[date.getDay()];
    setSelectedDay({ date, dayName });
  };

  const getWeekKey = (date) => {
    const year = date.getFullYear();
    const weekNum = getWeekNumber(date);
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
  };

  const toggleBooking = (id, machine, machineType) => {
    if (!id) return;

    const [day, time] = id.split('-');
    const date = new Date(selectedDay.date);
    const weekKey = getWeekKey(date);
    const booking = { id, day, time, machine, machineType };

    if (bookings[weekKey]?.some((b) => b.id === id)) {
      // Unbook
      setBookings((prev) => ({
        ...prev,
        [weekKey]: prev[weekKey].filter((b) => b.id !== id),
      }));
      setSelectedSlots((prev) => ({ ...prev, [`${day}-${machine}`]: '' }));
    } else {
      // Book
      const weekBookings = bookings[weekKey] || [];
      const washerCount = weekBookings.filter((b) => b.machineType === 'washer').length;
      const dryerCount = weekBookings.filter((b) => b.machineType === 'dryer').length;

      if (machineType === 'washer' && washerCount >= 2) {
        alert("You can only book 2 washing machines per week.");
        return;
      }
      if (machineType === 'dryer' && dryerCount >= 2) {
        alert("You can only book 2 dryers per week.");
        return;
      }

      setBookings((prev) => ({
        ...prev,
        [weekKey]: [...weekBookings, booking],
      }));
    }
  };

  const isSlotDisabled = (id, machine, machineType) => {
    const date = new Date(selectedDay.date);
    const weekKey = getWeekKey(date);
    const isSelected = bookings[weekKey]?.some((b) => b.id === id);
    const isBookedElsewhere = bookings[weekKey]?.some(
      (b) => b.machine === machine && b.id !== id
    );
    const washerCount = bookings[weekKey]?.filter((b) => b.machineType === 'washer').length || 0;
    const dryerCount = bookings[weekKey]?.filter((b) => b.machineType === 'dryer').length || 0;

    return (
      ((machineType === 'washer' && washerCount >= 2) ||
       (machineType === 'dryer' && dryerCount >= 2)) &&
      !isSelected
    ) || isBookedElsewhere;
  };

  const handleUnbookFromList = (weekKey, id) => {
    setBookings((prev) => ({
      ...prev,
      [weekKey]: prev[weekKey].filter((b) => b.id !== id),
    }));
    const [day, , machine] = id.split('-');
    setSelectedSlots((prev) => ({ ...prev, [`${day}-${machine}`]: '' }));
  };

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null); // Empty cells before first day
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Get bookings for the selected week's display
  const selectedWeekKey = selectedDay ? getWeekKey(selectedDay.date) : null;
  const weekBookings = bookings[selectedWeekKey] || [];

  return (
    <div className="container mx-auto p-4 flex flex-col min-h-screen">
      <img 
        src="/sevas.png" 
        alt="Sevas Logo" 
        className="logo mx-auto h-16 mb-4" 
        onError={(e) => (e.target.src = 'https://via.placeholder.com/150x50?text=Sevas+Logo')} 
      />
      <h1 className="heading text-2xl font-bold text-center mb-6">Sevas Online Laundry Booking System</h1>

      {/* Month Navigation and Calendar */}
      <div className="calendar-section mb-6">
        <div className="calendar-header flex justify-between items-center mb-4">
          <button
            onClick={() => handleMonthChange(-1)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Previous
          </button>
          <h2 className="text-xl font-semibold">{`${months[currentMonth]} ${currentYear}`}</h2>
          <button
            onClick={() => handleMonthChange(1)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Next
          </button>
        </div>
        <div className="calendar-grid grid grid-cols-7 gap-1">
          {weekdays.map((day) => (
            <div key={day} className="calendar-day-header text-center font-semibold p-2 bg-gray-200">
              {day}
            </div>
          ))}
          {calendarDays.map((day, index) => (
            <div
              key={index}
              onClick={day ? () => handleDayClick(day) : null}
              className={`calendar-day p-2 text-center border rounded-md ${
                day
                  ? currentMonth === today.getMonth() &&
                    currentYear === today.getFullYear() &&
                    day === today.getDate()
                    ? 'bg-green-500 text-white'
                    : selectedDay && selectedDay.date.getDate() === day &&
                      selectedDay.date.getMonth() === currentMonth &&
                      selectedDay.date.getFullYear() === currentYear
                    ? 'bg-blue-500 text-white'
                    : 'bg-white hover:bg-gray-100 cursor-pointer'
                  : 'bg-gray-100'
              }`}
            >
              {day || ''}
            </div>
          ))}
        </div>
      </div>

      {/* Middle Section: Selected Day's Schedule */}
      {selectedDay && (
        <div className="schedule flex-grow flex items-center justify-center mb-6">
          <div className="day-section w-full max-w-5xl">
            <h2 className="day-header text-xl font-semibold mb-4 text-center">
              {`${selectedDay.dayName}, ${months[currentMonth]} ${selectedDay.date.getDate()}, ${currentYear}`}
            </h2>
            <div className="machine-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {machines.map((machine) => {
                const slotId = `${selectedDay.dayName}-${machine.name}`;
                const selectedTime = selectedSlots[slotId] || '';
                const bookingId = selectedTime ? `${selectedDay.dayName}-${selectedTime}-${machine.name}` : '';
                const isBooked = bookings[selectedWeekKey]?.some((b) => b.id === bookingId);

                return (
                  <div key={machine.name} className="machine-column bg-white p-4 rounded-lg">
                    <div className="machine-label font-medium mb-2">{machine.name}</div>
                    <div className="dropdown-container">
                      <label 
                        htmlFor={`time-select-${slotId}`} 
                        className="block text-sm font-medium mb-1"
                      >
                        Select Time Slot:
                      </label>
                      <select
                        id={`time-select-${slotId}`}
                        value={selectedTime}
                        onChange={(e) => setSelectedSlots((prev) => ({ ...prev, [slotId]: e.target.value }))}
                        disabled={bookings[selectedWeekKey]?.length >= 4 && !isBooked}
                        className="w-full p-2 border rounded-md mb-2"
                      >
                        <option value="">Select Time</option>
                        {timeSlots.map((slot) => (
                          <option
                            key={slot}
                            value={slot}
                            disabled={isSlotDisabled(`${selectedDay.dayName}-${slot}-${machine.name}`, machine.name, machine.type)}
                          >
                            {slot}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => toggleBooking(bookingId, machine.name, machine.type)}
                        disabled={!selectedTime || (bookings[selectedWeekKey]?.length >= 4 && !isBooked)}
                        aria-label={`${isBooked ? 'Unbook' : 'Book'} ${machine.name} on ${selectedDay.dayName} at ${selectedTime}`}
                        className={`w-full p-2 rounded-md text-white ${
                          isBooked ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                        } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                      >
                        {isBooked ? 'Unbook' : 'Book'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Booked Machines Display */}
      <div className="booked-section bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Booked Machines for Week {selectedWeekKey || 'N/A'}</h2>
        {weekBookings.length > 0 ? (
          <ul className="space-y-2">
            {weekBookings.map((booking) => (
              <li key={booking.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                <span>{`${booking.day}, ${booking.time}, ${booking.machine}`}</span>
                <button
                  onClick={() => handleUnbookFromList(selectedWeekKey, booking.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Unbook
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No machines booked for this week.</p>
        )}
      </div>
    </div>
  );
};

export default App;

import { useEffect, useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEdit2,
  FiMapPin,
} from "react-icons/fi";

import AddEventModal from "../components/calendar/AddEventModal";

import api from "../api/axios";
import toast from "react-hot-toast";

function Calendar() {
  // ========================================
  // CURRENT USER
  // ========================================

  const storedUser = localStorage.getItem("user");

  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const currentUserId = currentUser?.id || currentUser?._id;

  // ========================================
  // STATES
  // ========================================

  const [isOpen, setIsOpen] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());

  const [showModal, setShowModal] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState(null);

  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  // ========================================
  // WEEK START PREFERENCE
  // ========================================

  const [weekStartsOn, setWeekStartsOn] = useState("Monday");

  // ========================================
  // TODAY
  // ========================================

  const today = new Date();

  // ========================================
  // MONTH NAMES
  // ========================================

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // ========================================
  // WEEK DAYS
  // ========================================

  const weekDays =
    weekStartsOn === "Monday"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // ========================================
  // FETCH CALENDAR DATA
  // ========================================

  const fetchCalendarData = async () => {
    try {
      setLoading(true);

      const [calendarResponse, settingsResponse] = await Promise.all([
        api.get("/calendar"),
        api.get("/settings"),
      ]);

      // ========================================
      // EVENTS
      // ========================================

      setEvents(calendarResponse.data?.events || []);

      // ========================================
      // WEEK PREFERENCE
      // ========================================

      const savedWeekStart =
        settingsResponse.data?.preferences?.weekStartsOn || "Monday";

      setWeekStartsOn(savedWeekStart);
    } catch (error) {
      console.error("Get Calendar Data Error:", error);

      toast.error(error.response?.data?.message || "Failed to load calendar");
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // LOAD CALENDAR DATA
  // ========================================

  useEffect(() => {
    fetchCalendarData();
  }, []);

  // ========================================
  // CURRENT MONTH
  // ========================================

  const currentYear = currentDate.getFullYear();

  const currentMonth = currentDate.getMonth();

  // ========================================
  // CURRENT MONTH EVENTS
  // ========================================

  const currentMonthEvents = events
    .filter((event) => {
      const eventDate = new Date(event.startDate);

      return (
        eventDate.getMonth() === currentMonth &&
        eventDate.getFullYear() === currentYear
      );
    })
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  // ========================================
  // UPCOMING EVENTS
  // ========================================

  const startOfToday = new Date();

  startOfToday.setHours(0, 0, 0, 0);

  const upcomingEvents = events
    .filter((event) => new Date(event.startDate) >= startOfToday)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 4);

  // ========================================
  // CALENDAR STRUCTURE
  // ========================================

  /*
    JavaScript getDay():

    Sunday    = 0
    Monday    = 1
    Tuesday   = 2
    ...
    Saturday  = 6
  */

  const nativeFirstDay = new Date(currentYear, currentMonth, 1).getDay();

  /*
    If calendar begins on Monday:

    Monday    => 0
    Tuesday   => 1
    ...
    Sunday    => 6

    Formula:
    (getDay() + 6) % 7
  */

  const firstDayOfMonth =
    weekStartsOn === "Monday" ? (nativeFirstDay + 6) % 7 : nativeFirstDay;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const emptyDays = Array(firstDayOfMonth).fill(null);

  const monthDays = Array.from(
    {
      length: daysInMonth,
    },

    (_, index) => index + 1,
  );

  const calendarDays = [...emptyDays, ...monthDays];

  // ========================================
  // PREVIOUS MONTH
  // ========================================

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  // ========================================
  // NEXT MONTH
  // ========================================

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // ========================================
  // TODAY
  // ========================================

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // ========================================
  // EVENTS FOR DAY
  // ========================================

  const getEventsForDay = (day) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startDate);

      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentMonth &&
        eventDate.getFullYear() === currentYear
      );
    });
  };

  // ========================================
  // CHECK TODAY
  // ========================================

  const isToday = (day) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  // ========================================
  // EVENT STYLE
  // ========================================

  const getEventStyle = (type) => {
    if (type === "Meeting") {
      return "bg-blue-50 text-blue-600 border-blue-100";
    }

    if (type === "Deadline") {
      return "bg-red-50 text-red-600 border-red-100";
    }

    if (type === "Reminder") {
      return "bg-yellow-50 text-yellow-600 border-yellow-100";
    }

    return "bg-purple-50 text-purple-600 border-purple-100";
  };

  // ========================================
  // FORMAT TIME
  // ========================================

  const formatEventTime = (event) => {
    if (event.allDay) {
      return "All day";
    }

    return new Date(event.startDate).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ========================================
  // FORMAT DATE
  // ========================================

  const formatEventDate = (event) => {
    return new Date(event.startDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ========================================
  // CHECK EVENT PERMISSION
  // ========================================

  const canManageEvent = (event) => {
    if (!event) {
      return false;
    }

    if (currentUser?.role === "Project Manager") {
      return true;
    }

    const creatorId =
      typeof event.createdBy === "object"
        ? event.createdBy?._id
        : event.createdBy;

    if (!creatorId || !currentUserId) {
      return false;
    }

    return creatorId.toString() === currentUserId.toString();
  };

  // ========================================
  // OPEN CREATE MODAL
  // ========================================

  const handleOpenCreate = () => {
    setSelectedEvent(null);

    setShowModal(true);
  };

  // ========================================
  // OPEN EDIT MODAL
  // ========================================

  const handleOpenEdit = (event) => {
    if (!canManageEvent(event)) {
      return;
    }

    setSelectedEvent(event);

    setShowModal(true);
  };

  // ========================================
  // CLOSE MODAL
  // ========================================

  const handleCloseModal = () => {
    if (saving || deleting) {
      return;
    }

    setShowModal(false);

    setSelectedEvent(null);
  };

  // ========================================
  // CREATE / UPDATE EVENT
  // ========================================

  const handleSaveEvent = async (payload) => {
    try {
      setSaving(true);

      // ========================================
      // EDIT EXISTING EVENT
      // ========================================

      if (selectedEvent) {
        const response = await api.put(
          `/calendar/${selectedEvent._id}`,
          payload,
        );

        const updatedEvent = response.data.event;

        setEvents((previousEvents) =>
          previousEvents.map((event) =>
            event._id === updatedEvent._id ? updatedEvent : event,
          ),
        );

        toast.success("Event updated successfully");

        const eventDate = new Date(updatedEvent.startDate);

        setCurrentDate(
          new Date(eventDate.getFullYear(), eventDate.getMonth(), 1),
        );
      }

      // ========================================
      // CREATE NEW EVENT
      // ========================================
      else {
        const response = await api.post("/calendar", payload);

        const createdEvent = response.data.event;

        setEvents((previousEvents) => [...previousEvents, createdEvent]);

        toast.success("Event created successfully");

        const eventDate = new Date(createdEvent.startDate);

        setCurrentDate(
          new Date(eventDate.getFullYear(), eventDate.getMonth(), 1),
        );
      }

      setShowModal(false);

      setSelectedEvent(null);
    } catch (error) {
      console.error("Save Calendar Event Error:", error);

      toast.error(error.response?.data?.message || "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // DELETE EVENT
  // ========================================

  const handleDeleteEvent = async () => {
    if (!selectedEvent) {
      return;
    }

    try {
      setDeleting(true);

      await api.delete(`/calendar/${selectedEvent._id}`);

      setEvents((previousEvents) =>
        previousEvents.filter((event) => event._id !== selectedEvent._id),
      );

      toast.success("Event deleted successfully");

      setShowModal(false);

      setSelectedEvent(null);
    } catch (error) {
      console.error("Delete Calendar Event Error:", error);

      toast.error(error.response?.data?.message || "Failed to delete event");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f7f8fc]">
      {/* =====================================
          SIDEBAR
      ====================================== */}

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* =====================================
          RIGHT SIDE
      ====================================== */}

      <div className="flex-1 min-w-0 overflow-x-hidden">
        <Topbar
          setIsOpen={setIsOpen}
          title="Calendar"
          actionLabel="Add Event"
          onAction={handleOpenCreate}
        />

        <main className="p-3 sm:p-4 lg:p-5">
          {/* =================================
              PAGE HEADING
          ================================== */}

          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-800">
              Team Calendar
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              View meetings, deadlines and team events
            </p>
          </div>

          {/* =================================
              CALENDAR CONTROLS
          ================================== */}

          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {monthNames[currentMonth]} {currentYear}
                </h3>

                <p className="text-xs text-gray-400 mt-1">
                  {currentMonthEvents.length} scheduled{" "}
                  {currentMonthEvents.length === 1 ? "event" : "events"}
                </p>

                <p className="text-[10px] text-gray-400 mt-1">
                  Week starts on {weekStartsOn}
                </p>
              </div>

              {/* MONTH NAVIGATION */}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToday}
                  className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={handlePreviousMonth}
                  className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50"
                >
                  <FiChevronLeft />
                </button>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </div>

          {/* =================================
              LOADING
          ================================== */}

          {loading && (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm mt-4 py-16 text-center">
              <p className="text-sm text-gray-400">Loading calendar...</p>
            </div>
          )}

          {/* =================================
              DESKTOP CALENDAR
          ================================== */}

          {!loading && (
            <div className="hidden md:block bg-white border border-gray-100 rounded-xl shadow-sm mt-4 overflow-hidden">
              {/* WEEK DAYS */}

              <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="py-3 text-center text-xs font-medium text-gray-500"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* CALENDAR DAYS */}

              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  const dayEvents = day ? getEventsForDay(day) : [];

                  return (
                    <div
                      key={`${day}-${index}`}
                      className="min-h-32 border-r border-b border-gray-100 p-2"
                    >
                      {day && (
                        <>
                          {/* DATE */}

                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                              isToday(day)
                                ? "bg-purple-600 text-white"
                                : "text-gray-600"
                            }`}
                          >
                            {day}
                          </div>

                          {/* EVENTS */}

                          <div className="space-y-1.5 mt-2">
                            {dayEvents.map((event) => {
                              const manageable = canManageEvent(event);

                              return (
                                <button
                                  type="button"
                                  key={event._id}
                                  onClick={() => handleOpenEdit(event)}
                                  disabled={!manageable}
                                  title={
                                    manageable ? "Click to edit" : event.title
                                  }
                                  className={`w-full text-left rounded-md border px-2 py-1.5 ${getEventStyle(
                                    event.type,
                                  )} ${
                                    manageable
                                      ? "cursor-pointer hover:opacity-80"
                                      : "cursor-default"
                                  }`}
                                >
                                  <p className="text-[10px] font-medium truncate">
                                    {event.title}
                                  </p>

                                  <p className="text-[9px] mt-0.5 opacity-70">
                                    {formatEventTime(event)}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================
              MOBILE EVENT LIST
          ================================== */}

          {!loading && (
            <div className="md:hidden mt-4 space-y-3">
              {currentMonthEvents.map((event) => {
                const eventDate = new Date(event.startDate);

                const manageable = canManageEvent(event);

                return (
                  <div
                    key={event._id}
                    className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      {/* DATE */}

                      <div className="w-12 h-12 shrink-0 rounded-xl bg-purple-100 text-purple-600 flex flex-col items-center justify-center">
                        <span className="text-base font-semibold">
                          {eventDate.getDate()}
                        </span>

                        <span className="text-[9px] uppercase">
                          {monthNames[eventDate.getMonth()].slice(0, 3)}
                        </span>
                      </div>

                      {/* EVENT INFO */}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-gray-800">
                            {event.title}
                          </h3>

                          <span
                            className={`rounded-full border px-2 py-1 text-[10px] ${getEventStyle(
                              event.type,
                            )}`}
                          >
                            {event.type}
                          </span>
                        </div>

                        {/* DESCRIPTION */}

                        {event.description && (
                          <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <FiClock />

                            <span>{formatEventTime(event)}</span>
                          </div>

                          {event.location && (
                            <div className="flex items-center gap-1.5">
                              <FiMapPin />

                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>

                        {/* EDIT */}

                        {manageable && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(event)}
                            className="flex items-center gap-1.5 mt-3 text-xs font-medium text-purple-600 hover:text-purple-700"
                          >
                            <FiEdit2 />
                            Edit Event
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* EMPTY */}

              {currentMonthEvents.length === 0 && (
                <div className="bg-white border border-gray-100 rounded-xl p-8 text-center shadow-sm">
                  <FiCalendar className="mx-auto text-purple-400 text-2xl" />

                  <p className="text-sm font-medium text-gray-600 mt-3">
                    No events this month
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Click Add Event to create one.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* =================================
              UPCOMING EVENTS
          ================================== */}

          {!loading && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-sm mt-4">
              <div className="flex items-center gap-2">
                <FiCalendar className="text-purple-600" />

                <h3 className="text-sm font-semibold text-gray-800">
                  Upcoming Events
                </h3>
              </div>

              {upcomingEvents.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
                  {upcomingEvents.map((event) => {
                    const manageable = canManageEvent(event);

                    return (
                      <button
                        type="button"
                        key={event._id}
                        onClick={() => handleOpenEdit(event)}
                        disabled={!manageable}
                        className={`border border-gray-100 rounded-lg p-3 flex items-center justify-between gap-3 text-left ${
                          manageable
                            ? "hover:border-purple-200 hover:bg-purple-50/30 cursor-pointer"
                            : "cursor-default"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {event.title}
                          </p>

                          <p className="text-xs text-gray-400 mt-1">
                            {formatEventDate(event)}
                            {" • "}
                            {formatEventTime(event)}
                          </p>

                          {event.location && (
                            <p className="text-[10px] text-gray-400 mt-1 truncate">
                              {event.location}
                            </p>
                          )}
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] ${getEventStyle(
                            event.type,
                          )}`}
                        >
                          {event.type}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-400">No upcoming events</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* =====================================
          ADD / EDIT EVENT MODAL
      ====================================== */}

      {showModal && (
        <AddEventModal
          event={selectedEvent}
          onClose={handleCloseModal}
          onSubmit={handleSaveEvent}
          onDelete={selectedEvent ? handleDeleteEvent : undefined}
          saving={saving}
          deleting={deleting}
        />
      )}
    </div>
  );
}

export default Calendar;

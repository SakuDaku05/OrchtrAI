import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { getCalendarEvents } from '../lib/api';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, MapPin, Tag, RefreshCw, AlertCircle } from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    parseISO,
    isToday
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getCalendarEvents();
            setEvents(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch events:", err);
            setError("Failed to load global calendar events.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const onDateClick = day => setSelectedDate(day);

    const getEventsForDay = (date) => {
        return events.filter(event => {
            if (!event.start_time) return false;
            try {
                const eventDate = parseISO(event.start_time);
                return isSameDay(eventDate, date);
            } catch (e) {
                return false;
            }
        });
    };

    const renderHeader = () => {
        return (
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <CalendarIcon className="text-black" size={20} />
                    {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={fetchEvents}
                        className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-slate-700 flex items-center gap-1.5 text-sm bg-white border border-gray-200 shadow-sm font-medium"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        Sync
                    </button>
                    <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1">
                        <button
                            onClick={prevMonth}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-slate-600"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={nextMonth}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-slate-600"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = [];
        const startDate = startOfWeek(currentDate);
        for (let i = 0; i < 7; i++) {
            days.push(
                <div key={i} className="text-center font-bold text-xs text-slate-400 uppercase tracking-widest py-2">
                    {format(addDays(startDate, i), 'EEE')}
                </div>
            );
        }
        return <div className="grid grid-cols-7 mb-2 border-b border-gray-100 pb-2">{days}</div>;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const dateFormat = "d";
        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, dateFormat);
                const cloneDay = day;

                const dayEvents = getEventsForDay(cloneDay);
                const hasEvents = dayEvents.length > 0;
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isTodayDate = isToday(day);

                days.push(
                    <div
                        className={`
                            relative flex flex-col items-center justify-center p-2 h-14 w-full cursor-pointer transition-all duration-200 rounded-xl group
                            ${!isCurrentMonth ? "text-gray-300 pointer-events-none" : "hover:bg-gray-50"}
                        `}
                        key={day}
                        onClick={() => onDateClick(cloneDay)}
                    >
                        {isSelected && (
                            <motion.div
                                layoutId="selectedDay"
                                className="absolute inset-x-2 inset-y-1 bg-black rounded-xl z-0 shadow-sm"
                                initial={false}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}

                        <span className={`z-10 text-sm ${
                            isSelected
                                ? "text-white font-bold"
                                : isTodayDate
                                    ? "text-black font-extrabold"
                                    : "text-slate-700 font-medium"
                        }`}>
                            {formattedDate}
                        </span>

                        {hasEvents && (
                            <div className="flex gap-1 mt-1 z-10">
                                {dayEvents.slice(0, 3).map((e, idx) => (
                                    <span
                                        key={idx}
                                        className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-slate-800 group-hover:bg-black"}`}
                                    />
                                ))}
                                {dayEvents.length > 3 && <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-white opacity-70" : "bg-gray-400"}`} />}
                            </div>
                        )}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7 gap-1 mt-1" key={day}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div>{rows}</div>;
    };

    const renderAgenda = () => {
        const dayEvents = getEventsForDay(selectedDate);

        return (
            <div className="flex flex-col h-full pl-6 bg-gray-50/50 border-l border-gray-100">
                <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                    Agenda
                </h3>
                <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-gray-100">
                    {format(selectedDate, 'EEEE, MMMM do, yyyy')}
                </p>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    <AnimatePresence mode='popLayout'>
                        {dayEvents.length > 0 ? (
                            dayEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time)).map((event, idx) => (
                                <motion.div
                                    key={event.id || idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                                    className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all relative overflow-hidden group"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-black" />
                                    <h4 className="font-bold text-slate-900 leading-tight mb-3">
                                        {event.title}
                                    </h4>

                                    <div className="flex flex-col gap-2 text-xs text-slate-500 mt-2">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-gray-400" />
                                            <span className="font-medium">
                                                {format(parseISO(event.start_time), 'h:mm a')}
                                                {event.end_time && ` - ${format(parseISO(event.end_time), 'h:mm a')}`}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Tag size={14} className="text-gray-400" />
                                            <span className="bg-gray-100 border border-gray-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                                {event.type || 'EVENT'}
                                            </span>
                                        </div>
                                    </div>

                                    {event.description && (
                                        <p className="text-sm text-slate-600 mt-4 pt-4 border-t border-gray-100 line-clamp-2 leading-relaxed">
                                            {event.description}
                                        </p>
                                    )}
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-16 text-center"
                            >
                                <div className="bg-white border border-gray-200 p-4 rounded-full mb-4 text-gray-400 shadow-sm">
                                    <CalendarIcon size={28} />
                                </div>
                                <p className="text-slate-600 font-bold">No events scheduled.</p>
                                <p className="text-sm text-slate-500 max-w-[220px] mt-2 leading-relaxed">
                                    Start a workflow and ask OrchestrAl to add an event here.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-[#f8fafc] font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Navbar />
                
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="max-w-6xl mx-auto space-y-8 py-4">
                        
                        <div className="flex items-center justify-between bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                            <div className="flex items-start gap-5">
                                <div className="bg-black text-white p-3 rounded-xl shadow-sm mt-1">
                                    <CalendarIcon size={28} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                                        Global Calendar
                                    </h1>
                                    <p className="text-slate-500 max-w-xl leading-relaxed">
                                        View the shared timeline of all agent-scheduled events and upcoming workflow milestones.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {error ? (
                            <div className="bg-white border border-red-200 text-red-600 p-5 rounded-2xl flex items-center gap-3 shadow-sm">
                                <AlertCircle size={20} />
                                <p className="font-medium">{error}</p>
                            </div>
                        ) : (
                            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex min-h-[600px]">
                                <div className="w-8/12 p-8 border-r border-gray-100 flex flex-col">
                                    {renderHeader()}
                                    {renderDays()}
                                    {renderCells()}
                                </div>

                                <div className="w-4/12 p-8 bg-gray-50/30">
                                    {renderAgenda()}
                                </div>
                            </div>
                        )}
                        
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Calendar;
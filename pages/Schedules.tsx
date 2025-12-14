import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Schedule, Screen, RepeatType } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input, Select } from '../components/Input';
import { Calendar, Clock, Zap, Trash2, Plus, AlertCircle, Info, CalendarDays, Repeat, Edit, ChevronDown, ChevronRight, ArrowRight, CheckCircle2 } from 'lucide-react';

const Schedules: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  const [selectedScreen, setSelectedScreen] = useState('');
  const [repeatType, setRepeatType] = useState<RepeatType>(RepeatType.DAILY);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1,2,3,4,5]);
  const [priority, setPriority] = useState<number>(1);
  const [specificDate, setSpecificDate] = useState<string>('');

  const refreshData = async () => {
    const s = await StorageService.getSchedules();
    setSchedules(s);
    const scr = await StorageService.getScreens();
    setScreens(scr);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSchedule: Schedule = {
      id: editingScheduleId || Date.now().toString(),
      screenId: selectedScreen,
      repeatType,
      startTime,
      endTime,
      allDay: false,
      days: repeatType === RepeatType.WEEKLY ? selectedDays : [],
      specificDate: repeatType === RepeatType.ONCE ? specificDate : undefined,
      priority,
      active: true
    };
    await StorageService.saveSchedule(newSchedule);
    await refreshData();
    setIsModalOpen(false);
    // Reset form
    setSelectedScreen('');
    setRepeatType(RepeatType.DAILY);
    setStartTime('09:00');
    setEndTime('17:00');
    setSelectedDays([1,2,3,4,5]);
    setPriority(1);
    setSpecificDate('');
    setEditingScheduleId(null);
  };

  const handleDelete = async (id: string) => {
      if (confirm('Delete?')) {
          await StorageService.deleteSchedule(id);
          await refreshData();
      }
  };

  const getScreenName = (id: string) => screens.find(s => s.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              Schedules
            </h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">Control when your content plays</p>
          </div>
          <Button 
            onClick={() => { setEditingScheduleId(null); setIsModalOpen(true); }}
            className="shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" /> New Schedule
          </Button>
      </div>

      <div className="space-y-3">
          {schedules.length === 0 ? (
              <Card className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center">
                          <Calendar className="w-10 h-10 text-slate-400" />
                      </div>
                      <div>
                          <h3 className="text-xl font-bold text-slate-900 mb-2">No schedules yet</h3>
                          <p className="text-slate-500 mb-4">Create a schedule to control when content plays</p>
                          <Button onClick={() => { setEditingScheduleId(null); setIsModalOpen(true); }}>
                              <Plus className="w-4 h-4 mr-2" /> Create Schedule
                          </Button>
                      </div>
                  </div>
              </Card>
          ) : (
              schedules
                  .sort((a, b) => b.priority - a.priority) // Sort by priority (higher first)
                  .map(s => (
                      <Card 
                          key={s.id} 
                          className="flex justify-between items-center p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-slate-200/60"
                          hoverEffect
                      >
                          <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-bold text-lg text-slate-900">{getScreenName(s.screenId)}</h3>
                                  {s.priority > 1 && (
                                      <span className="text-xs bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-bold border border-amber-200">
                                          Priority {s.priority}
                                      </span>
                                  )}
                                  {s.active && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
                                          Active
                                      </span>
                                  )}
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                  <div className="flex items-center gap-1.5">
                                      <div className="p-1 bg-blue-100 rounded">
                                          <Clock className="w-3 h-3 text-blue-600" />
                                      </div>
                                      <span className="font-medium">{s.startTime} - {s.endTime}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                      <div className="p-1 bg-purple-100 rounded">
                                          <Repeat className="w-3 h-3 text-purple-600" />
                                      </div>
                                      <span className="capitalize font-medium">{s.repeatType}</span>
                                  </div>
                                  {s.specificDate && (
                                      <div className="flex items-center gap-1.5">
                                          <div className="p-1 bg-indigo-100 rounded">
                                              <CalendarDays className="w-3 h-3 text-indigo-600" />
                                          </div>
                                          <span className="font-medium">{new Date(s.specificDate).toLocaleDateString()}</span>
                                      </div>
                                  )}
                              </div>
                          </div>
                          <Button 
                              variant="danger" 
                              onClick={() => handleDelete(s.id)}
                              className="ml-4"
                          >
                              <Trash2 className="w-4 h-4" />
                          </Button>
                      </Card>
                  ))
          )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => {
          setIsModalOpen(false);
          setEditingScheduleId(null);
          setSelectedScreen('');
          setRepeatType(RepeatType.DAILY);
          setStartTime('09:00');
          setEndTime('17:00');
          setSelectedDays([1,2,3,4,5]);
          setPriority(1);
          setSpecificDate('');
      }} title={editingScheduleId ? "Edit Schedule" : "New Schedule"}>
          <form onSubmit={handleSave} className="space-y-4">
              <Select value={selectedScreen} onChange={e => setSelectedScreen(e.target.value)} label="Screen" required>
                  <option value="">Select Screen</option>
                  {screens.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              
              <Select value={repeatType} onChange={e => setRepeatType(e.target.value as RepeatType)} label="Repeat">
                  <option value={RepeatType.DAILY}>Daily</option>
                  <option value={RepeatType.WEEKLY}>Weekly</option>
                  <option value={RepeatType.MONTHLY}>Monthly</option>
                  <option value={RepeatType.ONCE}>Once</option>
              </Select>

              {repeatType === RepeatType.WEEKLY && (
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Days of Week</label>
                      <div className="flex gap-2 flex-wrap">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                              <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                      const newDays = selectedDays.includes(idx)
                                          ? selectedDays.filter(d => d !== idx)
                                          : [...selectedDays, idx];
                                      setSelectedDays(newDays);
                                  }}
                                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                      selectedDays.includes(idx)
                                          ? 'bg-indigo-600 text-white'
                                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                              >
                                  {day}
                              </button>
                          ))}
                      </div>
                  </div>
              )}

              {repeatType === RepeatType.ONCE && (
                  <Input 
                      type="date" 
                      value={editingScheduleId ? schedules.find(s => s.id === editingScheduleId)?.specificDate || specificDate : specificDate || new Date().toISOString().split('T')[0]}
                      onChange={e => setSpecificDate(e.target.value)}
                      label="Date"
                      required
                  />
              )}

              <div className="grid grid-cols-2 gap-4">
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} label="Start Time" required />
                  <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} label="End Time" required />
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                  <Input 
                      type="number" 
                      min="1" 
                      max="10" 
                      value={priority} 
                      onChange={e => setPriority(parseInt(e.target.value))} 
                      label="Priority (1-10, higher = more important)"
                  />
                  <p className="text-xs text-slate-500 mt-1">Higher priority schedules take precedence when overlapping</p>
              </div>

              <Button type="submit" className="w-full">Save Schedule</Button>
          </form>
      </Modal>
    </div>
  );
};

export default Schedules;

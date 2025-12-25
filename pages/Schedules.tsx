
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Schedule, Screen, RepeatType } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input, Select } from '../components/Input';
import { 
  Calendar, 
  Clock, 
  Trash2, 
  Plus, 
  CheckCircle2
} from 'lucide-react';

const Schedules: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [selectedScreen, setSelectedScreen] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1,2,3,4,5]);

  const refreshData = async () => {
    const [sc, scr] = await Promise.all([
      StorageService.getSchedules(),
      StorageService.getScreens()
    ]);
    setSchedules(sc);
    setScreens(scr);
  };

  useEffect(() => {
    const user = StorageService.getUser();
    if (!user) {
      // Will be handled by ProtectedRoute, but double-check
      return;
    }
    refreshData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScreen) return;
    
    /**
     * allDay property removed as it's not defined in the Schedule interface in types.ts
     */
    const newSchedule: Schedule = {
      id: Date.now().toString(),
      screenId: selectedScreen,
      repeatType: RepeatType.DAILY,
      startTime,
      endTime,
      days: selectedDays,
      active: true
    };
    await StorageService.saveSchedule(newSchedule);
    await refreshData();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this schedule?')) {
      /**
       * deleteSchedule implemented in StorageService to fix build error.
       */
      await StorageService.deleteSchedule(id);
      await refreshData();
    }
  };

  const getScreenName = (id: string) => screens.find(s => s.id === id)?.name || 'Unknown Screen';

  const daysLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-8 animate-fade">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1b1b1f] tracking-tight">Automation</h1>
          <p className="text-[#44474e] mt-1 font-medium">Switch menus automatically based on the time of day.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="rounded-2xl">
          <Plus className="w-4 h-4 mr-2" /> Schedule Menu
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {schedules.length === 0 ? (
          <div className="py-32 text-center bg-[#f3f3f7] rounded-2xl border-2 border-dashed border-[#e4e1ec] space-y-6">
             <Clock className="w-16 h-16 text-[#e4e1ec] mx-auto" />
             <div className="space-y-1">
                <p className="text-[#1b1b1f] font-bold text-xl">No active schedules</p>
                <p className="text-[#777680] text-sm">Perfect for lunch/dinner transitions or weekend specials.</p>
             </div>
             <Button onClick={() => setIsModalOpen(true)} className="rounded-2xl px-10">Create First Schedule</Button>
          </div>
        ) : (
          schedules.map(s => (
            <Card key={s.id} className="p-5 md:p-6 border border-[#e4e1ec] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-[#3f51b5]/30 transition-all shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="bg-[#e0e0ff] text-[#3f51b5] w-14 h-14 rounded-2xl flex items-center justify-center">
                    <Calendar className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1b1b1f] text-lg">{getScreenName(s.screenId)}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-sm font-bold text-[#3f51b5]">{s.startTime} — {s.endTime}</p>
                      <span className="w-1 h-1 bg-[#e4e1ec] rounded-full" />
                      <p className="text-xs font-bold text-[#777680] uppercase tracking-widest">Daily Schedule</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto border-t md:border-none pt-4 md:pt-0">
                  <div className="flex-1 flex gap-1">
                    {daysLabels.map((label, idx) => (
                      <div key={label} className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border ${s.days.includes(idx) ? 'bg-[#3f51b5] text-white border-[#3f51b5]' : 'bg-[#f3f3f7] text-[#777680] border-[#e4e1ec]'}`}>
                        {label.charAt(0)}
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={(e) => handleDelete(s.id, e)}
                    className="p-3 text-[#777680] hover:text-[#ba1a1a] hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Schedule">
        <form onSubmit={handleSave} className="space-y-6">
          <Select 
            label="Which screen?" 
            value={selectedScreen} 
            onChange={e => setSelectedScreen(e.target.value)}
            required
          >
            <option value="">Choose a Display...</option>
            {screens.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
             <Input 
               label="Start Time" 
               type="time" 
               value={startTime} 
               onChange={e => setStartTime(e.target.value)} 
               required 
             />
             <Input 
               label="End Time" 
               type="time" 
               value={endTime} 
               onChange={e => setEndTime(e.target.value)} 
               required 
             />
          </div>
          <div className="space-y-3">
             <label className="text-sm font-bold text-[#44474e] uppercase tracking-widest">Active Days</label>
             <div className="flex justify-between gap-1">
                {daysLabels.map((label, idx) => {
                  const isSelected = selectedDays.includes(idx);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        const next = [...selectedDays];
                        if (isSelected) {
                          const i = next.indexOf(idx);
                          next.splice(i, 1);
                        } else {
                          next.push(idx);
                        }
                        setSelectedDays(next);
                      }}
                      className={`flex-1 aspect-square rounded-2xl flex items-center justify-center font-bold text-xs transition-all border ${
                        isSelected 
                          ? 'bg-[#3f51b5] text-white border-[#3f51b5] shadow-md scale-105' 
                          : 'bg-white text-[#777680] border-[#e4e1ec] hover:border-[#3f51b5]/30'
                      }`}
                    >
                      {label.charAt(0)}
                    </button>
                  );
                })}
             </div>
          </div>
          <div className="bg-[#e0e0ff]/50 p-5 rounded-2xl border border-[#3f51b5]/10 flex items-start gap-4">
             <CheckCircle2 className="w-6 h-6 text-[#3f51b5] mt-0.5" />
             <p className="text-sm text-[#191a2c] font-medium leading-relaxed">
                Your screen will automatically switch to its default loop outside of these hours.
             </p>
          </div>
          <Button type="submit" size="lg" className="rounded-2xl shadow-none">Activate Schedule</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Schedules;

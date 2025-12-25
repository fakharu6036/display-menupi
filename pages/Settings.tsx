
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { User, PlanType } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { 
  ChevronDown, 
  ChevronUp, 
  Shield, 
  CreditCard, 
  Palette, 
  User as UserIcon,
  LogOut,
  HardDrive,
  Camera,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Monitor,
  Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(StorageService.getUser());
  const [openSection, setOpenSection] = useState<string | null>('account');
  const [planRequestStatus, setPlanRequestStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  
  useEffect(() => {
    const user = StorageService.getUser();
    if (!user) {
      navigate('/login');
    } else {
      setCurrentUser(user);
    }
  }, [navigate]);

  const [usedStorage, setUsedStorage] = useState(0);
  const planConfig = StorageService.getCurrentPlanConfig();
  
  useEffect(() => {
    const loadStorage = async () => {
      const media = await StorageService.getMedia();
      setUsedStorage(media.reduce((acc, m) => acc + (m.size_mb || 0), 0));
    };
    loadStorage();
  }, []);
  const isPro = currentUser?.plan === PlanType.PRO;

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const handlePlanRequest = async (plan: PlanType) => {
    setPlanRequestStatus('submitting');
    try {
      await StorageService.requestPlanChange(plan);
      setPlanRequestStatus('success');
      setTimeout(() => setPlanRequestStatus('idle'), 3000);
    } catch (err: any) {
      setPlanRequestStatus('idle');
      alert(err.message || 'Failed to submit plan request. Please try again.');
    }
  };

  const AccordionSection = ({ id, icon: Icon, title, children }: any) => {
    const isOpen = openSection === id;
    return (
      <div className="border border-[#e4e1ec] rounded-[24px] overflow-hidden bg-white shadow-sm mb-4 transition-all duration-300">
        <button 
          onClick={() => toggleSection(id)}
          className={`w-full flex items-center justify-between p-6 transition-colors ${isOpen ? 'bg-[#f3f3f7]' : 'hover:bg-[#f3f3f7]'}`}
        >
          <div className="flex items-center gap-5">
             <div className={`p-3 rounded-2xl transition-all duration-300 ${isOpen ? 'bg-[#3f51b5] text-white' : 'bg-[#e0e0ff] text-[#3f51b5]'}`}>
               <Icon className="w-6 h-6" />
             </div>
             <h3 className="font-bold text-[#1b1b1f] text-lg">{title}</h3>
          </div>
          {isOpen ? <ChevronUp className="w-5 h-5 text-[#777680]" /> : <ChevronDown className="w-5 h-5 text-[#777680]" />}
        </button>
        <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1200px] border-t border-[#e4e1ec]' : 'max-h-0'}`}>
          <div className="p-8 space-y-6">
            {children}
          </div>
        </div>
      </div>
    );
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade">
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-4xl font-black text-[#1b1b1f] tracking-tight">Organization Settings</h1>
          <p className="text-[#44474e] mt-2 font-medium">Manage your profile, branding, and signage plan.</p>
        </div>
      </div>

      <div className="space-y-2">
        <AccordionSection id="account" icon={UserIcon} title="Account Details">
           <div className="flex flex-col md:flex-row items-center gap-8 mb-4">
              <div className="relative group">
                 <div className="w-32 h-32 rounded-full bg-[#e0e0ff] border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold text-[#00006e] overflow-hidden">
                    {currentUser.name.charAt(0)}
                 </div>
                 <button className="absolute bottom-0 right-0 p-2.5 bg-[#3f51b5] text-white rounded-full shadow-lg hover:scale-110 transition-transform">
                   <Camera className="w-4 h-4" />
                 </button>
              </div>
              <div className="flex-1 space-y-4 w-full">
                <Input label="Manager Name" value={currentUser.name} readOnly />
                <Input label="Email Address" value={currentUser.email} readOnly />
              </div>
           </div>
           <div className="flex justify-end gap-3">
              <Button variant="tonal" className="rounded-xl">Update Credentials</Button>
           </div>
        </AccordionSection>

        <AccordionSection id="billing" icon={CreditCard} title="Subscription Plan">
           <div className="bg-[#1b1b1f] p-10 rounded-[32px] text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#e0e0ff]">Current Plan</span>
                <h3 className="text-4xl font-black mt-2 uppercase tracking-tight">{currentUser.plan} Enterprise</h3>
                <div className="flex flex-wrap gap-3 mt-6">
                   <span className="bg-white/10 px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">Unlimited Displays</span>
                   <span className="bg-white/10 px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">Whitelabeling</span>
                </div>
              </div>
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#3f51b5]/20 rounded-full blur-[80px]" />
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[#44474e] uppercase tracking-widest flex items-center gap-2">
                  <HardDrive className="w-4 h-4" /> Usage Health
                </h4>
                <div className="p-8 bg-[#f3f3f7] rounded-[24px] border border-[#e4e1ec] space-y-4">
                   <div className="flex justify-between items-end">
                      <p className="text-3xl font-black text-[#1b1b1f]">{usedStorage.toFixed(1)} MB</p>
                      <p className="text-[10px] font-black text-[#777680] uppercase tracking-widest">{(usedStorage/planConfig.storageMB * 100).toFixed(0)}% Utilized</p>
                   </div>
                   <div className="h-2.5 w-full bg-[#e4e1ec] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#3f51b5] transition-all duration-1000" 
                        style={{ width: `${(usedStorage/planConfig.storageMB) * 100}%` }}
                      />
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[#44474e] uppercase tracking-widest">Upgrade Hub</h4>
                <div className="space-y-3">
                   {planRequestStatus === 'success' ? (
                     <div className="bg-emerald-50 text-emerald-700 p-6 rounded-[24px] border border-emerald-100 flex items-center gap-4 animate-fade">
                        <CheckCircle2 className="w-8 h-8" />
                        <p className="text-sm font-bold leading-tight">Plan change request sent! Our team will approve it shortly.</p>
                     </div>
                   ) : (
                     <>
                       <div className="bg-[#f3f3f7] p-5 rounded-[24px] border border-[#e4e1ec] flex items-center justify-between group hover:border-[#3f51b5] transition-all cursor-pointer" onClick={() => handlePlanRequest(PlanType.BASIC)}>
                          <div className="min-w-0">
                             <p className="font-bold text-[#1b1b1f]">Basic Business</p>
                             <p className="text-xs text-[#777680] mt-0.5">$9/mo • 1GB Storage</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[#e4e1ec] group-hover:text-[#3f51b5] group-hover:translate-x-1 transition-all" />
                       </div>
                       <div className="bg-[#f3f3f7] p-5 rounded-[24px] border border-[#e4e1ec] flex items-center justify-between group hover:border-[#3f51b5] transition-all cursor-pointer" onClick={() => handlePlanRequest(PlanType.PRO)}>
                          <div className="min-w-0">
                             <p className="font-bold text-[#1b1b1f]">Premium Plan</p>
                             <p className="text-xs text-[#777680] mt-0.5">$29/mo • 10GB Storage</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[#e4e1ec] group-hover:text-[#3f51b5] group-hover:translate-x-1 transition-all" />
                       </div>
                       <div className="bg-[#f3f3f7] p-5 rounded-[24px] border border-[#e4e1ec] flex items-center justify-between group hover:border-[#3f51b5] transition-all cursor-pointer" onClick={() => handlePlanRequest(PlanType.ENTERPRISE)}>
                          <div className="min-w-0">
                             <p className="font-bold text-[#1b1b1f]">Enterprise Plan</p>
                             <p className="text-xs text-[#777680] mt-0.5">$99/mo • 100GB Storage</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[#e4e1ec] group-hover:text-[#3f51b5] group-hover:translate-x-1 transition-all" />
                       </div>
                     </>
                   )}
                </div>
              </div>
           </div>
        </AccordionSection>

        <AccordionSection id="branding" icon={Palette} title="Whitelabel Customization">
           <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1 space-y-4">
                 <p className="text-sm text-[#44474e] font-medium leading-relaxed">
                   Remove the "Powered by MENUPI" watermark from your screens and use your own restaurant logo on the TV player interface.
                 </p>
                 
                 {isPro ? (
                   <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-4">
                      <Shield className="w-6 h-6 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-emerald-800 leading-relaxed uppercase tracking-wide">
                          Whitelabeling Active
                        </p>
                        <p className="text-[10px] font-bold text-emerald-600 mt-0.5">Your customers see your brand, not ours.</p>
                      </div>
                   </div>
                 ) : (
                   <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                      <Lock className="w-6 h-6 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-amber-800 leading-relaxed uppercase tracking-wide">
                          Feature Locked
                        </p>
                        <p className="text-[10px] font-bold text-amber-600 mt-0.5">Upgrade to Pro Enterprise to remove the Menupi logo.</p>
                      </div>
                   </div>
                 )}
                 
                 <Button 
                   variant={isPro ? "outlined" : "tonal"} 
                   className="rounded-xl w-full" 
                   disabled={!isPro}
                   onClick={() => alert("Upload your logo to replace the MENUPI watermark.")}
                 >
                   {isPro ? "Upload Player Logo" : "Locked for Pro Members"}
                 </Button>
              </div>
              
              <div className="w-full md:w-64 aspect-video bg-[#1b1b1f] rounded-2xl border-4 border-[#e4e1ec] flex items-center justify-center p-4 relative group">
                 {!isPro && (
                    <div className="absolute top-4 right-4 bg-amber-500 text-white p-1 rounded-full shadow-lg">
                      <Lock className="w-3 h-3" />
                    </div>
                 )}
                 <div className="flex flex-col items-center gap-2 opacity-30">
                    <Monitor className="w-10 h-10 text-white" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Logo Preview</span>
                 </div>
                 
                 {!isPro && (
                   <div className="absolute bottom-4 right-4 opacity-50 flex items-center gap-1">
                      <span className="text-[6px] font-black text-white/40 uppercase tracking-widest">Powered by</span>
                      <img src="https://www.menupi.com/src/menupi-logo-black.svg" alt="MENUPI" className="h-2 brightness-0 invert opacity-40" />
                   </div>
                 )}
              </div>
           </div>
        </AccordionSection>
      </div>

      <div className="pt-10 flex flex-col items-center gap-4">
         <Button variant="danger" className="rounded-2xl px-12 group h-14" onClick={() => StorageService.logout()}>
           <LogOut className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
           Logout of MENUPI
         </Button>
         <p className="text-[10px] font-black text-[#777680] uppercase tracking-widest">Build v2.6.4 (Production)</p>
      </div>
    </div>
  );
};

export default Settings;

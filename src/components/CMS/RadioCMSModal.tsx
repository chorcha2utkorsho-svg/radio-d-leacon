import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Upload,
  FileAudio,
  Play,
  Pause,
  Radio,
  Calendar,
  CheckCircle2,
  Music,
  Plus,
  Trash2,
  Edit3,
  Settings,
  AlertTriangle,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  Volume2,
  Layers,
  Check,
  RefreshCw,
  Eye,
  Disc3,
  Mic,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ListMusic,
} from 'lucide-react';
import {
  AudioTrack,
  ScheduledProgram,
  SongRequest,
  ProgramCategory,
  BroadcastType,
  StationSettings,
} from '../../types/radio';
import { storeAudioBlob, deleteAudioBlob } from '../../services/audioStorageDB';
import { audioEngine } from '../../services/audioEngine';
import { IMAGES } from '../../services/stationStorage';

export interface RadioCMSModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: AudioTrack[];
  onUpdateTracks: (tracks: AudioTrack[]) => void;
  schedules: ScheduledProgram[];
  onUpdateSchedules: (schedules: ScheduledProgram[]) => void;
  requests: SongRequest[];
  onUpdateRequests: (requests: SongRequest[]) => void;
  stationSettings: StationSettings;
  onUpdateStationSettings: (settings: StationSettings) => void;
  onPlayTrackNow: (track: AudioTrack) => void;
  onStartAutoPilot: (tracks?: AudioTrack[]) => void;
  currentTrackId?: string;
}

const CATEGORY_LIST: { id: ProgramCategory; label: string; color: string }[] = [
  { id: 'সঙ্গীত', label: 'সঙ্গীত (Music)', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
  { id: 'লোকগীতি ও ঐতিহ্য', label: 'লোকগীতি ও ঐতিহ্য (Folk)', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
  { id: 'সাহিত্য ও আবৃত্তি', label: 'সাহিত্য ও আবৃত্তি (Literature)', color: 'border-purple-500/40 text-purple-400 bg-purple-500/10' },
  { id: 'খবর ও কারেন্ট অ্যাফেয়ার্স', label: 'খবর ও কারেন্ট অ্যাফেয়ার্স (News)', color: 'border-blue-500/40 text-blue-400 bg-blue-500/10' },
  { id: 'টকশো ও আড্ডা', label: 'টকশো ও আড্ডা (Talk Show)', color: 'border-pink-500/40 text-pink-400 bg-pink-500/10' },
  { id: 'ধ্রুপদী ও শাস্ত্রীয়', label: 'ধ্রুপদী ও শাস্ত্রীয় (Classical)', color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10' },
  { id: 'বিনোদন ও নাটক', label: 'বিনোদন ও নাটক (Drama)', color: 'border-rose-500/40 text-rose-400 bg-rose-500/10' },
  { id: 'বিশেষ অনুষ্ঠান', label: 'বিশেষ অনুষ্ঠান (Special Event)', color: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10' },
  { id: 'জিয়ল ও জিংগল', label: 'জিংগল ও স্টেশন প্রমো (Jingle)', color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10' },
];

const DAYS_NAMES = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const DAYS_SHORT = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

export const RadioCMSModal: React.FC<RadioCMSModalProps> = ({
  isOpen,
  onClose,
  tracks,
  onUpdateTracks,
  schedules,
  onUpdateSchedules,
  requests,
  onUpdateRequests,
  stationSettings,
  onUpdateStationSettings,
  onPlayTrackNow,
  onStartAutoPilot,
  currentTrackId,
}) => {
  // Navigation tabs in CMS
  const [activeTab, setActiveTab] = useState<'media' | 'schedule' | 'settings' | 'requests'>('media');

  // Preview audio player in CMS
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // --------------------------------------------------------------------------
  // TAB 1: MEDIA UPLOAD & LIBRARY STATE
  // --------------------------------------------------------------------------
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'live' | 'recorded' | 'uploaded'>('all');
  const [isUploadingSectionOpen, setIsUploadingSectionOpen] = useState(false);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('রেডিও ডি-লিকন সঞ্চালক');
  const [uploadShowTitle, setUploadShowTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<ProgramCategory>('সঙ্গীত');
  const [uploadBroadcastType, setUploadBroadcastType] = useState<BroadcastType>('recorded');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCoverImage, setUploadCoverImage] = useState<string>(IMAGES.albumArt);
  const [selectedAudioFiles, setSelectedAudioFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit Track Modal State
  const [editingTrack, setEditingTrack] = useState<AudioTrack | null>(null);

  // --------------------------------------------------------------------------
  // TAB 2: SCHEDULE MANAGEMENT STATE
  // --------------------------------------------------------------------------
  const [scheduleFilterDay, setScheduleFilterDay] = useState<number | 'all'>('all');
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  // Schedule Form State
  const [schedTitle, setSchedTitle] = useState('');
  const [schedHost, setSchedHost] = useState('আরজে অনন্যা');
  const [schedCategory, setSchedCategory] = useState<ProgramCategory>('সঙ্গীত');
  const [schedType, setSchedType] = useState<BroadcastType>('recorded');
  const [schedStartTime, setSchedStartTime] = useState('18:00');
  const [schedEndTime, setSchedEndTime] = useState('20:00');
  const [schedDays, setSchedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [schedDescription, setSchedDescription] = useState('');
  const [schedTrackId, setSchedTrackId] = useState<string>('');
  const [schedPlaylistTrackIds, setSchedPlaylistTrackIds] = useState<string[]>([]);
  const [schedCoverImage, setSchedCoverImage] = useState<string>(IMAGES.albumArt);

  // --------------------------------------------------------------------------
  // TAB 3: STATION SETTINGS STATE
  // --------------------------------------------------------------------------
  const [tempSettings, setTempSettings] = useState<StationSettings>(stationSettings);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  useEffect(() => {
    setTempSettings(stationSettings);
  }, [stationSettings]);

  // --------------------------------------------------------------------------
  // TAB 4: REQUEST MODERATION STATE
  // --------------------------------------------------------------------------
  const [requestFilterStatus, setRequestFilterStatus] = useState<'all' | 'pending' | 'approved' | 'played'>('all');

  // Stop preview audio when modal closes or unmounts
  useEffect(() => {
    if (!isOpen && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setPreviewTrackId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // --------------------------------------------------------------------------
  // HANDLERS: AUDIO PREVIEW
  // --------------------------------------------------------------------------
  const handleTogglePreview = (track: AudioTrack) => {
    if (previewTrackId === track.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPreviewTrackId(null);
    } else {
      setPreviewTrackId(track.id);
      if (track.audioUrl) {
        if (!previewAudioRef.current) {
          previewAudioRef.current = new Audio();
        }
        previewAudioRef.current.src = track.audioUrl;
        previewAudioRef.current.volume = 0.8;
        previewAudioRef.current.play().catch((err) => {
          console.warn('Audio preview play error:', err);
        });
        previewAudioRef.current.onended = () => {
          setPreviewTrackId(null);
        };
      } else {
        // Fallback synthesized preview
        audioEngine.playTrack(track.synthTheme || 'morning_raga');
      }
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS: MEDIA UPLOAD
  // --------------------------------------------------------------------------
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      setSelectedAudioFiles(files);
      if (!uploadTitle) {
        const cleanName = files[0].name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setUploadTitle(cleanName);
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAudioFiles.length === 0) {
      alert('অনুগ্রহ করে অন্তত একটি অডিও ফাইল নির্বাচন করুন।');
      return;
    }

    setIsUploading(true);
    setUploadSuccessMsg(null);

    try {
      const newTracks: AudioTrack[] = [];

      for (let i = 0; i < selectedAudioFiles.length; i++) {
        const file = selectedAudioFiles[i];
        const trackId = `track-user-${Date.now()}-${i}`;
        const blobUrl = URL.createObjectURL(file);

        // Store into IndexedDB
        await storeAudioBlob(trackId, file, file.name);

        // Estimate or extract duration
        let duration = 180;
        try {
          const tempAudio = new Audio(blobUrl);
          await new Promise<void>((resolve) => {
            tempAudio.onloadedmetadata = () => {
              if (tempAudio.duration && !isNaN(tempAudio.duration) && isFinite(tempAudio.duration)) {
                duration = Math.round(tempAudio.duration);
              }
              resolve();
            };
            tempAudio.onerror = () => resolve();
            setTimeout(resolve, 1500); // safety timeout
          });
        } catch {
          // default duration
        }

        const fileNameClean = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        const itemTitle = selectedAudioFiles.length === 1
          ? (uploadTitle.trim() || fileNameClean)
          : `${uploadTitle.trim() || 'অডিও ট্র্যাক'} #${i + 1}: ${fileNameClean}`;

        const newTrack: AudioTrack = {
          id: trackId,
          title: itemTitle,
          artist: uploadArtist.trim() || 'রেডিও ডি-লিকন উপস্থাপক',
          duration,
          category: uploadCategory,
          audioUrl: blobUrl,
          isUploaded: true,
          coverArt: uploadCoverImage || IMAGES.albumArt,
          description: uploadDescription || `আপলোডকৃত ${uploadBroadcastType === 'live' ? 'লাইভ সম্প্রচার' : 'রেকর্ডেড'} অডিও ফাইল।`,
          showTitle: uploadShowTitle.trim() || undefined,
          broadcastType: uploadBroadcastType,
          uploadedAt: new Date().toLocaleDateString('bn-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          fileSize: file.size,
        };

        newTracks.push(newTrack);
      }

      const updatedList = [...newTracks, ...tracks];
      onUpdateTracks(updatedList);

      setUploadSuccessMsg(`সফলভাবে ${newTracks.length}টি অডিও ফাইল আপলোড ও ক্যাটালগ করা হয়েছে!`);
      setSelectedAudioFiles([]);
      setUploadTitle('');
      setUploadDescription('');
      setUploadShowTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Auto close upload form after 2 seconds
      setTimeout(() => {
        setUploadSuccessMsg(null);
        setIsUploadingSectionOpen(false);
      }, 2500);
    } catch (err) {
      console.error('Upload processing error:', err);
      alert('অডিও ফাইল আপলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteTrack = async (trackId: string, trackTitle: string) => {
    if (confirm(`আপনি কি নিশ্চিত যে "${trackTitle}" অডিও ফাইলটি স্থায়ীভাবে মুছে ফেলতে চান?`)) {
      if (trackId.startsWith('track-user-')) {
        await deleteAudioBlob(trackId);
      }
      const updated = tracks.filter((t) => t.id !== trackId);
      onUpdateTracks(updated);
      if (previewTrackId === trackId) {
        if (previewAudioRef.current) previewAudioRef.current.pause();
        setPreviewTrackId(null);
      }
    }
  };

  const handleSaveTrackEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack) return;

    const updated = tracks.map((t) => (t.id === editingTrack.id ? editingTrack : t));
    onUpdateTracks(updated);
    setEditingTrack(null);
  };

  // --------------------------------------------------------------------------
  // SCHEDULE CONFLICT CHECKER
  // --------------------------------------------------------------------------
  const scheduleConflictWarning = useMemo(() => {
    if (!schedStartTime || !schedEndTime || schedDays.length === 0) return null;

    const conflicts = schedules.filter((p) => {
      if (editingScheduleId && p.id === editingScheduleId) return false;
      // Check day overlap
      const sharesDay = p.daysOfWeek.some((d) => schedDays.includes(d));
      if (!sharesDay) return false;

      // Check time overlap: [startTime, endTime)
      // Normal slot vs normal slot
      const startA = schedStartTime;
      const endA = schedEndTime;
      const startB = p.startTime;
      const endB = p.endTime;

      return (startA < endB && endA > startB);
    });

    if (conflicts.length > 0) {
      return `সতর্কতা: "${conflicts[0].title}" (${conflicts[0].startTime}-${conflicts[0].endTime}) এর সাথে সময়ের সংঘাত রয়েছে!`;
    }
    return null;
  }, [schedules, editingScheduleId, schedStartTime, schedEndTime, schedDays]);

  // --------------------------------------------------------------------------
  // HANDLERS: SCHEDULE FORM
  // --------------------------------------------------------------------------
  const handleOpenAddSchedule = (prefilledTrack?: AudioTrack) => {
    setEditingScheduleId(null);
    setSchedTitle(prefilledTrack ? prefilledTrack.title : '');
    setSchedHost(prefilledTrack ? prefilledTrack.artist : 'আরজে অনন্যা');
    setSchedCategory((prefilledTrack?.category as ProgramCategory) || 'সঙ্গীত');
    setSchedType(prefilledTrack?.broadcastType || 'recorded');
    setSchedStartTime('18:00');
    setSchedEndTime('20:00');
    setSchedDays([0, 1, 2, 3, 4, 5, 6]);
    setSchedDescription(prefilledTrack?.description || '');
    setSchedTrackId(prefilledTrack ? prefilledTrack.id : (tracks[0]?.id || ''));
    setSchedPlaylistTrackIds(prefilledTrack ? [prefilledTrack.id] : []);
    setSchedCoverImage(prefilledTrack?.coverArt || IMAGES.albumArt);
    setIsAddingSchedule(true);
  };

  const handleOpenEditSchedule = (prog: ScheduledProgram) => {
    setEditingScheduleId(prog.id);
    setSchedTitle(prog.title);
    setSchedHost(prog.host);
    setSchedCategory((prog.category as ProgramCategory) || 'সঙ্গীত');
    setSchedType(prog.type);
    setSchedStartTime(prog.startTime);
    setSchedEndTime(prog.endTime);
    setSchedDays(prog.daysOfWeek);
    setSchedDescription(prog.description);
    setSchedTrackId(prog.trackId || '');
    setSchedPlaylistTrackIds(prog.playlistTrackIds || (prog.trackId ? [prog.trackId] : []));
    setSchedCoverImage(prog.coverImage || IMAGES.albumArt);
    setIsAddingSchedule(true);
  };

  const handleSaveScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedTitle.trim()) {
      alert('অনুগ্রহ করে অনুষ্ঠানের শিরোনাম লিখুন।');
      return;
    }

    const payload: ScheduledProgram = {
      id: editingScheduleId || `sched-${Date.now()}`,
      title: schedTitle.trim(),
      host: schedHost.trim() || 'রেডিও ডি-লিকন উপস্থাপক',
      description: schedDescription.trim() || 'রেডিও ডি-লিকনের নিয়মিত সম্প্রচার অধিবেশন।',
      category: schedCategory,
      startTime: schedStartTime,
      endTime: schedEndTime,
      daysOfWeek: schedDays.length > 0 ? schedDays : [0, 1, 2, 3, 4, 5, 6],
      type: schedType,
      trackId: schedTrackId || undefined,
      playlistTrackIds: schedPlaylistTrackIds.length > 0 ? schedPlaylistTrackIds : (schedTrackId ? [schedTrackId] : undefined),
      coverImage: schedCoverImage || IMAGES.albumArt,
    };

    if (editingScheduleId) {
      onUpdateSchedules(schedules.map((s) => (s.id === editingScheduleId ? payload : s)));
    } else {
      onUpdateSchedules([...schedules, payload]);
    }

    setIsAddingSchedule(false);
    setEditingScheduleId(null);
  };

  const handleDeleteSchedule = (id: string, title: string) => {
    if (confirm(`আপনি কি নিশ্চিত যে "${title}" শিডিউলটি মুছে ফেলতে চান?`)) {
      onUpdateSchedules(schedules.filter((s) => s.id !== id));
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS: STATION SETTINGS
  // --------------------------------------------------------------------------
  const handleSaveStationSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStationSettings(tempSettings);
    setSettingsSavedSuccess(true);
    setTimeout(() => setSettingsSavedSuccess(false), 3000);
  };

  // --------------------------------------------------------------------------
  // HANDLERS: REQUEST MODERATION
  // --------------------------------------------------------------------------
  const handleUpdateRequestStatus = (reqId: string, newStatus: 'approved' | 'played' | 'pending') => {
    const updated = requests.map((r) => (r.id === reqId ? { ...r, status: newStatus } : r));
    onUpdateRequests(updated);
  };

  const handleDeleteRequest = (reqId: string) => {
    const updated = requests.filter((r) => r.id !== reqId);
    onUpdateRequests(updated);
  };

  // Filtered lists
  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      const matchQuery =
        !mediaSearchQuery ||
        track.title.toLowerCase().includes(mediaSearchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(mediaSearchQuery.toLowerCase()) ||
        (track.showTitle && track.showTitle.toLowerCase().includes(mediaSearchQuery.toLowerCase()));

      const matchCategory =
        selectedCategoryFilter === 'all' || track.category === selectedCategoryFilter;

      const matchType =
        selectedTypeFilter === 'all'
          ? true
          : selectedTypeFilter === 'live'
          ? track.broadcastType === 'live'
          : selectedTypeFilter === 'recorded'
          ? track.broadcastType === 'recorded' || !track.broadcastType
          : selectedTypeFilter === 'uploaded'
          ? track.isUploaded
          : true;

      return matchQuery && matchCategory && matchType;
    });
  }, [tracks, mediaSearchQuery, selectedCategoryFilter, selectedTypeFilter]);

  const filteredSchedules = useMemo(() => {
    if (scheduleFilterDay === 'all') return schedules;
    return schedules.filter((s) => s.daysOfWeek.includes(scheduleFilterDay));
  }, [schedules, scheduleFilterDay]);

  const filteredRequests = useMemo(() => {
    if (requestFilterStatus === 'all') return requests;
    return requests.filter((r) => r.status === requestFilterStatus);
  }, [requests, requestFilterStatus]);

  const pendingRequestsCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-6xl h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* ================================================================== */}
        {/* CMS TOP BAR                                                        */}
        {/* ================================================================== */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
              <Radio className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <span>স্টেশন সিএমএস (Station CMS)</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Admin Studio
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                অডিও আপলোড, লাইভ ও রেকর্ডেড ক্যাটালগ, সম্প্রচার সূচি এবং স্টেশন কন্টেন্ট ব্যবস্থাপনা
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Auto-Replay Button for Admin */}
            <button
              onClick={() => {
                onStartAutoPilot();
                onClose();
              }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
              title="আপলোডকৃত সমস্ত ফাইল দিয়ে সারাদিনের অটো-রিপ্লে শুরু করুন"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>সারাদিনের অটো-রিপ্লে</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close CMS"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* CMS NAVIGATION TABS                                                */}
        {/* ================================================================== */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('media')}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'media'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileAudio className="w-4 h-4" />
            <span>মিডিয়া লাইব্রেরি ও আপলোড</span>
            <span
              className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                activeTab === 'media' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {tracks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>সম্প্রচার সূচি (Schedules)</span>
            <span
              className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                activeTab === 'schedule' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {schedules.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>স্টেশন কনটেন্ট ও ঘোষণা</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'requests'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>শ্রোতাদের অনুরোধ</span>
            {pendingRequestsCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white animate-pulse">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>

        {/* ================================================================== */}
        {/* CMS TAB BODY: SCROLLABLE VIEWPORT                                  */}
        {/* ================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ================================================================ */}
          {/* TAB 1: MEDIA LIBRARY & AUDIO UPLOAD                              */}
          {/* ================================================================ */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              {/* Top Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex-1 flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="অডিও শিরোনাম, শিল্পী বা অনুষ্ঠানের নাম দিয়ে খুঁজুন..."
                      value={mediaSearchQuery}
                      onChange={(e) => setMediaSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">সকল বিভাগ (All Categories)</option>
                    {CATEGORY_LIST.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id}
                      </option>
                    ))}
                  </select>

                  {/* Type Filter */}
                  <select
                    value={selectedTypeFilter}
                    onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
                    className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">সকল টাইপ (Live & Recorded)</option>
                    <option value="recorded">রেকর্ডেড অডিও (Recorded)</option>
                    <option value="live">লাইভ অডিও (Live Session)</option>
                    <option value="uploaded">আপলোডকৃত ফাইল (Uploaded)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsUploadingSectionOpen(!isUploadingSectionOpen)}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isUploadingSectionOpen ? 'আপলোড ফর্ম বন্ধ করুন' : 'নতুন অডিও আপলোড করুন'}</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Upload Panel */}
              {isUploadingSectionOpen && (
                <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-white">
                          নতুন অডিও ফাইল আপলোড ও শ্রেণীবিন্যাস (Upload & Categorize Audio)
                        </h3>
                        <p className="text-xs text-slate-400">
                          এমপি৩, ওয়েভ, ফ্ল্যাক বা ওগ্গ ফরম্যাটে লাইভ বা রেকর্ডেড অডিও ফাইল যুক্ত করুন
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsUploadingSectionOpen(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {uploadSuccessMsg && (
                    <div className="mb-4 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{uploadSuccessMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleUploadSubmit} className="space-y-4">
                    {/* File Dropzone */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-6 text-center cursor-pointer transition-all bg-slate-900/60 group"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm"
                        multiple
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-amber-500/20 text-slate-400 group-hover:text-amber-400 flex items-center justify-center transition-colors">
                          <FileAudio className="w-6 h-6" />
                        </div>
                        {selectedAudioFiles.length > 0 ? (
                          <div>
                            <p className="text-sm font-semibold text-amber-300">
                              {selectedAudioFiles.length}টি অডিও ফাইল নির্বাচিত হয়েছে
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {selectedAudioFiles.map((f) => f.name).join(', ').slice(0, 80)}...
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-medium text-slate-200">
                              অডিও ফাইল নির্বাচন করতে ক্লিক করুন অথবা এখানে টেনে এনে ছাড়ুন
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              MP3, WAV, AAC, M4A, OGG, FLAC (ব্রাউজারের IndexedDB-তে স্থায়ীভাবে সংরক্ষিত হবে)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Audio Title */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          অডিওর শিরোনাম (Audio Title) *
                        </label>
                        <input
                          type="text"
                          required
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          placeholder="যেমন: ভোরের সুরলহরী / লাইভ আলোচনা পর্ব ০১"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Artist / Host */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          শিল্পী / আরজে / উপস্থাপকের নাম (Artist / RJ)
                        </label>
                        <input
                          type="text"
                          value={uploadArtist}
                          onChange={(e) => setUploadArtist(e.target.value)}
                          placeholder="যেমন: আরজে অনন্যা / রবীন্দ্রসঙ্গীত দল"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Category Selection */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          ক্যাটাগরি / বিভাগ (Categorization) *
                        </label>
                        <select
                          value={uploadCategory}
                          onChange={(e) => setUploadCategory(e.target.value as ProgramCategory)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                        >
                          {CATEGORY_LIST.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Broadcast Type */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          সম্প্রচার প্রকৃতি (Broadcast Format) *
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setUploadBroadcastType('recorded')}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                              uploadBroadcastType === 'recorded'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                                : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            <Disc3 className="w-3.5 h-3.5" />
                            <span>রেকর্ডেড শো (Recorded)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setUploadBroadcastType('live')}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                              uploadBroadcastType === 'live'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                                : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            <Mic className="w-3.5 h-3.5" />
                            <span>লাইভ সেশন (Live Stream)</span>
                          </button>
                        </div>
                      </div>

                      {/* Show / Series Name */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          অনুষ্ঠানের নাম / সিরিজ (Show / Series, Optional)
                        </label>
                        <input
                          type="text"
                          value={uploadShowTitle}
                          onChange={(e) => setUploadShowTitle(e.target.value)}
                          placeholder="যেমন: সকালের সুর ও সুপ্রভাত আলাপন"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Cover Image Preset */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          কভার আর্ট সিলেক্টর (Cover Art)
                        </label>
                        <div className="flex items-center gap-2">
                          {[
                            { label: 'অ্যালবাম আর্ট', src: IMAGES.albumArt },
                            { label: 'স্টুডিও কনসোল', src: IMAGES.console },
                            { label: 'আরজে অবতার', src: IMAGES.rjAvatar },
                            { label: 'অ্যাকোস্টিক ব্যানার', src: IMAGES.banner },
                          ].map((item, idx) => (
                            <button
                              type="button"
                              key={idx}
                              onClick={() => setUploadCoverImage(item.src)}
                              className={`relative w-10 h-10 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                                uploadCoverImage === item.src ? 'border-amber-400 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                              }`}
                              title={item.label}
                            >
                              <img src={item.src} alt={item.label} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        সংক্ষিপ্ত বিবরণ ও ট্যাগ (Description / Details)
                      </label>
                      <textarea
                        rows={2}
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                        placeholder="অডিও অনুষ্ঠানটির বিষয়বস্তু ও বিবরণ লিখুন..."
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Submit Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsUploadingSectionOpen(false)}
                        className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        disabled={isUploading}
                        className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-all cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50"
                      >
                        {isUploading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>আপলোড ও প্রক্রিয়াকরণ হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>লাইব্রেরিতে সংরক্ষণ করুন</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Media Table / Grid */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">
                    মোট {filteredTracks.length}টি ট্র্যাক প্রদর্শিত হচ্ছে
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="hidden sm:inline">ইন-লাইন প্রিভিউ প্লেয়ার দিয়ে অডিও শুনে নিন</span>
                  </div>
                </div>

                {filteredTracks.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-3">
                    <FileAudio className="w-12 h-12 mx-auto text-slate-600 stroke-[1.5]" />
                    <p className="text-sm font-medium">কোনো অডিও ট্র্যাক খুঁজে পাওয়া যায়নি</p>
                    <p className="text-xs text-slate-500">
                      ফিল্টার পরিবর্তন করুন অথবা উপরের বোতাম থেকে নতুন অডিও ফাইল আপলোড করুন।
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/80">
                    {filteredTracks.map((track) => {
                      const isPreviewing = previewTrackId === track.id;
                      const isLiveNow = currentTrackId === track.id;
                      const categoryInfo = CATEGORY_LIST.find((c) => c.id === track.category);

                      return (
                        <div
                          key={track.id}
                          className={`p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-900/60 transition-colors ${
                            isLiveNow ? 'bg-amber-500/5 border-l-4 border-l-amber-500' : ''
                          }`}
                        >
                          {/* Track info & preview */}
                          <div className="flex items-center gap-3.5 flex-1 min-w-0">
                            {/* Play Preview Button */}
                            <button
                              onClick={() => handleTogglePreview(track)}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                isPreviewing
                                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                              }`}
                              title={isPreviewing ? 'প্রিভিউ থামান' : 'প্রিভিউ প্লে করুন'}
                            >
                              {isPreviewing ? (
                                <Pause className="w-5 h-5 fill-current" />
                              ) : (
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              )}
                            </button>

                            {/* Cover thumbnail */}
                            <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700/60 hidden sm:block">
                              <img
                                src={track.coverArt || IMAGES.albumArt}
                                alt={track.title}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Text details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-semibold text-white truncate max-w-[280px] sm:max-w-md">
                                  {track.title}
                                </h4>
                                {isLiveNow && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                    অন-এয়ার লাইভ
                                  </span>
                                )}
                                {track.broadcastType === 'live' ? (
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    🔴 লাইভ ফিড
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                    📼 রেকর্ডেড
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                                <span>{track.artist}</span>
                                {track.showTitle && (
                                  <>
                                    <span>•</span>
                                    <span className="text-amber-400/90">{track.showTitle}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span className="font-mono text-slate-300">
                                  {Math.floor(track.duration / 60)}:
                                  {String(track.duration % 60).padStart(2, '0')} মিনিট
                                </span>
                                {track.isUploaded && (
                                  <>
                                    <span>•</span>
                                    <span className="text-emerald-400 text-[11px]">আপলোডকৃত</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Category Badge & Action Buttons */}
                          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-800/80">
                            {/* Category badge */}
                            <span
                              className={`text-xs px-2.5 py-1 rounded-md border font-medium whitespace-nowrap ${
                                categoryInfo?.color || 'border-slate-700 text-slate-300 bg-slate-800'
                              }`}
                            >
                              {track.category}
                            </span>

                            {/* Play Immediately On-Air */}
                            <button
                              onClick={() => {
                                onPlayTrackNow(track);
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                              title="রেডিও স্টেশনে এখনই লাইভ বাজান"
                            >
                              <Radio className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">অন-এয়ার চালান</span>
                            </button>

                            {/* Add to Schedule Quick Action */}
                            <button
                              onClick={() => {
                                handleOpenAddSchedule(track);
                                setActiveTab('schedule');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                              title="এই অডিওটির জন্য সম্প্রচার সময়সূচী তৈরি করুন"
                            >
                              <Calendar className="w-3.5 h-3.5 text-amber-400" />
                              <span className="hidden lg:inline">শিডিউলে নিন</span>
                            </button>

                            {/* Edit Track Metadata */}
                            <button
                              onClick={() => setEditingTrack(track)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="মেটাডাটা সম্পাদনা করুন"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete Track */}
                            <button
                              onClick={() => handleDeleteTrack(track.id, track.title)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                              title="ট্র্যাক মুছে ফেলুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: BROADCAST SCHEDULE MANAGEMENT                             */}
          {/* ================================================================ */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              {/* Schedule Header & Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap mr-1">
                    দিন ফিল্টার:
                  </span>
                  <button
                    onClick={() => setScheduleFilterDay('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                      scheduleFilterDay === 'all'
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    সকল দিন
                  </button>
                  {DAYS_SHORT.map((name, idx) => (
                    <button
                      key={idx}
                      onClick={() => setScheduleFilterDay(idx)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        scheduleFilterDay === idx
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleOpenAddSchedule()}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন শিডিউল যোগ করুন</span>
                </button>
              </div>

              {/* Add / Edit Schedule Form (Modal or Inline) */}
              {isAddingSchedule && (
                <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-xl">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-white">
                          {editingScheduleId ? 'অনুষ্ঠান শিডিউল সম্পাদনা (Edit Schedule)' : 'নতুন সম্প্রচার শিডিউল তৈরি (Create Schedule)'}
                        </h3>
                        <p className="text-xs text-slate-400">
                          নির্দিষ্ট সময়সীমা, বার এবং সংশ্লিষ্ট অডিও প্লেলিস্ট যুক্ত করুন
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAddingSchedule(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Conflict detection notice */}
                  {scheduleConflictWarning && (
                    <div className="mb-4 p-3 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs sm:text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>{scheduleConflictWarning}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveScheduleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Program Title */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          অনুষ্ঠানের নাম (Program Title) *
                        </label>
                        <input
                          type="text"
                          required
                          value={schedTitle}
                          onChange={(e) => setSchedTitle(e.target.value)}
                          placeholder="যেমন: সন্ধ্যাতারা সঙ্গীত আসর"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* RJ / Presenter */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          উপস্থাপক / আরজে (Host / RJ) *
                        </label>
                        <input
                          type="text"
                          required
                          value={schedHost}
                          onChange={(e) => setSchedHost(e.target.value)}
                          placeholder="যেমন: আরজে অনন্যা"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          বিভাগ (Category) *
                        </label>
                        <select
                          value={schedCategory}
                          onChange={(e) => setSchedCategory(e.target.value as ProgramCategory)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                        >
                          {CATEGORY_LIST.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Broadcast Type */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          সম্প্রচার প্রকৃতি (Broadcast Format) *
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSchedType('recorded')}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                              schedType === 'recorded'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                                : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            <Disc3 className="w-3.5 h-3.5" />
                            <span>রেকর্ডেড শো (Recorded)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSchedType('live')}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                              schedType === 'live'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                                : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            <Mic className="w-3.5 h-3.5" />
                            <span>সরাসরি লাইভ (Live RJ)</span>
                          </button>
                        </div>
                      </div>

                      {/* Time Slot: Start Time & End Time */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            শুরুর সময় (Start Time) *
                          </label>
                          <input
                            type="time"
                            required
                            value={schedStartTime}
                            onChange={(e) => setSchedStartTime(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            শেষের সময় (End Time) *
                          </label>
                          <input
                            type="time"
                            required
                            value={schedEndTime}
                            onChange={(e) => setSchedEndTime(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      {/* Linked Audio Track / Session */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          সংযুক্ত অডিও ট্র্যাক (Linked Audio Track)
                        </label>
                        <select
                          value={schedTrackId}
                          onChange={(e) => {
                            setSchedTrackId(e.target.value);
                            setSchedPlaylistTrackIds([e.target.value]);
                          }}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                        >
                          <option value="">-- কোনো নির্দিষ্ট ট্র্যাক নয় (লাইভ সঞ্চালন) --</option>
                          {tracks.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.title} ({t.artist}) [{t.isUploaded ? 'আপলোডকৃত' : 'সিন্থেসাইজড'}]
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Days of Week Selector */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-slate-300">
                          সম্প্রচারের দিনসমূহ (Days of Week) *
                        </label>
                        <div className="flex items-center gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setSchedDays([0, 1, 2, 3, 4, 5, 6])}
                            className="text-amber-400 hover:underline"
                          >
                            প্রতিদিন
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => setSchedDays([1, 2, 3, 4, 5])}
                            className="text-amber-400 hover:underline"
                          >
                            কর্মদিবস
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => setSchedDays([5, 6])}
                            className="text-amber-400 hover:underline"
                          >
                            ছুটির দিন (শুক্র-শনি)
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-2">
                        {DAYS_SHORT.map((name, idx) => {
                          const isSelected = schedDays.includes(idx);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  if (schedDays.length > 1) {
                                    setSchedDays(schedDays.filter((d) => d !== idx));
                                  }
                                } else {
                                  setSchedDays([...schedDays, idx]);
                                }
                              }}
                              className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                              }`}
                            >
                              {name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        অনুষ্ঠানের বর্ণনা (Description)
                      </label>
                      <textarea
                        rows={2}
                        value={schedDescription}
                        onChange={(e) => setSchedDescription(e.target.value)}
                        placeholder="শ্রোতাদের জন্য অনুষ্ঠানের সারসংক্ষেপ..."
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingSchedule(false)}
                        className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-all cursor-pointer shadow-md shadow-amber-500/20"
                      >
                        <Check className="w-4 h-4" />
                        <span>{editingScheduleId ? 'শিডিউল আপডেট করুন' : 'শিডিউল নিশ্চিত করুন'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Schedule Table / List */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">
                    {scheduleFilterDay === 'all'
                      ? `সপ্তাহের মোট ${schedules.length}টি শিডিউল প্রোগ্রাম`
                      : `${DAYS_NAMES[scheduleFilterDay]}-এর শিডিউল তালিকা (${filteredSchedules.length}টি)`}
                  </span>
                </div>

                {filteredSchedules.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-3">
                    <Calendar className="w-12 h-12 mx-auto text-slate-600 stroke-[1.5]" />
                    <p className="text-sm font-medium">কোনো শিডিউল প্রোগ্রাম পাওয়া যায়নি</p>
                    <p className="text-xs text-slate-500">
                      নতুন শিডিউল যোগ করতে উপরের বোতামটি ব্যবহার করুন।
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/80">
                    {filteredSchedules.map((prog) => {
                      const linkedTrack = tracks.find((t) => t.id === prog.trackId);
                      const categoryInfo = CATEGORY_LIST.find((c) => c.id === prog.category);

                      return (
                        <div
                          key={prog.id}
                          className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-900/60 transition-colors"
                        >
                          <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                            {/* Time badge */}
                            <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-center shrink-0 min-w-[85px]">
                              <div className="text-xs font-mono font-bold text-amber-400">
                                {prog.startTime}
                              </div>
                              <div className="text-[10px] text-slate-400">থেকে</div>
                              <div className="text-xs font-mono text-slate-300">{prog.endTime}</div>
                            </div>

                            {/* Details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-semibold text-white truncate max-w-[280px] sm:max-w-md">
                                  {prog.title}
                                </h4>
                                {prog.type === 'live' ? (
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    🔴 লাইভ আরজে
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                    📼 রেকর্ডেড
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                                <span className="text-slate-300 font-medium">{prog.host}</span>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  {prog.daysOfWeek.map((d) => (
                                    <span
                                      key={d}
                                      className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono"
                                    >
                                      {DAYS_SHORT[d]}
                                    </span>
                                  ))}
                                </div>
                                {linkedTrack && (
                                  <>
                                    <span>•</span>
                                    <span className="text-amber-400/90 truncate max-w-[160px]">
                                      অডিও: {linkedTrack.title}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Category & Actions */}
                          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-800/80">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-md border font-medium whitespace-nowrap ${
                                categoryInfo?.color || 'border-slate-700 text-slate-300 bg-slate-800'
                              }`}
                            >
                              {prog.category}
                            </span>

                            {/* If linked track exists, allow play immediately */}
                            {linkedTrack && (
                              <button
                                onClick={() => {
                                  onPlayTrackNow(linkedTrack);
                                  onClose();
                                }}
                                className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all cursor-pointer"
                                title="এই শিডিউলটি এখনই অন-এয়ারে চালান"
                              >
                                <Play className="w-4 h-4 fill-current" />
                              </button>
                            )}

                            {/* Edit Schedule */}
                            <button
                              onClick={() => handleOpenEditSchedule(prog)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="শিডিউল সম্পাদনা"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete Schedule */}
                            <button
                              onClick={() => handleDeleteSchedule(prog.id, prog.title)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                              title="শিডিউল মুছুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 3: STATION CONTENT & BRANDING SETTINGS                       */}
          {/* ================================================================ */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {settingsSavedSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span>স্টেশন কনটেন্ট ও সেটিংস সফলভাবে সংরক্ষিত এবং আপডেট করা হয়েছে!</span>
                </div>
              )}

              {/* Station Statistics Quick Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <div className="text-2xl font-bold font-mono text-amber-400">{tracks.length}</div>
                  <div className="text-xs text-slate-400 mt-1">মোট অডিও ক্যাটালগ</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    {tracks.filter((t) => t.isUploaded).length}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">আপলোডকৃত নিজস্ব ফাইল</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <div className="text-2xl font-bold font-mono text-blue-400">{schedules.length}</div>
                  <div className="text-xs text-slate-400 mt-1">সাপ্তাহিক সম্প্রচার সূচি</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <div className="text-2xl font-bold font-mono text-purple-400">{requests.length}</div>
                  <div className="text-xs text-slate-400 mt-1">শ্রোতাদের মোট অনুরোধ</div>
                </div>
              </div>

              {/* Settings Form */}
              <form onSubmit={handleSaveStationSettings} className="space-y-6">
                {/* Station Identity Section */}
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                    <Radio className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">স্টেশন পরিচিতি ও ব্র্যান্ডিং (Station Branding)</h3>
                      <p className="text-xs text-slate-400">রেডিও স্টেশনের নাম, ট্যাগলাইন ও ফ্রিকোয়েন্সি</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        রেডিও স্টেশনের নাম (Station Name)
                      </label>
                      <input
                        type="text"
                        value={tempSettings.stationName}
                        onChange={(e) => setTempSettings({ ...tempSettings, stationName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        ফ্রিকোয়েন্সি / ব্রডকাস্ট ব্যান্ড (Frequency / Stream)
                      </label>
                      <input
                        type="text"
                        value={tempSettings.frequency}
                        onChange={(e) => setTempSettings({ ...tempSettings, frequency: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      স্টেশনের স্লোগান / ট্যাগলাইন (Station Tagline)
                    </label>
                    <input
                      type="text"
                      value={tempSettings.tagline}
                      onChange={(e) => setTempSettings({ ...tempSettings, tagline: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Announcement Ticker Section */}
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <div>
                        <h3 className="text-sm font-bold text-white">জরুরি ঘোষণা ও ব্রেকিং নোটিস স্ক্রলার</h3>
                        <p className="text-xs text-slate-400">শ্রোতাদের মূল স্ক্রিনে লাইভ স্ক্রলিং বার্তা প্রদর্শন</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempSettings.isTickerActive}
                        onChange={(e) =>
                          setTempSettings({ ...tempSettings, isTickerActive: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      স্ক্রলিং বার্তার টেক্সট (Ticker Text)
                    </label>
                    <textarea
                      rows={2}
                      value={tempSettings.announcementTicker}
                      onChange={(e) =>
                        setTempSettings({ ...tempSettings, announcementTicker: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Auto-Pilot Continuous Playback Section */}
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-5 h-5 text-amber-400" />
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          সারাদিনের অটো-পাইলট ও অবিরাম রিপ্লে (Auto-Pilot 24/7)
                        </h3>
                        <p className="text-xs text-slate-400">
                          লাইভ আরজে উপস্থিত না থাকলেও সমস্ত আপলোডকৃত ফাইল স্বয়ংক্রিয়ভাবে একের পর এক চলতে থাকবে
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempSettings.autoPilotEnabled}
                        onChange={(e) =>
                          setTempSettings({ ...tempSettings, autoPilotEnabled: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        স্ট্যান্ডার্ড স্ট্রিমিং গুণমান (Default Bitrate)
                      </label>
                      <select
                        value={tempSettings.defaultBitrate}
                        onChange={(e) =>
                          setTempSettings({
                            ...tempSettings,
                            defaultBitrate: e.target.value as '128k' | '320k' | 'lossless',
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value="128k">128 kbps (স্ট্যান্ডার্ড ব্যান্ডউইথ)</option>
                        <option value="320k">320 kbps (এইচডি স্টুডিও অডিও)</option>
                        <option value="lossless">Lossless (অরিজিনাল অডিও কোয়ালিটি)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        স্টেশন কন্টাক্ট ইমেইল (Contact Email)
                      </label>
                      <input
                        type="email"
                        value={tempSettings.contactEmail}
                        onChange={(e) =>
                          setTempSettings({ ...tempSettings, contactEmail: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-all cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>সমস্ত পরিবর্তন সংরক্ষণ করুন</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 4: LISTENER SONG REQUESTS MODERATION                         */}
          {/* ================================================================ */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="flex items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap mr-1">
                    স্ট্যাটাস ফিল্টার:
                  </span>
                  {(['all', 'pending', 'approved', 'played'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setRequestFilterStatus(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        requestFilterStatus === status
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {status === 'all'
                        ? 'সকল অনুরোধ'
                        : status === 'pending'
                        ? 'অপেক্ষমাণ (Pending)'
                        : status === 'approved'
                        ? 'অনুমোদিত (Approved)'
                        : 'বাজানো হয়েছে (Played)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Requests Table */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80">
                {filteredRequests.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-3">
                    <MessageSquare className="w-12 h-12 mx-auto text-slate-600 stroke-[1.5]" />
                    <p className="text-sm font-medium">কোনো গানের অনুরোধ নেই</p>
                  </div>
                ) : (
                  filteredRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-900/60 transition-colors"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">{req.requestedSong}</span>
                          <span className="text-xs text-slate-400">— {req.artist}</span>
                          {req.status === 'pending' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              অপেক্ষমাণ
                            </span>
                          )}
                          {req.status === 'approved' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              অনুমোদিত
                            </span>
                          )}
                          {req.status === 'played' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              বাজানো হয়েছে
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 italic">"{req.message}"</p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span>প্রেরক: <strong className="text-slate-200">{req.listenerName}</strong> ({req.location})</span>
                          <span>•</span>
                          <span>{req.timestamp}</span>
                        </div>
                      </div>

                      {/* Moderation Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {req.status !== 'approved' && (
                          <button
                            onClick={() => handleUpdateRequestStatus(req.id, 'approved')}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-medium cursor-pointer"
                            title="অনুরোধ অনুমোদন করুন"
                          >
                            অনুমোদন
                          </button>
                        )}
                        {req.status !== 'played' && (
                          <button
                            onClick={() => handleUpdateRequestStatus(req.id, 'played')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-medium cursor-pointer"
                            title="বাজানো হয়েছে হিসেবে চিহ্নিত করুন"
                          >
                            বাজানো হয়েছে
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRequest(req.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* EDIT TRACK MODAL POPUP                                             */}
        {/* ================================================================== */}
        {editingTrack && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>ট্র্যাক মেটাডাটা সম্পাদনা (Edit Track)</span>
                </h3>
                <button
                  onClick={() => setEditingTrack(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTrackEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    অডিও শিরোনাম (Title)
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTrack.title}
                    onChange={(e) => setEditingTrack({ ...editingTrack, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    শিল্পী / আরজে (Artist / Host)
                  </label>
                  <input
                    type="text"
                    value={editingTrack.artist}
                    onChange={(e) => setEditingTrack({ ...editingTrack, artist: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      ক্যাটাগরি / বিভাগ (Category)
                    </label>
                    <select
                      value={editingTrack.category}
                      onChange={(e) => setEditingTrack({ ...editingTrack, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      {CATEGORY_LIST.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      সম্প্রচার প্রকৃতি (Format)
                    </label>
                    <select
                      value={editingTrack.broadcastType || 'recorded'}
                      onChange={(e) =>
                        setEditingTrack({
                          ...editingTrack,
                          broadcastType: e.target.value as BroadcastType,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="recorded">রেকর্ডেড শো (Recorded)</option>
                      <option value="live">লাইভ সেশন (Live Stream)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    অনুষ্ঠানের নাম (Show Title)
                  </label>
                  <input
                    type="text"
                    value={editingTrack.showTitle || ''}
                    onChange={(e) => setEditingTrack({ ...editingTrack, showTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTrack(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-all cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

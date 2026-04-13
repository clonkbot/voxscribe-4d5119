import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Recording {
  id: string;
  title: string;
  transcript: string;
  duration: number;
  date: Date;
  topic: string;
  tags: string[];
  audioUrl?: string;
}

interface Topic {
  id: string;
  name: string;
  color: string;
}

const TOPICS: Topic[] = [
  { id: 'personal', name: 'Personal', color: '#f59e0b' },
  { id: 'work', name: 'Work', color: '#10b981' },
  { id: 'ideas', name: 'Ideas', color: '#8b5cf6' },
  { id: 'notes', name: 'Notes', color: '#ec4899' },
  { id: 'meetings', name: 'Meetings', color: '#06b6d4' },
];

const SAMPLE_RECORDINGS: Recording[] = [
  {
    id: '1',
    title: 'Morning Thoughts',
    transcript: 'Today I woke up thinking about the project deadline. We need to focus on the core features first and leave the polish for later iterations. The team seems motivated but we should have a quick sync to align on priorities.',
    duration: 45,
    date: new Date(Date.now() - 86400000),
    topic: 'work',
    tags: ['planning', 'team'],
  },
  {
    id: '2',
    title: 'Book Ideas',
    transcript: 'What if the protagonist discovers that their memories are actually from a parallel version of themselves? The twist could be that both versions are equally real, and they have to choose which life to continue living.',
    duration: 62,
    date: new Date(Date.now() - 172800000),
    topic: 'ideas',
    tags: ['writing', 'sci-fi'],
  },
  {
    id: '3',
    title: 'Grocery List',
    transcript: 'Need to pick up: organic eggs, almond milk, spinach, those fancy crackers mom likes, and maybe some flowers for the table. Oh, and cat food - the salmon kind.',
    duration: 23,
    date: new Date(Date.now() - 259200000),
    topic: 'personal',
    tags: ['shopping', 'errands'],
  },
];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function WaveformVisualizer({ isRecording, audioData }: { isRecording: boolean; audioData: number[] }) {
  return (
    <div className="flex items-center justify-center gap-[2px] h-16 md:h-24">
      {audioData.map((value, i) => (
        <motion.div
          key={i}
          className="w-1 md:w-1.5 rounded-full bg-gradient-to-t from-amber-600 to-amber-400"
          animate={{
            height: isRecording ? `${Math.max(8, value * 100)}%` : '8%',
          }}
          transition={{
            duration: 0.1,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

function RecordingCard({ recording, onClick, isSelected }: { recording: Recording; onClick: () => void; isSelected: boolean }) {
  const topic = TOPICS.find(t => t.id === recording.topic);

  return (
    <motion.button
      onClick={onClick}
      className={`w-full text-left p-4 md:p-5 rounded-xl border transition-all duration-300 ${
        isSelected
          ? 'bg-amber-500/10 border-amber-500/50'
          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
      }`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      layout
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-base md:text-lg text-cream truncate">{recording.title}</h3>
          <p className="text-xs md:text-sm text-zinc-500 mt-1">{formatDate(recording.date)} · {formatDuration(recording.duration)}</p>
        </div>
        <div
          className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0 mt-1.5"
          style={{ backgroundColor: topic?.color }}
        />
      </div>
      <p className="text-xs md:text-sm text-zinc-400 mt-3 line-clamp-2">{recording.transcript}</p>
      <div className="flex flex-wrap gap-1.5 md:gap-2 mt-3">
        {recording.tags.map(tag => (
          <span
            key={tag}
            className="px-2 py-0.5 md:py-1 text-[10px] md:text-xs rounded-full bg-zinc-800 text-zinc-400"
          >
            #{tag}
          </span>
        ))}
      </div>
    </motion.button>
  );
}

function TopicFilter({ selected, onSelect }: { selected: string | null; onSelect: (id: string | null) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-full transition-all ${
          selected === null
            ? 'bg-amber-500 text-zinc-900 font-medium'
            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
        }`}
      >
        All
      </button>
      {TOPICS.map(topic => (
        <button
          key={topic.id}
          onClick={() => onSelect(topic.id)}
          className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-full transition-all flex items-center gap-1.5 md:gap-2 ${
            selected === topic.id
              ? 'bg-amber-500 text-zinc-900 font-medium'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: selected === topic.id ? '#1a1a1a' : topic.color }}
          />
          {topic.name}
        </button>
      ))}
    </div>
  );
}

function RecordingPanel({
  isRecording,
  onToggleRecording,
  recordingTime,
  audioData,
}: {
  isRecording: boolean;
  onToggleRecording: () => void;
  recordingTime: number;
  audioData: number[];
}) {
  return (
    <motion.div
      className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-zinc-800"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="text-center">
        <motion.div
          className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-zinc-800/50 mb-4 md:mb-6"
          animate={{ opacity: isRecording ? 1 : 0.5 }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-red-500"
            animate={{ opacity: isRecording ? [1, 0.3, 1] : 0.3 }}
            transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
          />
          <span className="text-xs md:text-sm text-zinc-400 font-mono">
            {isRecording ? 'RECORDING' : 'READY'}
          </span>
        </motion.div>

        <div className="h-16 md:h-24 mb-4 md:mb-6 overflow-hidden">
          <WaveformVisualizer isRecording={isRecording} audioData={audioData} />
        </div>

        <div className="font-mono text-3xl md:text-5xl text-cream mb-6 md:mb-8 tracking-wider">
          {formatDuration(recordingTime)}
        </div>

        <motion.button
          onClick={onToggleRecording}
          className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-amber-500 hover:bg-amber-400'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isRecording ? (
            <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-white" />
          ) : (
            <svg className="w-7 h-7 md:w-8 md:h-8 text-zinc-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          )}
        </motion.button>

        <p className="text-xs md:text-sm text-zinc-500 mt-4">
          {isRecording ? 'Tap to stop' : 'Tap to start recording'}
        </p>
      </div>
    </motion.div>
  );
}

function TranscriptView({ recording, onClose, onUpdateRecording }: {
  recording: Recording;
  onClose: () => void;
  onUpdateRecording: (updated: Recording) => void;
}) {
  const topic = TOPICS.find(t => t.id === recording.topic);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState(recording.transcript);
  const [editedTitle, setEditedTitle] = useState(recording.title);
  const [newTag, setNewTag] = useState('');

  const handleSave = () => {
    onUpdateRecording({
      ...recording,
      title: editedTitle,
      transcript: editedTranscript,
    });
    setIsEditing(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !recording.tags.includes(newTag.trim().toLowerCase())) {
      onUpdateRecording({
        ...recording,
        tags: [...recording.tags, newTag.trim().toLowerCase()],
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateRecording({
      ...recording,
      tags: recording.tags.filter(t => t !== tagToRemove),
    });
  };

  const handleTopicChange = (topicId: string) => {
    onUpdateRecording({
      ...recording,
      topic: topicId,
    });
  };

  return (
    <motion.div
      className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-5 md:p-8 border border-zinc-800 h-full flex flex-col"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="flex items-start justify-between mb-4 md:mb-6">
        <div className="flex-1 min-w-0 pr-3">
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-cream font-serif text-xl md:text-2xl focus:outline-none focus:border-amber-500"
            />
          ) : (
            <h2 className="font-serif text-xl md:text-2xl text-cream truncate">{recording.title}</h2>
          )}
          <div className="flex items-center gap-2 md:gap-3 mt-2 text-xs md:text-sm text-zinc-500">
            <span>{formatDate(recording.date)}</span>
            <span>·</span>
            <span>{formatDuration(recording.duration)}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mb-4 md:mb-6">
        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Topic</label>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map(t => (
            <button
              key={t.id}
              onClick={() => handleTopicChange(t.id)}
              className={`px-2.5 py-1 md:px-3 md:py-1.5 text-xs rounded-full transition-all flex items-center gap-1.5 ${
                recording.topic === t.id
                  ? ''
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                backgroundColor: `${t.color}20`,
                color: t.color,
                boxShadow: recording.topic === t.id ? `0 0 0 2px #18181b, 0 0 0 4px ${t.color}` : undefined,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: t.color }}
              />
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 md:mb-6">
        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Tags</label>
        <div className="flex flex-wrap items-center gap-2">
          {recording.tags.map(tag => (
            <span
              key={tag}
              className="px-2.5 py-1 md:px-3 md:py-1.5 text-xs rounded-full bg-zinc-800 text-zinc-300 flex items-center gap-1.5"
            >
              #{tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-red-400 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="Add tag..."
              className="w-20 md:w-24 bg-transparent border-b border-zinc-700 px-1 py-1 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleAddTag}
              className="p-1 hover:bg-zinc-800 rounded transition-colors"
            >
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs text-zinc-500 uppercase tracking-wider">Transcript</label>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
          >
            {isEditing ? 'Save' : 'Edit'}
          </button>
        </div>

        {isEditing ? (
          <textarea
            value={editedTranscript}
            onChange={(e) => setEditedTranscript(e.target.value)}
            className="flex-1 w-full bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 text-sm md:text-base text-zinc-300 leading-relaxed resize-none focus:outline-none focus:border-amber-500"
          />
        ) : (
          <div className="flex-1 overflow-auto bg-zinc-800/30 rounded-xl p-4">
            <p className="text-sm md:text-base text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {recording.transcript}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-zinc-800">
        <button className="flex-1 px-4 py-2.5 md:py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm text-zinc-300 transition-colors flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </button>
        <button className="flex-1 px-4 py-2.5 md:py-3 bg-amber-500 hover:bg-amber-400 rounded-xl text-sm text-zinc-900 font-medium transition-colors flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [recordings, setRecordings] = useState<Recording[]>(SAMPLE_RECORDINGS);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioData, setAudioData] = useState<number[]>(Array(40).fill(0.1));
  const [showMobileRecorder, setShowMobileRecorder] = useState(false);

  const timerRef = useRef<number | null>(null);
  const audioIntervalRef = useRef<number | null>(null);

  const filteredRecordings = selectedTopic
    ? recordings.filter(r => r.topic === selectedTopic)
    : recordings;

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      // Stop recording
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);

      // Create new recording
      if (recordingTime > 0) {
        const newRecording: Recording = {
          id: Date.now().toString(),
          title: `Recording ${recordings.length + 1}`,
          transcript: 'Transcribing... (In a real app, this would use the Web Speech API or a transcription service)',
          duration: recordingTime,
          date: new Date(),
          topic: 'notes',
          tags: ['new'],
        };
        setRecordings(prev => [newRecording, ...prev]);
        setSelectedRecording(newRecording);
      }

      setRecordingTime(0);
      setAudioData(Array(40).fill(0.1));
      setIsRecording(false);
      setShowMobileRecorder(false);
    } else {
      // Start recording
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Simulate audio data
      audioIntervalRef.current = window.setInterval(() => {
        setAudioData(prev => prev.map(() => 0.1 + Math.random() * 0.8));
      }, 100);
    }
  }, [isRecording, recordingTime, recordings.length]);

  const handleUpdateRecording = (updated: Recording) => {
    setRecordings(prev => prev.map(r => r.id === updated.id ? updated : r));
    setSelectedRecording(updated);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-zinc-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </div>
              <div>
                <h1 className="font-serif text-xl md:text-2xl text-cream">Voxscribe</h1>
                <p className="text-[10px] md:text-xs text-zinc-500 hidden sm:block">Voice to text, organized</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-xs md:text-sm text-zinc-500 hidden md:inline">{recordings.length} recordings</span>
              {/* Mobile record button */}
              <button
                onClick={() => setShowMobileRecorder(true)}
                className="lg:hidden p-2.5 md:p-3 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-zinc-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 h-full">
          {/* Left sidebar - Recordings list */}
          <motion.div
            className="lg:col-span-5 xl:col-span-4 flex flex-col"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-4 md:mb-6">
              <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Filter by Topic</h2>
              <TopicFilter selected={selectedTopic} onSelect={setSelectedTopic} />
            </div>

            <div className="flex-1 overflow-auto space-y-3 pr-1">
              <AnimatePresence mode="popLayout">
                {filteredRecordings.map((recording, index) => (
                  <motion.div
                    key={recording.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <RecordingCard
                      recording={recording}
                      onClick={() => setSelectedRecording(recording)}
                      isSelected={selectedRecording?.id === recording.id}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredRecordings.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-zinc-500 text-sm">No recordings found</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right panel - Recording or Transcript */}
          <div className="lg:col-span-7 xl:col-span-8 hidden lg:block">
            <AnimatePresence mode="wait">
              {selectedRecording ? (
                <TranscriptView
                  key={selectedRecording.id}
                  recording={selectedRecording}
                  onClose={() => setSelectedRecording(null)}
                  onUpdateRecording={handleUpdateRecording}
                />
              ) : (
                <RecordingPanel
                  key="recorder"
                  isRecording={isRecording}
                  onToggleRecording={toggleRecording}
                  recordingTime={recordingTime}
                  audioData={audioData}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Mobile Recording Modal */}
      <AnimatePresence>
        {showMobileRecorder && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden bg-zinc-950/95 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <button
                onClick={() => !isRecording && setShowMobileRecorder(false)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <RecordingPanel
                isRecording={isRecording}
                onToggleRecording={toggleRecording}
                recordingTime={recordingTime}
                audioData={audioData}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Transcript Modal */}
      <AnimatePresence>
        {selectedRecording && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden bg-zinc-950/95 backdrop-blur-sm overflow-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="min-h-full p-4 py-6">
              <TranscriptView
                recording={selectedRecording}
                onClose={() => setSelectedRecording(null)}
                onUpdateRecording={handleUpdateRecording}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/50 py-4 md:py-5">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <p className="text-center text-xs text-zinc-600">
            Requested by <span className="text-zinc-500">@nplxdesign</span> · Built by <span className="text-zinc-500">@clonkbot</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

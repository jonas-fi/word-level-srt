'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, Download, Settings } from 'lucide-react';

interface TranscriptionResult {
  success: boolean;
  result: string;
  language: string;
  format: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Settings state
  const [language, setLanguage] = useState('auto');
  const [outputFormat, setOutputFormat] = useState('srt');
  const [srtMode, setSrtMode] = useState('word_level');
  const [maxChars, setMaxChars] = useState('50');
  const [maxWords, setMaxWords] = useState('1');
  const [allLowercase, setAllLowercase] = useState(false);
  const [allUppercase, setAllUppercase] = useState(false);
  const [removeAllPunctuation, setRemoveAllPunctuation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      setError(null);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac'],
      'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm']
    },
    maxFiles: 1,
    maxSize: 25 * 1024 * 1024, // 25MB
  });

  const handleTranscribe = async () => {
    if (!file) return;

    setIsTranscribing(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);
      formData.append('outputFormat', outputFormat);
      formData.append('srtMode', srtMode);
      formData.append('maxChars', maxChars);
      formData.append('maxWords', maxWords);
      formData.append('allLowercase', allLowercase.toString());
      formData.append('allUppercase', allUppercase.toString());
      formData.append('removeAllPunctuation', removeAllPunctuation.toString());

      setProgress(20);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      setProgress(80);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transcription failed');
      }

      setResult(data);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;

    const blob = new Blob([result.result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription.${result.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#3A86FF] to-blue-400 bg-clip-text text-transparent">
            Whisper Transkription
          </h1>
          <p className="text-gray-400 text-lg">
            Professionelle Audio- und Video-Transkription mit OpenAI Whisper
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* File Upload */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#3A86FF]" />
                Datei hochladen
              </h2>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-[#3A86FF] bg-blue-900/20'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <input {...getInputProps()} />
                <FileAudio className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                {file ? (
                  <div>
                    <p className="text-[#3A86FF] font-medium">{file.name}</p>
                    <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-medium mb-2">
                      {isDragActive ? 'Datei hier ablegen' : 'Datei auswählen oder hier ablegen'}
                    </p>
                    <p className="text-sm text-gray-400">
                      MP3, WAV, MP4, AVI und weitere Formate bis 25MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Settings Toggle */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center justify-between text-lg font-semibold"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#3A86FF]" />
                  Einstellungen
                </span>
                <span className={`transform transition-transform ${showSettings ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-6">
                {/* Language */}
                <div>
                  <label className="block text-sm font-medium mb-2">Sprache</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-[#3A86FF] focus:outline-none"
                  >
                    <option value="auto">Automatisch erkennen</option>
                    <option value="de">Deutsch</option>
                    <option value="en">Englisch</option>
                    <option value="fr">Französisch</option>
                    <option value="es">Spanisch</option>
                    <option value="it">Italienisch</option>
                  </select>
                </div>

                {/* Output Format */}
                <div>
                  <label className="block text-sm font-medium mb-2">Ausgabeformat</label>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-[#3A86FF] focus:outline-none"
                  >
                    <option value="srt">SRT (Untertitel)</option>
                    <option value="txt">TXT (Text)</option>
                  </select>
                </div>

                {/* SRT Settings */}
                {outputFormat === 'srt' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">SRT-Modus</label>
                      <select
                        value={srtMode}
                        onChange={(e) => setSrtMode(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-[#3A86FF] focus:outline-none"
                      >
                        <option value="word_level">Wort-für-Wort</option>
                        <option value="char_limit">Zeichen-Limit</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {srtMode === 'word_level' ? 'Max. Wörter' : 'Max. Zeichen'}
                        </label>
                        <input
                          type="number"
                          value={srtMode === 'word_level' ? maxWords : maxChars}
                          onChange={(e) => srtMode === 'word_level' ? setMaxWords(e.target.value) : setMaxChars(e.target.value)}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-[#3A86FF] focus:outline-none"
                          min="1"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Text Formatting */}
                <div>
                  <label className="block text-sm font-medium mb-2">Text-Formatierung</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="lowercase"
                        checked={allLowercase}
                        onChange={(e) => {
                          setAllLowercase(e.target.checked);
                          if (e.target.checked) setAllUppercase(false);
                        }}
                        className="w-4 h-4 text-[#3A86FF] bg-gray-800 border-gray-700 rounded focus:ring-[#3A86FF]"
                      />
                      <label htmlFor="lowercase" className="text-sm">Alles klein</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="uppercase"
                        checked={allUppercase}
                        onChange={(e) => {
                          setAllUppercase(e.target.checked);
                          if (e.target.checked) setAllLowercase(false);
                        }}
                        className="w-4 h-4 text-[#3A86FF] bg-gray-800 border-gray-700 rounded focus:ring-[#3A86FF]"
                      />
                      <label htmlFor="uppercase" className="text-sm">Alles groß</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="noPunctuation"
                        checked={removeAllPunctuation}
                        onChange={(e) => setRemoveAllPunctuation(e.target.checked)}
                        className="w-4 h-4 text-[#3A86FF] bg-gray-800 border-gray-700 rounded focus:ring-[#3A86FF]"
                      />
                      <label htmlFor="noPunctuation" className="text-sm">Alle Satzzeichen entfernen</label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transcribe Button */}
            <button
              onClick={handleTranscribe}
              disabled={!file || isTranscribing}
              className="w-full bg-gradient-to-r from-[#3A86FF] to-blue-600 hover:from-blue-600 hover:to-[#3A86FF] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              {isTranscribing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Transkribiere...
                </div>
              ) : (
                'Transkribieren'
              )}
            </button>

            {/* Progress Bar */}
            {isTranscribing && (
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="mb-2 flex justify-between text-sm">
                  <span>Fortschritt</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#3A86FF] to-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 min-h-[400px]">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-[#3A86FF]" />
                Ergebnis
              </h2>

              {error && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300">
                  <p className="font-medium">Fehler:</p>
                  <p>{error}</p>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Sprache: {result.language} | Format: {result.format.toUpperCase()}
                    </div>
                    <button
                      onClick={handleDownload}
                      className="bg-[#3A86FF] hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                      {result.result}
                    </pre>
                  </div>
                </div>
              )}

              {!result && !error && !isTranscribing && (
                <div className="text-center text-gray-400 py-12">
                  <FileAudio className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Laden Sie eine Datei hoch und klicken Sie auf "Transkribieren"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>Unterstützt Audio- und Video-Dateien bis 25MB • Automatische Spracherkennung • Wort-für-Wort Timestamps</p>
        </div>
      </div>
    </div>
  );
}
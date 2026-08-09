import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  Upload,
  Trash2,
  Download,
  RotateCw,
  Check,
  Image as ImageIcon,
  Plus,
  Maximize2,
  Sparkles,
} from "lucide-react";
import { WorkItem } from "../types";

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  workItem: { siteName: string; unit: string; floor: string; index: number; item: WorkItem } | null;
  onUpdatePhotos: (siteName: string, unit: string, floor: string, index: number, photos: string[]) => void;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({
  isOpen,
  onClose,
  workItem,
  onUpdatePhotos,
}) => {
  const [activeTab, setActiveTab] = useState<"gallery" | "camera">("gallery");
  const [photos, setPhotos] = useState<string[]>([]);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedImageForLightbox, setSelectedImageForLightbox] = useState<string | null>(null);
  const [flashAnimation, setFlashAnimation] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync photos when workItem changes
  useEffect(() => {
    if (workItem?.item) {
      setPhotos(workItem.item.photos || []);
    } else {
      setPhotos([]);
    }
  }, [workItem]);

  // Start / Stop camera stream when tab or modal changes
  useEffect(() => {
    if (isOpen && activeTab === "camera") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Camera access error:", err);
      setCameraError(
        err.message || "Could not access device camera. Please check camera permissions or use file upload."
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Compress & resize image to data URL
  const compressImage = (imageElement: HTMLImageElement | HTMLVideoElement): string => {
    const canvas = document.createElement("canvas");
    const maxDim = 1000;

    let width = imageElement instanceof HTMLVideoElement ? imageElement.videoWidth : imageElement.naturalWidth;
    let height = imageElement instanceof HTMLVideoElement ? imageElement.videoHeight : imageElement.naturalHeight;

    if (!width || !height) {
      width = 800;
      height = 600;
    }

    if (width > height) {
      if (width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      }
    } else {
      if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(imageElement, 0, 0, width, height);
    }

    return canvas.toDataURL("image/jpeg", 0.75);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;

    // Trigger visual flash feedback
    setFlashAnimation(true);
    setTimeout(() => setFlashAnimation(false), 200);

    const photoDataUrl = compressImage(videoRef.current);
    const updatedPhotos = [...photos, photoDataUrl];
    setPhotos(updatedPhotos);

    if (workItem) {
      onUpdatePhotos(workItem.siteName, workItem.unit, workItem.floor, workItem.index, updatedPhotos);
    }

    // Switch to gallery tab after capture
    setTimeout(() => {
      setActiveTab("gallery");
    }, 400);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    const newPhotoPromises: Promise<string>[] = fileList.map((file: File) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const compressed = compressImage(img);
            resolve(compressed);
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newPhotoPromises).then((uploadedPhotos) => {
      const updatedPhotos = [...photos, ...uploadedPhotos];
      setPhotos(updatedPhotos);
      if (workItem) {
        onUpdatePhotos(workItem.siteName, workItem.unit, workItem.floor, workItem.index, updatedPhotos);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  const handleDeletePhoto = (photoIdx: number) => {
    const updated = photos.filter((_, i) => i !== photoIdx);
    setPhotos(updated);
    if (workItem) {
      onUpdatePhotos(workItem.siteName, workItem.unit, workItem.floor, workItem.index, updated);
    }
    if (selectedImageForLightbox === photos[photoIdx]) {
      setSelectedImageForLightbox(null);
    }
  };

  const handleDownloadPhoto = (dataUrl: string, idx: number) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `site-photo-${workItem?.unit || "unit"}-${workItem?.item.area || "area"}-${idx + 1}.jpg`;
    link.click();
  };

  if (!isOpen || !workItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Site Documentation Photos
                <span className="text-xs bg-indigo-900/80 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-700 font-semibold">
                  {photos.length} Photo{photos.length === 1 ? "" : "s"}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {workItem.unit} &bull; {workItem.floor} &bull; <span className="text-indigo-300 font-medium">{workItem.item.area}</span>: {workItem.item.work}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab("gallery")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "gallery"
                ? "border-indigo-600 text-indigo-600 bg-white rounded-t-lg shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Photo Gallery ({photos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("camera")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "camera"
                ? "border-indigo-600 text-indigo-600 bg-white rounded-t-lg shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Take Photo with Camera</span>
          </button>

          <label
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 my-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
            title="Upload image files directly"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>Upload File</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === "gallery" ? (
            /* Gallery Tab */
            <div>
              {photos.length === 0 ? (
                <div className="py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-4 bg-slate-50/50">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto border border-indigo-100 shadow-sm">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-base">No Photos Attached Yet</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Snap live pictures directly from your phone/tablet camera or upload photos from your device to document work progress.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setActiveTab("camera")}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Open Camera
                    </button>
                    <label className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-2xs transition-all">
                      <Upload className="w-4 h-4 text-slate-500" />
                      Upload Photos
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="group relative bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-2xs aspect-4/3 flex items-center justify-center hover:border-indigo-400 transition-all"
                    >
                      <img
                        src={photo}
                        alt={`Work photo ${idx + 1}`}
                        className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                        onClick={() => setSelectedImageForLightbox(photo)}
                      />

                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs">
                        <button
                          onClick={() => setSelectedImageForLightbox(photo)}
                          className="p-2 bg-white/90 hover:bg-white text-slate-800 rounded-lg shadow-sm transition-transform hover:scale-110"
                          title="View larger"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPhoto(photo, idx)}
                          className="p-2 bg-white/90 hover:bg-white text-slate-800 rounded-lg shadow-sm transition-transform hover:scale-110"
                          title="Download photo"
                        >
                          <Download className="w-4 h-4 text-indigo-600" />
                        </button>
                        <button
                          onClick={() => handleDeletePhoto(idx)}
                          className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-transform hover:scale-110"
                          title="Delete photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="absolute bottom-1 left-1.5 px-2 py-0.5 bg-slate-900/80 text-white text-[10px] font-semibold rounded-md backdrop-blur-2xs">
                        #{idx + 1}
                      </div>
                    </div>
                  ))}

                  {/* Quick Add Tile */}
                  <div
                    onClick={() => setActiveTab("camera")}
                    className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl aspect-4/3 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/40 cursor-pointer transition-all p-3 text-center gap-1.5"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-xs font-semibold">Snap Another Photo</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Live Camera View Tab */
            <div className="space-y-4">
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-16/9 flex items-center justify-center border border-slate-800 shadow-inner">
                {/* Flash effect */}
                {flashAnimation && (
                  <div className="absolute inset-0 bg-white z-20 animate-ping opacity-80 pointer-events-none" />
                )}

                {cameraError ? (
                  <div className="p-6 text-center space-y-3 text-slate-300 max-w-md">
                    <p className="text-sm font-semibold text-rose-400">{cameraError}</p>
                    <p className="text-xs text-slate-400">
                      You can use the native camera file capture instead:
                    </p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md transition-all">
                      <Camera className="w-4 h-4" />
                      Take Photo via File Prompt
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Switch Camera Overlay Button */}
                {isCameraActive && !cameraError && (
                  <button
                    onClick={toggleCameraFacingMode}
                    className="absolute top-3 right-3 p-2.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl border border-slate-700/80 backdrop-blur-md transition-all cursor-pointer shadow-lg"
                    title="Flip camera (front / back)"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 py-2">
                <button
                  onClick={handleCapturePhoto}
                  disabled={!isCameraActive || !!cameraError}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-sm flex items-center gap-2.5 shadow-lg hover:shadow-indigo-500/25 transition-all cursor-pointer transform active:scale-95"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                  <span>Capture Photo</span>
                </button>

                <label
                  className="px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-2xs transition-all"
                  title="Or pick photo from gallery"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Choose Existing File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Photos automatically save and sync with this work item in real-time.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Lightbox Modal for Full View */}
      {selectedImageForLightbox && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setSelectedImageForLightbox(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImageForLightbox}
              alt="Enlarged documentation photo"
              className="max-w-full max-h-[80vh] object-contain rounded-t-2xl bg-black"
            />
            <div className="bg-slate-900 text-white w-full px-6 py-3 flex items-center justify-between border-t border-slate-800">
              <span className="text-xs text-slate-300 font-medium">
                {workItem.unit} - {workItem.item.area}: {workItem.item.work}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleDownloadPhoto(selectedImageForLightbox, photos.indexOf(selectedImageForLightbox))
                  }
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button
                  onClick={() => setSelectedImageForLightbox(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
